'use client'

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Copy,
  Pencil,
  Calendar,
  Clock
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAlert } from '@/components/ui/alert-provider';
import TrainingCard from './TrainingCard';
import TrainingDetailModal from './TrainingDetailModal';

interface Settings {
  payment_bank_name: string;
  payment_account_number: string;
  payment_account_name: string;
  payment_amount: string;
  admin_form_link: string;
}

interface Training {
  id: string;
  batch: string;
  title: string;
  startAt: string;
  endAt: string;
  location: string;
  journalCode: string;
  mentorName: string;
  quota: number;
  _count?: {
    flows: number;
  };
  createdAt: string;
}

export default function JadwalPelatihanView() {
  const { showAlert } = useAlert();
  const [settings, setSettings] = useState<Settings>({
    payment_bank_name: '',
    payment_account_number: '',
    payment_account_name: '',
    payment_amount: '',
    admin_form_link: '',
  });
  
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 9, total: 0, totalPage: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit States
  const [isEditSettingsOpen, setIsEditSettingsOpen] = useState(false);
  const [isEditLinkOpen, setIsEditLinkOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  // Add Training State
  const [isAddTrainingOpen, setIsAddTrainingOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // New state for edit mode
  const [addForm, setAddForm] = useState<any>({
    batch: '',
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    journalCode: '',
    mentorName: '',
    quota: '',
  });

  // Detail Modal State
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // --- Fetch Data ---
  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/settings', {
         headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const fetchTrainings = async () => {
    try {
      const params: any = {
        page: meta.page,
        limit: meta.limit,
      };
      if (searchQuery) params.search = searchQuery;

      const token = localStorage.getItem('token');
      const res = await api.get('/admin/trainings', { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrainings(res.data.data);
      setMeta({
        page: res.data.page,
        limit: res.data.limit,
        total: res.data.total,
        totalPage: Math.ceil(res.data.total / res.data.limit)
      });
    } catch (err) {
      console.error('Failed to fetch trainings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchTrainings();
  }, [meta.page]);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setMeta(prev => ({ ...prev, page: 1 }));
      fetchTrainings();
    }
  };

  // --- Update Settings Logic ---
  const handleOpenEditSettings = () => {
    setEditForm({
      payment_bank_name: settings.payment_bank_name,
      payment_amount: settings.payment_amount,
      payment_account_number: settings.payment_account_number,
      payment_account_name: settings.payment_account_name,
    });
    setIsEditSettingsOpen(true);
  };

  const handleOpenEditLink = () => {
    setEditForm({
      admin_form_link: settings.admin_form_link
    });
    setIsEditLinkOpen(true);
  };

  const handleSaveSettings = async (keys: string[]) => {
    try {
      const payload: any = {};
      keys.forEach(key => {
        payload[key] = editForm[key];
      });

      const token = localStorage.getItem('token');
      await api.patch('/settings', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchSettings();
      setIsEditSettingsOpen(false);
      setIsEditLinkOpen(false);
      showAlert({
        title: 'Berhasil',
        message: 'Pengaturan berhasil disimpan!',
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to update settings:', err);
      showAlert({
        title: 'Gagal',
        message: getErrorMessage(err),
        type: 'error'
      });
    }
  };

  // --- Add/Edit Training Logic ---
  const handleOpenAddTraining = () => {
    setIsEditMode(false);
    setAddForm({
      batch: '',
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      journalCode: '',
      mentorName: '',
      quota: '',
    });
    setIsAddTrainingOpen(true);
  };

  // Helper to parse ISO to local inputs
  const isoToLocal = (iso: string) => {
    const date = new Date(iso);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`
    };
  };

  const handleEditFromDetail = (training: any) => {
    setIsDetailModalOpen(false); // Close detail modal
    setIsEditMode(true);
    
    const start = isoToLocal(training.startAt);
    const end = isoToLocal(training.endAt);

    setAddForm({
      batch: training.batch,
      title: training.title,
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      location: training.location,
      journalCode: training.journalCode,
      mentorName: training.mentorName,
      quota: training.quota,
    });
    // Ensure selectedTrainingId is set (it should be if coming from detail, but good to ensure)
    setSelectedTrainingId(training.id);
    setIsAddTrainingOpen(true);
  };

  const handleSubmitTraining = async () => {
    try {
      // Ensure time is HH:mm and default seconds to :00
      const startTimeClean = addForm.startTime.slice(0, 5);
      const endTimeClean = addForm.endTime.slice(0, 5);

      const startAt = new Date(`${addForm.date}T${startTimeClean}:00`).toISOString();
      const endAt = new Date(`${addForm.date}T${endTimeClean}:00`).toISOString();

      const payload = {
        batch: addForm.batch,
        title: addForm.title,
        startAt: startAt,
        endAt: endAt,
        location: addForm.location,
        journalCode: addForm.journalCode,
        mentorName: addForm.mentorName,
        quota: Number(addForm.quota)
      };

      const token = localStorage.getItem('token'); // Ensure token is used if api instance doesn't auto-attach (though it seems it does via interceptor, but manual header in fetchSettings uses it, let's follow consistency or trust interceptor. Interceptor uses 'token' from localStorage. OK.)

      if (isEditMode && selectedTrainingId) {
         await api.patch(`/admin/trainings/${selectedTrainingId}`, payload);
         showAlert({ title: 'Berhasil', message: 'Jadwal pelatihan berhasil diperbarui!', type: 'success' });
      } else {
         await api.post('/admin/trainings', payload);
         showAlert({ title: 'Berhasil', message: 'Jadwal pelatihan berhasil dibuat!', type: 'success' });
      }
      
      setIsAddTrainingOpen(false);
      // Refresh list
      if (!isEditMode) setMeta(prev => ({ ...prev, page: 1 })); 
      fetchTrainings();
    } catch (err: any) {
      console.error('Failed to save training:', err);
      showAlert({
        title: 'Gagal',
        message: getErrorMessage(err),
        type: 'error'
      });
    }
  };

  // --- Format Helpers ---
  const formatCurrency = (val: string | number) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return 'Pilih Tanggal';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Pilih Tanggal';
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return 'Pilih Tanggal';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. Informasi Pembayaran Pelatihan */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-[#5C7B78] text-xl font-bold mb-6">Informasi Pembayaran Pelatihan</h2>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              <div>
                 <p className="text-gray-500 text-sm mb-1">Nama Bank</p>
                 <p className="text-xl font-bold text-gray-800">{settings.payment_bank_name}</p>
              </div>
              <div>
                 <p className="text-gray-500 text-sm mb-1">Biaya Pelatihan</p>
                 <p className="text-xl font-bold text-gray-800">{formatCurrency(settings.payment_amount)}</p>
              </div>
              <div>
                 <p className="text-gray-500 text-sm mb-1">Nomor Rekening</p>
                 <p className="text-xl font-bold text-gray-800">{settings.payment_account_number}</p>
              </div>
              <div>
                 <p className="text-gray-500 text-sm mb-1">Nama Pemilik Rekening</p>
                 <p className="text-xl font-bold text-gray-800">{settings.payment_account_name}</p>
              </div>
           </div>
           <div className="shrink-0">
             <div className="flex flex-col items-center gap-1">
                <span className="text-gray-500 text-sm font-medium">Aksi</span>
                <Button 
                   onClick={handleOpenEditSettings}
                   className="bg-[#6B8E88] hover:bg-[#5a7872] text-white px-8"
                >
                   Edit
                </Button>
             </div>
           </div>
        </div>
      </div>

      {/* 2. Informasi Link Form Administratif */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
         <h2 className="text-[#5C7B78] text-xl font-bold mb-6">Informasi Link Form Administratif</h2>
         <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
               <input 
                 type="text" 
                 readOnly
                 value={settings.admin_form_link || ''}
                 className="w-full border border-gray-300 rounded-lg py-3 pl-4 pr-12 text-gray-600 bg-white"
               />
               <Copy className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => navigator.clipboard.writeText(settings.admin_form_link)} />
            </div>
            <Button 
               onClick={handleOpenEditLink}
               className="bg-[#6B8E88] hover:bg-[#5a7872] text-white px-8 py-6 text-lg font-bold w-full md:w-auto"
            >
               Edit
            </Button>
         </div>
      </div>

      {/* 3. Jadwal Pelatihan */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm min-h-[500px]">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-[#5C7B78] text-2xl font-bold">Jadwal Pelatihan</h2>
            <Button 
               onClick={handleOpenAddTraining}
               className="bg-[#5C7B78] hover:bg-[#4a6361] text-white gap-2"
            >
               <Plus className="w-5 h-5" />
               Tambah Jadwal
            </Button>
         </div>

         {/* Search */}
         <div className="mb-8">
            <div className="relative w-full">
               <input 
                 type="text" 
                 placeholder="Cari Judul, Lokasi, atau Dosen"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyDown={handleSearch}
                 className="w-full border border-gray-400 rounded-lg py-3 pl-6 pr-4 text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-[#5C7B78] focus:border-transparent outline-none"
               />
            </div>
         </div>

         {/* Grid */}
         {loading ? (
             <div className="text-center py-20 text-gray-400">Memuat jadwal...</div>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-1">
                {trainings.map((training) => (
                   <TrainingCard 
                      key={training.id} 
                      training={training} 
                      onDetail={(id) => {
                         setSelectedTrainingId(id);
                         setIsDetailModalOpen(true);
                      }} 
                   />
                ))}
                {trainings.length === 0 && (
                   <div className="col-span-full text-center py-20 text-gray-400">Tidak ada jadwal pelatihan ditemukan.</div>
                )}
             </div>
         )}

         {/* Pagination */}
         <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-6 border-t border-gray-100 text-sm text-gray-600 gap-4">
             <div>
                Menampilkan <span className="font-bold">{trainings.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}-{Math.min(meta.page * meta.limit, meta.total)}</span> dari <span className="font-bold">{meta.total}</span> Jadwal
             </div>
             <div className="flex items-center gap-2">
                <Button
                   variant="outline"
                   size="icon"
                   onClick={() => setMeta({...meta, page: Math.max(1, meta.page - 1)})}
                   disabled={meta.page === 1}
                   className="w-9 h-9"
                >
                   <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-2 font-medium">
                   Halaman <span className="font-bold text-gray-900">{meta.page}</span> dari {meta.totalPage}
                </div>
                <Button
                   variant="outline"
                   size="icon"
                   onClick={() => setMeta({...meta, page: Math.min(meta.totalPage, meta.page + 1)})}
                   disabled={meta.page === meta.totalPage}
                   className="w-9 h-9"
                >
                   <ChevronRight className="w-4 h-4" />
                </Button>
             </div>
         </div>
      </div>

      {/* --- Dialog: Edit Settings --- */}
      <Dialog open={isEditSettingsOpen} onOpenChange={setIsEditSettingsOpen}>
         <DialogContent className="max-w-[800px] p-8 rounded-2xl bg-white">
            <DialogHeader>
               <DialogTitle className="text-[#5C7B78] font-bold text-2xl mb-6">Edit Informasi Pembayaran Pelatihan</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
               <div>
                  <label className="text-sm font-bold text-[#5C7B78] block mb-2">Nama Bank</label>
                  <input 
                     type="text"
                     className="w-full border border-[#5C7B78] rounded-lg p-3 text-lg font-bold text-gray-800 outline-none focus:ring-1 focus:ring-[#5C7B78]"
                     value={editForm.payment_bank_name || ''}
                     onChange={(e) => setEditForm({...editForm, payment_bank_name: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-sm font-bold text-[#5C7B78] block mb-2">Biaya Pelatihan</label>
                  <input 
                     type="number"
                     className="w-full border border-[#5C7B78] rounded-lg p-3 text-lg font-bold text-gray-800 outline-none focus:ring-1 focus:ring-[#5C7B78]"
                     value={editForm.payment_amount || ''}
                     onChange={(e) => setEditForm({...editForm, payment_amount: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-sm font-bold text-[#5C7B78] block mb-2">Nomor Rekening</label>
                  <input 
                     type="text"
                     className="w-full border border-[#5C7B78] rounded-lg p-3 text-lg font-bold text-gray-800 outline-none focus:ring-1 focus:ring-[#5C7B78]"
                     value={editForm.payment_account_number || ''}
                     onChange={(e) => setEditForm({...editForm, payment_account_number: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-sm font-bold text-[#5C7B78] block mb-2">Nama Pemilik Rekening</label>
                  <input 
                     type="text"
                     className="w-full border border-[#5C7B78] rounded-lg p-3 text-lg font-medium text-gray-800 outline-none focus:ring-1 focus:ring-[#5C7B78]"
                     value={editForm.payment_account_name || ''}
                     onChange={(e) => setEditForm({...editForm, payment_account_name: e.target.value})}
                  />
               </div>
            </div>
            <DialogFooter className="mt-8 flex gap-4">
               <Button 
                  variant="outline" 
                  onClick={() => setIsEditSettingsOpen(false)}
                  className="border-[#D15651] text-[#D15651] hover:bg-[#D15651] hover:text-white px-8 py-2 rounded-xl text-lg font-bold w-32"
               >
                  Batal
               </Button>
               <Button 
                 className="bg-[#5C7B78] hover:bg-[#4a6361] text-white px-8 py-2 rounded-xl text-lg font-bold w-32"
                 onClick={() => handleSaveSettings(['payment_bank_name', 'payment_amount', 'payment_account_number', 'payment_account_name'])}
               >
                  Update
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* --- Dialog: Edit Link --- */}
      <Dialog open={isEditLinkOpen} onOpenChange={setIsEditLinkOpen}>
         <DialogContent className="max-w-[800px] p-8 rounded-2xl bg-white">
            <DialogHeader>
               <DialogTitle className="text-[#5C7B78] font-bold text-2xl mb-6">Edit Link Form Administratif</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
               <div>
                  <input 
                     type="text"
                     className="w-full border border-[#5C7B78] rounded-lg p-3 text-lg font-medium text-gray-800 outline-none focus:ring-1 focus:ring-[#5C7B78]"
                     value={editForm.admin_form_link || ''}
                     onChange={(e) => setEditForm({...editForm, admin_form_link: e.target.value})}
                  />
               </div>
            </div>
            <DialogFooter className="mt-8 flex gap-4">
               <Button 
                  variant="outline" 
                  onClick={() => setIsEditLinkOpen(false)}
                  className="border-[#D15651] text-[#D15651] hover:bg-[#D15651] hover:text-white px-8 py-2 rounded-xl text-lg font-bold w-32"
               >
                  Batal
               </Button>
               <Button 
                 className="bg-[#5C7B78] hover:bg-[#4a6361] text-white px-8 py-2 rounded-xl text-lg font-bold w-32"
                 onClick={() => handleSaveSettings(['admin_form_link'])}
               >
                  Update
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* --- Detail Modal --- */}
      <TrainingDetailModal 
         isOpen={isDetailModalOpen}
         onClose={() => setIsDetailModalOpen(false)}
         trainingId={selectedTrainingId}
         onDeleteSuccess={() => {
            setMeta(prev => ({ ...prev, page: 1 }));
            fetchTrainings();
         }}
         onEdit={handleEditFromDetail}
      />

      {/* --- Dialog: Add/Edit Training --- */}
      <Dialog open={isAddTrainingOpen} onOpenChange={setIsAddTrainingOpen}>
         <DialogContent className="!max-w-[45vw] w-full p-6 rounded-2xl bg-white h-auto">
            <DialogHeader>
               <DialogTitle className="text-[#5C7B78] font-bold text-xl">
                  {isEditMode ? 'Edit Jadwal Pelatihan' : 'Jadwal Pelatihan Baru'}
               </DialogTitle>
               <DialogDescription className="text-[#5C7B78] text-sm opacity-80 mt-0.5">
                  {isEditMode ? 'Perbarui Jadwal Pelatihan' : 'Buat Jadwal Pelatihan Baru untuk Peserta'}
               </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
               
               {/* Row 1: Batch & Kuota */}
               <div>
                  <label className="text-xs font-bold text-[#5C7B78] block mb-1">Batch Pelatihan</label>
                  <input 
                     type="text"
                     placeholder="Contoh: Batch 1"
                     className="w-full border border-[#5C7B78] rounded-lg p-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-[#5C7B78] placeholder:text-gray-300"
                     value={addForm.batch}
                     onChange={(e) => setAddForm({...addForm, batch: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-[#5C7B78] block mb-1">Kuota Peserta</label>
                  <input 
                     type="number"
                     placeholder="0"
                     className="w-full border border-[#5C7B78] rounded-lg p-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-[#5C7B78] placeholder:text-gray-300"
                     value={addForm.quota}
                     onChange={(e) => setAddForm({...addForm, quota: e.target.value})}
                  />
               </div>

               {/* Row 2: Judul (Full Width) */}
               <div className="col-span-2">
                  <label className="text-xs font-bold text-[#5C7B78] block mb-1">Judul Pelatihan</label>
                  <input 
                     type="text"
                     placeholder="Masukkan Judul Pelatihan"
                     className="w-full border border-[#5C7B78] rounded-lg p-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-[#5C7B78] placeholder:text-gray-300"
                     value={addForm.title}
                     onChange={(e) => setAddForm({...addForm, title: e.target.value})}
                  />
               </div>

               {/* Row 3: Tanggal (Single) */}
               <div>
                  <label className="text-xs font-bold text-[#5C7B78] block mb-1">Tanggal Pelatihan</label>
                  <div className="relative group cursor-pointer border border-[#5C7B78] rounded-xl py-2.5 px-4 bg-white hover:bg-gray-50 transition shadow-sm flex items-center gap-3">
                     <Calendar className="w-4 h-4 text-[#5C7B78] group-hover:text-[#4a6361]" />
                     <span className="text-xs font-bold text-gray-700">
                        {formatDateIndo(addForm.date)}
                     </span>
                     <input 
                        type="date"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        value={addForm.date}
                        onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                        onChange={(e) => setAddForm({...addForm, date: e.target.value})}
                     />
                  </div>
               </div>

               {/* Row 4: Waktu (Jam Mulai - Jam Selesai) */}
               <div>
                  <label className="text-xs font-bold text-[#5C7B78] block mb-1">Waktu (Mulai - Selesai)</label>
                  <div className="flex gap-3 items-center">
                     {/* Start Time */}
                     <div className="relative flex-1 group cursor-pointer border border-[#5C7B78] rounded-xl py-2.5 px-4 bg-white hover:bg-gray-50 transition shadow-sm flex items-center gap-3">
                        <Clock className="w-4 h-4 text-[#5C7B78] group-hover:text-[#4a6361]" />
                        <span className="text-xs font-bold text-gray-700">
                           {addForm.startTime || '00:00'}
                        </span>
                        <input 
                           type="time"
                           step="60"
                           className="absolute inset-0 opacity-0 cursor-pointer z-10"
                           value={addForm.startTime}
                           onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                           onChange={(e) => setAddForm({...addForm, startTime: e.target.value})}
                        />
                     </div>
                     
                     <span className="text-[#5C7B78] font-bold text-sm">-</span>
                     
                     {/* End Time */}
                     <div className="relative flex-1 group cursor-pointer border border-[#5C7B78] rounded-xl py-2.5 px-4 bg-white hover:bg-gray-50 transition shadow-sm flex items-center gap-3">
                        <Clock className="w-4 h-4 text-[#5C7B78] group-hover:text-[#4a6361]" />
                        <span className="text-xs font-bold text-gray-700">
                           {addForm.endTime || '00:00'}
                        </span>
                        <input 
                           type="time"
                           step="60"
                           className="absolute inset-0 opacity-0 cursor-pointer z-10"
                           value={addForm.endTime}
                           onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                           onChange={(e) => setAddForm({...addForm, endTime: e.target.value})}
                        />
                     </div>
                  </div>
               </div>

               {/* Row 4: Lokasi */}
               <div>
                  <label className="text-xs font-bold text-[#5C7B78] block mb-1">Lokasi</label>
                  <input 
                     type="text"
                     placeholder="Lokasi"
                     className="w-full border border-[#5C7B78] rounded-lg p-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-[#5C7B78] placeholder:text-gray-300"
                     value={addForm.location}
                     onChange={(e) => setAddForm({...addForm, location: e.target.value})}
                  />
               </div>

               {/* Row 4: Kelompok Jurnal */}
               <div>
                  <label className="text-xs font-bold text-[#5C7B78] block mb-1">Kelompok Jurnal</label>
                  <div className="relative">
                     <select 
                        className="w-full border border-[#5C7B78] rounded-lg p-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-[#5C7B78] appearance-none bg-white placeholder:text-gray-300"
                        value={addForm.journalCode}
                        onChange={(e) => setAddForm({...addForm, journalCode: e.target.value})}
                     >
                        <option value="" disabled>Pilih</option>
                        <option value="JIE">JIE</option>
                        <option value="FOFEI">FOFEI</option>
                        <option value="JOESMENT">JOESMENT</option>
                     </select>
                     <ChevronLeft className="w-4 h-4 absolute right-3 top-2.5 -rotate-90 pointer-events-none text-gray-500" />
                  </div>
               </div>

               {/* Row 5: Dosen (Full Width) */}
               <div className="col-span-2">
                  <label className="text-xs font-bold text-[#5C7B78] block mb-1">Dosen Pendamping</label>
                  <input 
                     type="text"
                     placeholder="Nama Dosen"
                     className="w-full border border-[#5C7B78] rounded-lg p-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-[#5C7B78] placeholder:text-gray-300"
                     value={addForm.mentorName}
                     onChange={(e) => setAddForm({...addForm, mentorName: e.target.value})}
                  />
               </div>
            </div>

            <DialogFooter className="mt-6 flex gap-3">
               <Button 
                  variant="outline" 
                  onClick={() => setIsAddTrainingOpen(false)}
                  className="border-[#D15651] text-[#D15651] hover:bg-[#D15651] hover:text-white px-6 py-1.5 rounded-xl text-sm font-bold w-24"
               >
                  Batal
               </Button>
               <Button 
                 className="bg-[#5C7B78] hover:bg-[#4a6361] text-white px-6 py-1.5 rounded-xl text-sm font-bold w-24"
                 onClick={handleSubmitTraining}
               >
                  Submit
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

    </div>
  );
}