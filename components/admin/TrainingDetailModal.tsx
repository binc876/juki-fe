import React, { useEffect, useState } from 'react';
import { X, Upload, Download, PenLine } from 'lucide-react';
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

interface Participant {
  userId: string;
  statusCode: string;
  articleTitle: string;
  user: {
    id: string;
    email: string;
    profile: {
      fullName: string;
      nim: string;
      phone: string;
    };
  };
  status: {
    label: string;
    description: string | null;
  };
}

interface TrainingDetail {
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
  flows?: Participant[]; 
}

interface TrainingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainingId: string | null;
  onDeleteSuccess: () => void;
  onEdit?: (training: TrainingDetail) => void;
}

export default function TrainingDetailModal({ 
  isOpen, 
  onClose, 
  trainingId,
  onDeleteSuccess,
  onEdit
}: TrainingDetailModalProps) {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState<TrainingDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Delete Confirmation State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

    // Real-time clock for comparison
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Data
    useEffect(() => {
      if (isOpen && trainingId) {
        fetchDetail();
      } else {
          setTraining(null);
          setParticipants([]);
      }
    }, [isOpen, trainingId]);

    const fetchDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Fetch training detail
      const res = await api.get(`/admin/trainings/${trainingId}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      
      setTraining(res.data);
      // If the API returns flows/participants embedded
      if (res.data.flows) {
          setParticipants(res.data.flows);
      } else {
          // If not embedded, we might need another endpoint, but based on typical patterns 
          // and the "Record Attendance" flow, let's assume it's here or mock it for now 
          // if the API structure is different. 
          // For prototype:
          setParticipants([]); 
      }
    } catch (err) {
      console.error('Failed to fetch training detail:', err);
      // alert('Gagal mengambil detail pelatihan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!trainingId) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      await api.delete(`/admin/trainings/${trainingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsDeleteConfirmOpen(false);
      onClose();
      onDeleteSuccess();
      showAlert({ title: 'Berhasil', message: 'Jadwal berhasil dihapus', type: 'success' });
    } catch (err: any) {
      console.error('Delete error:', err);
      showAlert({
        title: 'Gagal',
        message: getErrorMessage(err),
        type: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAttendance = async (userId: string, status: 'PRESENT' | 'ABSENT') => {
      if (!trainingId) return;
      try {
        const token = localStorage.getItem('token');
        const payload = {
            trainingId,
            userId,
            status
        };
        // console.log('Sending attendance payload:', payload);
        
        await api.post('/admin/trainings/attendance', payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // Refresh data to update UI
        fetchDetail();
      } catch (err: any) {
          console.error('Attendance error:', err);
          showAlert({ title: 'Gagal', message: getErrorMessage(err), type: 'error' });
      }
  };

  const handleExportCSV = () => {
     // Simple CSV Export implementation
     if (!participants.length) return;
     
     const headers = ['Nama', 'NIM', 'Email', 'WhatsApp', 'Judul Artikel', 'Status'];
     const rows = participants.map(p => [
         p.user.profile.fullName,
         `'${p.user.profile.nim}`, // Prevent scientific notation
         p.user.email,
         `'${p.user.profile.phone}`,
         p.articleTitle || '-',
         p.status.label
     ]);

     const csvContent = "data:text/csv;charset=utf-8," 
         + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `peserta_training_${training?.batch || 'export'}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  // --- Format Helpers ---
  const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('id-ID', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
  };

  const formatTime = (start?: string, end?: string) => {
      if (!start || !end) return '-';
      const s = new Date(start).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
      const e = new Date(end).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
      return `${s} - ${e} WIB`;
  };

  if (!isOpen) return null;

  const totalParticipants = training?._count?.flows || participants.length || 0;
  const canDelete = totalParticipants === 0;

  return (
    <>
        {/* Fullscreen Modal Wrapper */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#E4E4E4] animate-in fade-in duration-200">
            <div className="w-full h-full flex flex-col relative">
                
                {/* Header */}
                <div className="flex justify-between items-center px-10 pt-8 pb-4 flex-none">
                    <h2 className="text-3xl font-bold text-[#5C7B78]">Detail Jadwal Pelatihan</h2>
                    <button onClick={onClose} className="text-[#5C7B78] hover:text-gray-700 transition">
                        <X className="w-12 h-12" />
                    </button>
                </div>
    
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-gray-500 text-xl font-bold">Memuat data...</div>
                    </div>
                ) : training ? (
                    <div className="px-10 pb-6 flex-1 flex flex-col min-h-0 space-y-6">
                        {/* Card 1: Informasi Jadwal (Fixed Height) */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm flex-none relative">
                            <h3 className="text-lg font-bold text-[#5C7B78] mb-4">Informasi Jadwal</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-8">
                                 <div>
                                     <p className="text-gray-500 text-xs font-medium mb-0.5">Batch</p>
                                     <p className="text-sm font-bold text-[#5C7B78]">{training.batch}</p>
                                 </div>
                                 <div>
                                     <p className="text-gray-500 text-xs font-medium mb-0.5">Tanggal Pelatihan</p>
                                     <p className="text-sm font-bold text-[#5C7B78]">{formatDate(training.startAt)}</p>
                                 </div>
                                 <div>
                                     <p className="text-gray-500 text-xs font-medium mb-0.5">Dosen Pendamping</p>
                                     <p className="text-sm font-bold text-[#5C7B78]">{training.mentorName}</p>
                                 </div>
                                 <div>
                                     <p className="text-gray-500 text-xs font-medium mb-0.5">Judul Pelatihan</p>
                                     <p className="text-sm font-bold text-[#5C7B78] leading-tight truncate" title={training.title}>{training.title}</p>
                                 </div>
                                 <div>
                                     <p className="text-gray-500 text-xs font-medium mb-0.5">Waktu Pelatihan</p>
                                     <p className="text-sm font-bold text-[#5C7B78]">{formatTime(training.startAt, training.endAt)}</p>
                                 </div>
                                 <div>
                                     <p className="text-gray-500 text-xs font-medium mb-0.5">Kuota Peserta</p>
                                     <p className="text-sm font-bold text-[#5C7B78]">{training.quota} Peserta</p>
                                 </div>
                                 <div>
                                     <p className="text-gray-500 text-xs font-medium mb-0.5">Lokasi Pelatihan</p>
                                     <p className="text-sm font-bold text-[#5C7B78]">{training.location}</p>
                                 </div>
                                 <div>
                                     <p className="text-gray-500 text-xs font-medium mb-0.5">Kelompok Jurnal</p>
                                     <p className="text-sm font-bold text-[#5C7B78] uppercase">{training.journalCode}</p>
                                 </div>
                                 <div>
                                     <p className="text-gray-500 text-xs font-medium mb-0.5">Jumlah Peserta Terdaftar</p>
                                     <p className="text-sm font-bold text-[#5C7B78]">{totalParticipants} Peserta</p>
                                 </div>
                            </div>

                            {/* Edit Button */}
                            <div className="absolute bottom-6 right-6 md:right-auto md:left-6">
                                {/* If user wants "pojok kiri bawah", I'll put it there. But standard UI usually puts actions on right. 
                                    User said "pojok kiri bawah pada section itu". 
                                    However, the grid might take up space. Absolute positioning might overlap if grid is full.
                                    Let's put it at the bottom left relative to the container. 
                                    Actually, the container has padding. absolute bottom-6 left-6 matches the padding.
                                */}
                            </div>
                            {onEdit && (
                                <button 
                                    onClick={() => onEdit(training)}
                                    className="absolute bottom-6 right-6 flex items-center justify-center bg-[#5C7B78] hover:bg-[#4a6361] text-white w-10 h-10 rounded-xl transition shadow-sm"
                                    title="Edit Jadwal"
                                >
                                    <PenLine className="w-5 h-5" />
                                </button>
                            )}
                        </div>
    
                        {/* Card 2: Daftar Peserta (Scrollable Internal) */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm flex-1 flex flex-col min-h-0">
                            <div className="flex justify-between items-end mb-4 flex-none">
                                <div>
                                    <h3 className="text-lg font-bold text-[#5C7B78]">Daftar Peserta</h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Waktu Sekarang: <span className="text-[#5C7B78] font-bold">
                                            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\./g, ':')} WIB
                                        </span>
                                    </p>
                                </div>
                                <button 
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-2 text-[#5C7B78] font-bold hover:text-[#4a6361] transition text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Export CSV
                                </button>
                            </div>
    
                            {/* Table Container (The ONLY scrollable part) */}
                            <div className="overflow-auto flex-1 border border-gray-50 rounded-xl">
                                <table className="w-full min-w-[900px] relative">
                                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                        <tr className="text-[#5C7B78] text-left border-b border-gray-100 text-xs">
                                            <th className="py-3 px-4 font-bold">Nama</th>
                                            <th className="py-3 px-4 font-bold">NIM</th>
                                            <th className="py-3 px-4 font-bold">Email</th>
                                            <th className="py-3 px-4 font-bold">WhatsApp</th>
                                            <th className="py-3 px-4 font-bold">Judul Artikel</th>
                                            <th className="py-3 px-4 font-bold text-center">Status</th>
                                            <th className="py-3 px-4 font-bold text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs">
                                                                                                                                                                                        {participants.length > 0 ? participants.map((p, idx) => {
                                                                                                                                                                                            const now = new Date();
                                                                                                                                                                                            const trainingDate = training ? new Date(training.startAt) : new Date();
                                                                                                                                                    
                                                                                                                                                                                            // Check if Same Day
                                                                                                                                                                                            const isSameDay = now.getDate() === trainingDate.getDate() &&
                                                                                                                                                                                                              now.getMonth() === trainingDate.getMonth() &&
                                                                                                                                                                                                              now.getFullYear() === trainingDate.getFullYear();

                                                                                                                                                                                            // Check if Past (Previous Day)
                                                                                                                                                                                            const isPast = !isSameDay && now > trainingDate;
                                                                                                                                                                                            
                                                                                                                                                                                            // Allow action ONLY if status is TRAINING_WAITING (Backend Restriction)
                                                                                                                                                                                            const isWaiting = p.statusCode === 'TRAINING_WAITING' || p.statusCode === 'WAITING_FOR_TRAINING';
                                                                                                                                                                                            const canAction = isSameDay && isWaiting;
                                                                                                                                                                                            
                                                                                                                                                                                            // Auto-abstain display if past and still waiting
                                                                                                                                                                                            const displayStatus = (isPast && isWaiting) ? 'ABSTAIN' : p.statusCode;
                                                                                                                                                    
                                                                                                                                                                                            return (
                                                                                                                                                                                            <tr key={idx} className="border-b border-gray-50 last:border-none hover:bg-gray-50">
                                                                                                                                                                                                <td className="py-3 px-4 font-medium text-gray-800">{p.user.profile.fullName}</td>
                                                                                                                                                                                                <td className="py-3 px-4 text-gray-600">{p.user.profile.nim}</td>
                                                                                                                                                                                                <td className="py-3 px-4 text-gray-600">{p.user.email}</td>
                                                                                                                                                                                                <td className="py-3 px-4 text-gray-600">{p.user.profile.phone}</td>
                                                                                                                                                                                                <td className="py-3 px-4 text-gray-600 max-w-[180px] truncate" title={p.articleTitle}>{p.articleTitle || '-'}</td>
                                                                                                                                                                                                <td className="py-3 px-4 text-center">
                                                                                                                                                                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                                                                                                                                                                                                        displayStatus === 'TRAINING_VERIFIED' ? 'bg-[#97A094] text-white' : 
                                                                                                                                                                                                        displayStatus === 'TRAINING_RESCHEDULE' || displayStatus === 'ABSENT' || displayStatus === 'ABSTAIN' ? 'bg-[#D15651] text-white' :
                                                                                                                                                                                                        'bg-[#FFB800] text-white'
                                                                                                                                                                                                    }`}>
                                                                                                                                                                                                        {displayStatus === 'TRAINING_VERIFIED' ? 'Hadir' : 
                                                                                                                                                                                                         displayStatus === 'TRAINING_RESCHEDULE' || displayStatus === 'ABSENT' || displayStatus === 'ABSTAIN' ? 'Tidak Hadir' :
                                                                                                                                                                                                         'Belum Absen'}
                                                                                                                                                                                                    </span>
                                                                                                                                                                                                </td>
                                                                                                                                                                                                <td className="py-3 px-4">
                                                                                                                                                                                                    <div className="flex justify-center gap-2">
                                                                                                                                                                                                        <button 
                                                                                                                                                                                                            disabled={!canAction}
                                                                                                                                                                                                            onClick={() => handleAttendance(p.userId, 'PRESENT')}
                                                                                                                                                                                                            className={`px-3 py-1 rounded-md text-[10px] font-bold text-white transition ${
                                                                                                                                                                                                                p.statusCode === 'TRAINING_VERIFIED' 
                                                                                                                                                                                                                    ? 'bg-[#97A094] cursor-default' 
                                                                                                                                                                                                                    : !canAction 
                                                                                                                                                                                                                        ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                                                                                                                                                                                                                        : 'bg-[#97A094] hover:bg-[#7a8578]'
                                                                                                                                                                                                            }`}
                                                                                                                                                                                                        >
                                                                                                                                                                                                            Hadir
                                                                                                                                                                                                        </button>
                                                                                                                                                                                                        <button 
                                                                                                                                                                                                            disabled={!canAction}
                                                                                                                                                                                                            onClick={() => handleAttendance(p.userId, 'ABSENT')}
                                                                                                                                                                                                            className={`px-3 py-1 rounded-md text-[10px] font-bold text-white transition ${
                                                                                                                                                                                                                p.statusCode === 'TRAINING_RESCHEDULE' || p.statusCode === 'ABSENT'
                                                                                                                                                                                                                    ? 'bg-[#D15651] cursor-default' 
                                                                                                                                                                                                                    : !canAction 
                                                                                                                                                                                                                        ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                                                                                                                                                                                                                        : 'bg-[#D15651] hover:bg-[#b54641]'
                                                                                                                                                                                                            }`}
                                                                                                                                                                                                        >
                                                                                                                                                                                                            Tidak
                                                                                                                                                                                                        </button>
                                                                                                                                                                                                    </div>
                                                                                                                                                                                                </td>
                                                                                                                                                                                            </tr>
                                                                                                                                                                                        )}) : (                                            <tr>
                                                <td colSpan={7} className="text-center py-8 text-gray-400 italic">
                                                    Belum ada peserta yang mendaftar.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        {/* Delete Section (Fixed Bottom) */}
                        <div className="flex justify-center pt-2 flex-none">
                             {canDelete ? (
                                 <button 
                                    onClick={() => setIsDeleteConfirmOpen(true)}
                                    className="bg-[#D15651] hover:bg-[#b54641] text-white text-base font-bold py-3 px-10 rounded-xl shadow-md transition-transform hover:scale-105"
                                 >
                                     Hapus Jadwal
                                 </button>
                             ) : (
                                 <div className="bg-[#D4D4D4] border border-[#D15651] text-[#D15651] text-base font-bold py-3 px-10 rounded-xl cursor-not-allowed opacity-80 shadow-inner">
                                     Jadwal Tidak Dapat Dihapus
                                 </div>
                             )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-red-500">
                        Data tidak ditemukan.
                    </div>
                )}
            </div>
        </div>

    {/* Delete Confirmation Dialog */}
    <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-lg p-8 rounded-2xl bg-white text-center">
            <DialogHeader>
                <DialogTitle className="text-[#5C7B78] font-bold text-2xl text-center leading-normal mb-6">
                   Apakah anda yakin ingin menghapus jadwal ini?
                </DialogTitle>
            </DialogHeader>
            
            {/* Preview Card */}
            {training && (
                <div className="pointer-events-none transform scale-90 origin-top">
                     <TrainingCard training={training} onDetail={() => {}} />
                </div>
            )}

            <div className="flex gap-4 mt-8">
                <Button 
                   onClick={handleDelete}
                   disabled={isDeleting}
                   className="flex-1 bg-[#D15651] hover:bg-[#b54641] text-white text-lg font-bold py-6 rounded-xl"
                >
                   {isDeleting ? 'Menghapus...' : 'Hapus'}
                </Button>
                <Button 
                   variant="outline"
                   onClick={() => setIsDeleteConfirmOpen(false)}
                   className="flex-1 border-[#5C7B78] text-[#5C7B78] hover:bg-gray-50 text-lg font-bold py-6 rounded-xl"
                >
                   Batal
                </Button>
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
