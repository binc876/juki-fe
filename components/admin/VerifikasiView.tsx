'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  CreditCard,
  ExternalLink
} from 'lucide-react'
import { api, getErrorMessage, downloadFile, viewFile } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAlert } from '@/components/ui/alert-provider'

interface User {
  id: string;
  email: string;
  profile: {
    fullName: string;
    nim: string;
    phone: string;
  };
  attachments: {
    id: string;
    type: string;
    originalName: string;
    filePath: string;
    mimeType: string;
  }[];
  trainingFlow: {
    statusCode: string;
    articleTitle?: string;
    ojsAccount?: {
      username?: string;
    };
  };
}

export default function VerifikasiView() {
  const { showAlert } = useAlert();
  const [view, setView] = useState<'select' | 'payment' | 'form'>('select')
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPage: 1 })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<any>(null)

  // Action States
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Payment Verification State
  const [isPaymentActionOpen, setIsPaymentActionOpen] = useState(false)
  const [paymentActionType, setPaymentActionType] = useState<'verify' | 'reject'>('verify')
  const [rejectReason, setRejectReason] = useState('')

  // Form (OJS) Verification State
  const [isOjsActionOpen, setIsOjsActionOpen] = useState(false)
  const [ojsForm, setOjsForm] = useState({
    username: '',
    password: '',
    journalCode: '',
    journalLink: ''
  })

  // --- Fetch Stats ---
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await api.get('/users/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(res.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  // --- Fetch Users ---
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      // Refresh stats whenever we fetch users
      fetchStats()

      if (view === 'select') {
         // Fetch both lists for overview (Parallel)
         const [resPayment, resForm] = await Promise.all([
            api.get('/users', { params: { page: 1, limit: 50, status: 'PAYMENT_WAITING', search: searchQuery }, headers }),
            api.get('/users', { params: { page: 1, limit: 50, status: 'WAITING_ADMINISTRATIVE', search: searchQuery }, headers })
         ])

         // Robust data extraction
         const paymentData = resPayment.data.data || resPayment.data
         const formData = resForm.data.data || resForm.data

         const paymentUsers = Array.isArray(paymentData) ? paymentData : []
         const formUsers = Array.isArray(formData) ? formData : []
         
         // Combine
         const combined = [...paymentUsers, ...formUsers]
         
         setUsers(combined)
         setMeta({
            page: 1,
            limit: 100,
            total: combined.length,
            totalPage: 1
         })

      } else {
          // Specific View Fetch
          const status = view === 'payment' ? 'PAYMENT_WAITING' : 'WAITING_ADMINISTRATIVE'
          const params: Record<string, string | number> = {
            page: meta.page,
            limit: meta.limit,
            status: status
          }
          
          if (searchQuery) params.search = searchQuery

          const res = await api.get('/users', { params, headers })

          const data = res.data.data || res.data
          const newMeta = res.data.meta || {
            page: meta.page,
            limit: meta.limit,
            total: Array.isArray(data) ? data.length : 0,
            totalPage: 1
          }

          setUsers(Array.isArray(data) ? data : [])
          setMeta(newMeta)
      }

    } catch (err: any) {
      console.error('Failed to fetch verification list:', err)
      // 401 handled globally
    } finally {
      setLoading(false)
    }
  }, [view, meta.page, meta.limit, searchQuery])

  useEffect(() => {
    // Reset to page 1 when switching views, but trigger fetch handled by dependency
    if (view !== 'select') {
        setMeta(prev => ({ ...prev, page: 1 }))
    }
    fetchUsers()
  }, [view])

  useEffect(() => {
    if (view !== 'select') {
        fetchUsers()
    }
  }, [meta.page])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setMeta(prev => ({ ...prev, page: 1 }))
      fetchUsers()
    }
  }

  // --- Actions ---
  const handleOpenPaymentAction = (user: User, type: 'verify' | 'reject') => {
    setSelectedUser(user)
    setPaymentActionType(type)
    setRejectReason(type === 'reject' ? 'Bukti transfer buram, mohon upload ulang.' : '')
    setIsPaymentActionOpen(true)
  }

  const submitPaymentVerification = async () => {
    if (!selectedUser) return

    // Ensure we are in the correct state
    if (view === 'payment' && selectedUser.trainingFlow?.statusCode !== 'PAYMENT_WAITING') {
        showAlert({
            title: 'Perhatian',
            message: 'User ini tidak dalam status menunggu verifikasi pembayaran.',
            type: 'warning'
        });
        return;
    }

    try {
      const token = localStorage.getItem('token')
      
      // Strictly build payload based on BE requirements after BE fix
      let payload: any = {}
      
      if (paymentActionType === 'verify') {
        payload = { action: 'ACCEPT' }
      } else {
        payload = { 
          action: 'REJECT', 
          reason: rejectReason || 'Bukti transfer buram, mohon upload ulang.' 
        }
      }

      await api.post(`/admin/payments/${selectedUser.id}/verify`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      showAlert({
        title: 'Berhasil',
        message: `Pembayaran berhasil ${paymentActionType === 'verify' ? 'diterima' : 'ditolak'}!`,
        type: 'success'
      })
      setIsPaymentActionOpen(false)
      fetchUsers()
    } catch (err: any) {
      console.error('Payment verification failed:', err)
      showAlert({
        title: 'Gagal',
        message: getErrorMessage(err),
        type: 'error'
      })
    }
  }

  const handleOpenOjsAction = (user: User) => {
    setSelectedUser(user)
    setOjsForm({
      username: `user_${user.profile.nim}`,
      password: '',
      journalCode: '',
      journalLink: ''
    })
    setIsOjsActionOpen(true)
  }

  const submitOjsVerification = async () => {
    if (!selectedUser) return

    const { username, password, journalCode, journalLink } = ojsForm;

    // Basic required validation
    if (!username?.trim() || !password?.trim() || !journalCode || !journalLink?.trim()) {
      showAlert({
        title: 'Perhatian',
        message: 'Semua field (Username, Password, Jurnal, Link) wajib diisi.',
        type: 'warning'
      })
      return
    }

    // URL Validation: ensure it is a valid URL and not just "https://"
    try {
      const url = new URL(journalLink.trim());
      if (!url.hostname) throw new Error();
    } catch (err) {
      showAlert({
        title: 'Gagal',
        message: 'Link jurnal tidak valid. Pastikan menyertakan domain lengkap (contoh: https://ejournal.umm.ac.id)',
        type: 'error'
      })
      return
    }

    try {
      const token = localStorage.getItem('token')
      await api.post(`/admin/administrative/${selectedUser.id}/ojs`, ojsForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showAlert({
        title: 'Berhasil',
        message: 'Akun OJS berhasil dibuat dan peserta terverifikasi!',
        type: 'success'
      })
      setIsOjsActionOpen(false)
      fetchUsers()
    } catch (err: any) {
      console.error('OJS creation failed:', err)
      showAlert({
        title: 'Gagal',
        message: getErrorMessage(err),
        type: 'error'
      })
    }
  }

  // --- Calculate Display Total ---
  const getTotalUnverified = () => {
    if (!stats || !stats.needs_verification) return meta.total;
    const paymentCount = stats.needs_verification.payment ?? 0;
    const adminCount = stats.needs_verification.administrative ?? 0;

    if (view === 'payment') return paymentCount;
    if (view === 'form') return adminCount;
    return paymentCount + adminCount;
  }

  return (
    <div className="space-y-6">
       
       {/* Header */}
       <div className="flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-bold text-[#5C7B78]">
                Verifikasi {view === 'payment' ? 'Pembayaran' : view === 'form' ? 'Form' : ''}
            </h2>
            <p className="text-[#5C7B78]/80 font-medium text-xl mt-1">
              Total : {getTotalUnverified()} Data belum terverifikasi
            </p>
          </div>

          {view !== 'select' && (
              <button 
                onClick={() => setView('select')}
                className="border-2 border-[#5C7B78] text-[#5C7B78] px-12 py-2 rounded-xl font-bold text-xl hover:bg-[#5C7B78] hover:text-white transition-all"
              >
                  Kembali
              </button>
          )}
       </div>

       {view === 'select' ? (
           /* Selection View (Verifikasi.png) */
           <div className="flex flex-col gap-8 mt-8">
               
               {/* Action Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Card Pembayaran */}
                   <div 
                      onClick={() => setView('payment')}
                      className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-transparent hover:border-[#5C7B78] cursor-pointer transition-all hover:shadow-lg group relative overflow-hidden"
                   >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <CreditCard className="w-32 h-32 text-[#5C7B78]" />
                      </div>
                      <div className="flex items-start justify-between relative z-10">
                         <div className="flex items-center gap-4">
                             <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-[#5C7B78] group-hover:bg-[#5C7B78] group-hover:text-white transition-colors shadow-sm">
                                <CreditCard className="w-7 h-7" />
                             </div>
                             <div>
                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#5C7B78] transition-colors">Verifikasi Pembayaran</h3>
                                <p className="text-sm text-gray-500 mt-1">Cek bukti transfer peserta</p>
                             </div>
                         </div>
                         <div className="text-right">
                             <span className="block text-4xl font-extrabold text-[#5C7B78]">{stats?.needs_verification?.payment || 0}</span>
                             <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pending</span>
                         </div>
                      </div>
                   </div>

                   {/* Card Form */}
                   <div 
                      onClick={() => setView('form')}
                      className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-transparent hover:border-[#D98E2E] cursor-pointer transition-all hover:shadow-lg group relative overflow-hidden"
                   >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <FileText className="w-32 h-32 text-[#D98E2E]" />
                      </div>
                      <div className="flex items-start justify-between relative z-10">
                         <div className="flex items-center gap-4">
                             <div className="w-14 h-14 rounded-2xl bg-[#FFF8E1] flex items-center justify-center text-[#D98E2E] group-hover:bg-[#D98E2E] group-hover:text-white transition-colors shadow-sm">
                                <FileText className="w-7 h-7" />
                             </div>
                             <div>
                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#D98E2E] transition-colors">Verifikasi Form Admin</h3>
                                <p className="text-sm text-gray-500 mt-1">Input data akun OJS peserta</p>
                             </div>
                         </div>
                         <div className="text-right">
                             <span className="block text-4xl font-extrabold text-[#D98E2E]">{stats?.needs_verification?.administrative || 0}</span>
                             <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pending</span>
                         </div>
                      </div>
                   </div>
               </div>

               {/* Combined Table */}
               <div className="bg-white rounded-[32px] p-10 shadow-sm">
                   <h3 className="text-[#5C7B78] font-bold text-2xl mb-6">Daftar Antrian Verifikasi</h3>
                   <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="text-[#5C7B78] text-left border-b-2 border-gray-100 text-lg">
                          <th className="pb-6 font-bold">Nama</th>
                          <th className="pb-6 font-bold text-center">NIM</th>
                          <th className="pb-6 font-bold text-center">Jenis Verifikasi</th>
                          <th className="pb-6 font-bold text-center">Status</th>
                          <th className="pb-6 font-bold text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-800 text-base">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-20 text-gray-400 font-bold">Memuat data...</td></tr>
                        ) : users.length > 0 ? (
                          users.map((user, idx) => (
                            <tr key={idx} className="border-b border-gray-50 last:border-none">
                              <td className="py-6 font-medium max-w-[200px] truncate" title={user.profile?.fullName || ''}>{user.profile?.fullName || '-'}</td>
                              <td className="py-6 text-center">{user.profile?.nim || '-'}</td>
                              <td className="py-6 text-center">
                                 {user.trainingFlow?.statusCode === 'PAYMENT_WAITING' ? (
                                     <span className="bg-[#FFB800] text-white px-4 py-1 rounded-full text-xs font-bold uppercase">Pembayaran</span>
                                 ) : (
                                     <span className="bg-[#6B8E88] text-white px-4 py-1 rounded-full text-xs font-bold uppercase">Form Admin</span>
                                 )}
                              </td>
                              <td className="py-6 text-center text-sm text-gray-500 font-medium">
                                 {user.trainingFlow?.statusCode === 'PAYMENT_WAITING' ? 'Menunggu Konfirmasi' : 'Menunggu Input OJS'}
                              </td>
                              <td className="py-6 text-center">
                                 <button 
                                   onClick={() => user.trainingFlow?.statusCode === 'PAYMENT_WAITING' ? handleOpenPaymentAction(user, 'verify') : handleOpenOjsAction(user)}
                                   className="bg-[#5C7B78] text-white px-8 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#4a6361]"
                                 >
                                   Proses
                                 </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                           <tr><td colSpan={5} className="text-center py-20 text-gray-400 italic">Tidak ada antrian verifikasi.</td></tr>
                        )}
                      </tbody>
                    </table>
                   </div>

                   {/* Pagination for Selection View */}
                   <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-100">
                      <div className="text-gray-600 font-medium">
                         Menampilkan <span className="font-bold text-gray-900">{(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)}</span> dari <span className="font-bold text-gray-900">{meta.total}</span> Peserta
                      </div>
                      <div className="flex items-center gap-4">
                         <button onClick={() => setMeta({...meta, page: 1})} disabled={meta.page === 1} className="p-2 text-gray-400 hover:text-[#5C7B78] disabled:opacity-30"><ChevronLeft className="w-6 h-6" /><ChevronLeft className="w-6 h-6 -ml-4" /></button>
                         <button onClick={() => setMeta({...meta, page: Math.max(1, meta.page - 1)})} disabled={meta.page === 1} className="flex items-center gap-1 font-bold text-gray-600 border border-gray-200 px-4 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /> Prev</button>
                         <span className="font-bold text-gray-900">Halaman {meta.page} dari {meta.totalPage}</span>
                         <button onClick={() => setMeta({...meta, page: Math.min(meta.totalPage, meta.page + 1)})} disabled={meta.page === meta.totalPage} className="flex items-center gap-1 font-bold text-gray-600 border border-gray-200 px-4 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">Next <ChevronRight className="w-4 h-4" /></button>
                         <button onClick={() => setMeta({...meta, page: meta.totalPage})} disabled={meta.page === meta.totalPage} className="p-2 text-gray-400 hover:text-[#5C7B78] disabled:opacity-30"><ChevronRight className="w-6 h-6" /><ChevronRight className="w-6 h-6 -ml-4" /></button>
                      </div>
                   </div>
               </div>
           </div>
       ) : (
           /* Table View (Verifikasi Pembayaran.png / Verifikasi Form.png) */
           <div className="bg-white rounded-[32px] p-10 min-h-[600px] shadow-sm mt-8">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="text-[#5C7B78] text-left border-b-2 border-gray-100 text-lg">
                      <th className="pb-6 font-bold">Nama</th>
                      <th className="pb-6 font-bold text-center">NIM</th>
                      <th className="pb-6 font-bold text-center">Email</th>
                      <th className="pb-6 font-bold text-center">WhatsApp</th>
                      <th className="pb-6 font-bold text-center">
                        {view === 'payment' ? 'Bukti Pembayaran' : 'Bukti Pembayaran'}
                      </th>
                      <th className="pb-6 font-bold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800 text-base">
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-20 text-gray-400 font-bold">Memuat data...</td></tr>
                    ) : users.length > 0 ? (
                      users.map((user, idx) => {
                        const paymentProof = user.attachments?.find(a => a.type === 'PAYMENT');
                        return (
                        <tr key={idx} className="border-b border-gray-50 last:border-none">
                          <td className="py-6 font-medium max-w-[200px] truncate" title={user.profile?.fullName || ''}>{user.profile?.fullName || '-'}</td>
                          <td className="py-6 text-center">{user.profile?.nim || '-'}</td>
                          <td className="py-6 text-center max-w-[200px] truncate" title={user.email}>{user.email}</td>
                          <td className="py-6 text-center">{user.profile?.phone || '-'}</td>
                          <td className="py-6 text-center">
                             {paymentProof ? (
                                 <button 
                                    onClick={async () => {
                                        try {
                                            await viewFile(`/attachments/admin/${paymentProof.id}/download`);
                                        } catch (err) {
                                            showAlert({ title: 'Gagal', message: 'Gagal melihat bukti bayar', type: 'error' });
                                        }
                                    }}
                                    className="text-gray-800 font-medium hover:underline inline-block"
                                 >
                                    Lihat Bukti
                                 </button>
                             ) : <span className="text-gray-400">BuktiBayar</span>}
                          </td>
                          <td className="py-6 text-center">
                             <div className="flex justify-center gap-3">
                                <button 
                                  onClick={() => view === 'payment' ? handleOpenPaymentAction(user, 'verify') : handleOpenOjsAction(user)}
                                  className="bg-[#5C7B78] text-white px-6 py-1.5 rounded-lg text-sm font-bold shadow-sm"
                                >
                                  Terima
                                </button>
                                <button 
                                  onClick={() => {
                                      if (view === 'payment') handleOpenPaymentAction(user, 'reject')
                                      else showAlert({ title: 'Info', message: 'Fitur tolak form administratif belum tersedia.', type: 'info' })
                                  }}
                                  className="border-2 border-[#D15651] text-[#D15651] px-6 py-1.5 rounded-lg text-sm font-bold"
                                >
                                  Tolak
                                </button>
                             </div>
                          </td>
                        </tr>
                      )})
                    ) : (
                       <tr><td colSpan={6} className="text-center py-20 text-gray-400 italic">Belum ada data verifikasi.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-100">
                 <div className="text-gray-600 font-medium">
                    Menampilkan <span className="font-bold text-gray-900">{(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)}</span> dari <span className="font-bold text-gray-900">{meta.total}</span> Peserta
                 </div>
                 <div className="flex items-center gap-4">
                    <button onClick={() => setMeta({...meta, page: 1})} disabled={meta.page === 1} className="p-2 text-gray-400 hover:text-[#5C7B78] disabled:opacity-30"><ChevronLeft className="w-6 h-6" /><ChevronLeft className="w-6 h-6 -ml-4" /></button>
                    <button onClick={() => setMeta({...meta, page: Math.max(1, meta.page - 1)})} disabled={meta.page === 1} className="flex items-center gap-1 font-bold text-gray-600 border border-gray-200 px-4 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /> Prev</button>
                    <span className="font-bold text-gray-900">Halaman {meta.page} dari {meta.totalPage}</span>
                    <button onClick={() => setMeta({...meta, page: Math.min(meta.totalPage, meta.page + 1)})} disabled={meta.page === meta.totalPage} className="flex items-center gap-1 font-bold text-gray-600 border border-gray-200 px-4 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">Next <ChevronRight className="w-4 h-4" /></button>
                    <button onClick={() => setMeta({...meta, page: meta.totalPage})} disabled={meta.page === meta.totalPage} className="p-2 text-gray-400 hover:text-[#5C7B78] disabled:opacity-30"><ChevronRight className="w-6 h-6" /><ChevronRight className="w-6 h-6 -ml-4" /></button>
                 </div>
              </div>
           </div>
       )}

       {/* --- Payment Verification Dialog --- */}
       <Dialog open={isPaymentActionOpen} onOpenChange={setIsPaymentActionOpen}>
          <DialogContent className="max-w-md p-8 rounded-2xl bg-white">
             <DialogHeader>
                <DialogTitle className="text-[#5C7B78] font-bold text-xl text-center mb-2">
                   {paymentActionType === 'verify' ? 'Terima Pembayaran?' : 'Tolak Pembayaran?'}
                </DialogTitle>
                <DialogDescription className="text-center text-gray-500">
                   {paymentActionType === 'verify' 
                     ? `Apakah Anda yakin ingin memverifikasi pembayaran dari ${selectedUser?.profile.fullName}?`
                     : `Berikan alasan mengapa pembayaran dari ${selectedUser?.profile.fullName} ditolak.`}
                </DialogDescription>
             </DialogHeader>
             <div className="space-y-4 mt-4">
                {paymentActionType === 'reject' && (
                   <div>
                      <label className="text-sm font-bold text-gray-600 block mb-2">Alasan Penolakan</label>
                      <textarea 
                         className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#5C7B78] outline-none h-24 resize-none"
                         placeholder="Contoh: Bukti transfer tidak terbaca jelas..."
                         value={rejectReason}
                         onChange={(e) => setRejectReason(e.target.value)}
                      />
                   </div>
                )}
                <div className="flex gap-3 pt-2">
                   <Button variant="outline" onClick={() => setIsPaymentActionOpen(false)} className="flex-1 py-6 rounded-xl text-gray-600 border-gray-300">Batal</Button>
                   <Button onClick={submitPaymentVerification} className={`flex-1 py-6 rounded-xl text-white font-bold ${paymentActionType === 'verify' ? 'bg-[#5C7B78] hover:bg-[#4a6361]' : 'bg-[#D15651] hover:bg-[#b54641]'}`}>{paymentActionType === 'verify' ? 'Terima' : 'Tolak'}</Button>
                </div>
             </div>
          </DialogContent>
       </Dialog>

       {/* --- OJS Account Creation Dialog --- */}
       <Dialog open={isOjsActionOpen} onOpenChange={setIsOjsActionOpen}>
          <DialogContent className="max-w-lg p-8 rounded-2xl bg-white">
             <DialogHeader>
                <DialogTitle className="text-[#5C7B78] font-bold text-xl text-center mb-1">Buat Akun OJS</DialogTitle>
                <DialogDescription className="text-center text-gray-500 text-sm mb-6">Masukkan detail akun OJS untuk peserta ini.</DialogDescription>
             </DialogHeader>
             <div className="space-y-4">
                <div><label className="text-xs font-bold text-[#5C7B78] block mb-1">Username OJS</label><input type="text" className="w-full border border-[#5C7B78] rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-[#5C7B78]" value={ojsForm.username} onChange={(e) => setOjsForm({...ojsForm, username: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-[#5C7B78] block mb-1">Password OJS</label><input type="text" className="w-full border border-[#5C7B78] rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-[#5C7B78]" placeholder="Generate atau input manual" value={ojsForm.password} onChange={(e) => setOjsForm({...ojsForm, password: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-[#5C7B78] block mb-1">Kelompok Jurnal</label><select className="w-full border border-[#5C7B78] rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-[#5C7B78] bg-white" value={ojsForm.journalCode} onChange={(e) => setOjsForm({...ojsForm, journalCode: e.target.value})}><option value="">Pilih Jurnal</option><option value="JIE">JIE</option><option value="JOFEI">JOFEI</option><option value="JOESMENT">JOESMENT</option></select></div>
                <div><label className="text-xs font-bold text-[#5C7B78] block mb-1">Link Jurnal</label><input type="text" className="w-full border border-[#5C7B78] rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-[#5C7B78]" placeholder="https://..." value={ojsForm.journalLink} onChange={(e) => setOjsForm({...ojsForm, journalLink: e.target.value})} /></div>
                <div className="flex gap-3 pt-6"><Button variant="outline" onClick={() => setIsOjsActionOpen(false)} className="flex-1 py-2.5 rounded-xl text-gray-600 border-gray-300">Batal</Button><Button onClick={submitOjsVerification} className="flex-1 py-2.5 rounded-xl text-white font-bold bg-[#5C7B78] hover:bg-[#4a6361]">Simpan & Verifikasi</Button></div>
             </div>
          </DialogContent>
       </Dialog>

    </div>
  )
}