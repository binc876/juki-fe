'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Upload,
  Eye,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { api } from '@/lib/api'
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
  profile: {
    fullName: string;
    nim: string;
  };
  attachments?: {
    id: string;
    type: string;
    originalName: string;
  }[];
  trainingFlow: {
    statusCode: string;
    articleTitle?: string;
    journalCode?: string;
  };
}

export default function ArtikelProsesView() {
  const { showAlert } = useAlert()
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPage: 1 })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [journalFilter, setJournalFilter] = useState('')
  const [stats, setStats] = useState<any>(null)

  // Action States
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Verification Modal
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)
  const [verifyType, setVerifyType] = useState<'article' | 'review' | null>(null)
  const [verifyComment, setVerifyComment] = useState('')
  
  // Upload LOA Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [loaFile, setLoaFile] = useState<File | null>(null)

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

      fetchStats()

      const params: any = {
        page: meta.page,
        limit: meta.limit,
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

    } catch (err: any) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }, [meta.page, meta.limit, searchQuery])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setMeta(prev => ({ ...prev, page: 1 }))
      fetchUsers()
    }
  }

  // --- Helper: Status Logic ---
  const getStatusLevel = (status: string) => {
      const levels: Record<string, number> = {
          'PAYMENT_REQUIRED': 0, 'PAYMENT_WAITING': 0, 'PAYMENT_VERIFIED': 0,
          'ADMINISTRATIVE_REQUIRED': 0, 'WAITING_ADMINISTRATIVE': 0,
          'ARTICLE_WAITING': 1, 'ARTICLE_VERIFIED': 2,
          'TRAINING_WAITING': 2, 'TRAINING_VERIFIED': 3, 'TRAINING_RESCHEDULE': 2,
          'REVIEW_WAITING': 3, 'REVIEW_REVISION': 3, 'REVIEW_VERIFIED': 4,
          'LOA_WAITING': 4, 'LOA_PUBLISHED': 5
      }
      return levels[status] || 0;
  }

  // --- Actions ---
  const openVerifyModal = (user: User, type: 'article' | 'review') => {
      setSelectedUser(user)
      setVerifyType(type)
      setVerifyComment(type === 'article' ? 'Artikel telah diverifikasi.' : 'Artikel diterima tanpa revisi.')
      setIsVerifyModalOpen(true)
  }

  const submitVerification = async () => {
      if (!selectedUser || !verifyType) return
      try {
          const token = localStorage.getItem('token')
          const headers = { Authorization: `Bearer ${token}` }
          
          const endpoint = verifyType === 'article' 
            ? `/admin/articles/${selectedUser.id}/verify`
            : `/admin/review-loa/${selectedUser.id}/review/accept`;

          const payload = { comment: verifyComment || (verifyType === 'article' ? 'Artikel telah diverifikasi.' : 'Artikel diterima tanpa revisi.') };

          await api.post(endpoint, payload, { headers })

          showAlert({ title: 'Berhasil', message: 'Verifikasi berhasil!', type: 'success' })
          setIsVerifyModalOpen(false)
          fetchUsers()
      } catch (err: any) {
          let msg = 'Gagal memverifikasi';
          if (err.response?.data?.message) {
              const m = err.response.data.message;
              msg = typeof m === 'object' ? JSON.stringify(m) : m;
          }
          showAlert({ title: 'Gagal', message: msg, type: 'error' })
      }
  }

  const openUploadModal = (user: User) => {
      setSelectedUser(user)
      setLoaFile(null)
      setIsUploadModalOpen(true)
  }

  const submitUploadLoa = async () => {
      if (!selectedUser || !loaFile) return
      try {
          const token = localStorage.getItem('token')
          const formData = new FormData()
          formData.append('file', loaFile)

          await api.post(`/admin/review-loa/${selectedUser.id}/loa/upload`, formData, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          })

          showAlert({ title: 'Berhasil', message: 'LOA berhasil diterbitkan!', type: 'success' })
          setIsUploadModalOpen(false)
          fetchUsers()
      } catch (err: any) {
          let msg = 'Gagal upload LOA';
          if (err.response?.data?.message) {
              const m = err.response.data.message;
              msg = typeof m === 'object' ? JSON.stringify(m) : m;
          }
          showAlert({ title: 'Gagal', message: msg, type: 'error' })
      }
  }

  const downloadLoa = (user: User) => {
      const loa = user.attachments?.find(a => a.type === 'LOA')
      if (loa) {
          window.open(`${process.env.NEXT_PUBLIC_API_URL}/attachments/admin/${loa.id}/download?token=${localStorage.getItem('token')}`, '_blank')
      }
  }

  // --- Render Status Column ---
  const renderStatus = (user: User, column: 'submit' | 'pelatihan' | 'review' | 'revisi' | 'loa') => {
      const status = user.trainingFlow?.statusCode
      const level = getStatusLevel(status)

      if (column === 'submit') {
          if (level >= 2) return <Check className="w-6 h-6 text-white bg-[#5C7B78] rounded-full p-1 mx-auto" />
          if (status === 'ARTICLE_WAITING') {
              return (
                  <button onClick={() => openVerifyModal(user, 'article')} className="bg-[#D98E2E] text-white text-[10px] font-bold px-3 py-1 rounded-full hover:bg-[#b57b2b]">Verifikasi</button>
              )
          }
          return <span className="text-gray-300">-</span>
      }

      if (column === 'pelatihan') {
          if (level >= 3) return <Check className="w-6 h-6 text-white bg-[#5C7B78] rounded-full p-1 mx-auto" />
          if (status === 'TRAINING_WAITING') return <span className="text-[#5C7B78] text-[10px] font-bold">Menunggu Jadwal</span>
          if (status === 'TRAINING_RESCHEDULE') return <span className="text-[#D15651] text-[10px] font-bold">Reschedule</span>
          return <span className="text-gray-300">-</span>
      }

      if (column === 'review') {
          if (level >= 4) return <Check className="w-6 h-6 text-white bg-[#5C7B78] rounded-full p-1 mx-auto" />
          if (status === 'REVIEW_WAITING' || status === 'TRAINING_VERIFIED') {
              return (
                  <button onClick={() => openVerifyModal(user, 'review')} className="bg-[#D98E2E] text-white text-[10px] font-bold px-3 py-1 rounded-full hover:bg-[#b57b2b]">Verifikasi</button>
              )
          }
          return <span className="text-gray-300">-</span>
      }

      if (column === 'revisi') {
          if (status === 'REVIEW_REVISION') return <AlertTriangle className="w-6 h-6 text-[#D98E2E] mx-auto" />
          if (level >= 4) return <span className="text-[#5C7B78] font-bold text-xs">-</span>
          return <span className="text-gray-300">-</span>
      }

      if (column === 'loa') {
          if (status === 'LOA_PUBLISHED') {
              return (
                  <button onClick={() => downloadLoa(user)} className="bg-[#5C7B78] text-white text-[10px] font-bold px-3 py-1 rounded-full hover:bg-[#4a6361] flex items-center gap-1 mx-auto"><Eye className="w-3 h-3" /> Lihat</button>
              )
          }
          if (level === 4 || status === 'REVIEW_VERIFIED' || status === 'LOA_WAITING') {
              return (
                  <button onClick={() => openUploadModal(user)} className="bg-[#5C7B78] text-white text-[10px] font-bold px-3 py-1 rounded-full hover:bg-[#4a6361]">Terbitkan</button>
              )
          }
          return <span className="text-gray-300">-</span>
      }
  }

  const filteredUsers = journalFilter 
      ? users.filter(u => u.trainingFlow?.journalCode === journalFilter)
      : users;

  return (
    <div className="space-y-6">
       
       {/* Header */}
       <div className="flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-bold text-[#5C7B78]">Artikel Proses</h2>
            <p className="text-[#5C7B78]/80 font-medium text-xl mt-1">
              Total : {stats?.process?.article_stage || 0} Mahasiswa
            </p>
          </div>
       </div>

       {/* Main Card */}
       <div className="bg-white rounded-[32px] p-10 min-h-[600px] shadow-sm mt-4">
          
          <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Cari peserta" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch} className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5C7B78]/20" />
            </div>
            
            <div className="relative w-full max-w-[200px]">
                <select value={journalFilter} onChange={(e) => setJournalFilter(e.target.value)} className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 text-gray-700 font-bold focus:outline-none cursor-pointer appearance-none">
                    <option value="">Semua Jurnal</option>
                    <option value="JIE">JIE</option>
                    <option value="FOFEI">FOFEI</option>
                    <option value="JOESMENT">JOESMENT</option>
                </select>
                <ChevronLeft className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 -rotate-90 pointer-events-none" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="text-[#5C7B78] text-left border-b-2 border-gray-100 text-lg">
                  <th className="pb-6 font-bold w-[20%]">Nama</th>
                  <th className="pb-6 font-bold text-center w-[10%]">NIM</th>
                  <th className="pb-6 font-bold w-[25%]">Judul Artikel</th>
                  <th className="pb-6 font-bold text-center w-[10%]">Jurnal</th>
                  <th className="pb-6 font-bold text-center w-[7%]">Submit</th>
                  <th className="pb-6 font-bold text-center w-[7%]">Pelatihan</th>
                  <th className="pb-6 font-bold text-center w-[7%]">Review</th>
                  <th className="pb-6 font-bold text-center w-[7%]">Revisi</th>
                  <th className="pb-6 font-bold text-center w-[7%]">LoA</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 text-base">
                {loading ? (
                    <tr><td colSpan={9} className="text-center py-20 text-gray-400 font-bold">Memuat data...</td></tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user, idx) => (
                    <tr key={idx} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                      <td className="py-6 font-medium">{user.profile?.fullName || '-'}</td>
                      <td className="py-6 text-center">{user.profile?.nim || '-'}</td>
                      <td className="py-6 pr-4 max-w-[200px] truncate" title={user.trainingFlow?.articleTitle}>{user.trainingFlow?.articleTitle || '-'}</td>
                      <td className="py-6 text-center">{user.trainingFlow?.journalCode || '-'}</td>
                      <td className="py-6 text-center">{renderStatus(user, 'submit')}</td>
                      <td className="py-6 text-center">{renderStatus(user, 'pelatihan')}</td>
                      <td className="py-6 text-center">{renderStatus(user, 'review')}</td>
                      <td className="py-6 text-center">{renderStatus(user, 'revisi')}</td>
                      <td className="py-6 text-center">{renderStatus(user, 'loa')}</td>
                    </tr>
                  ))
                ) : (
                   <tr><td colSpan={9} className="text-center py-20 text-gray-400 italic">Belum ada data mahasiswa.</td></tr>
                )}
              </tbody>
            </table>
          </div>

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

       {/* --- Verification Modal --- */}
       <Dialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
          <DialogContent className="max-w-md p-8 rounded-2xl bg-white text-center">
             <DialogHeader>
                <DialogTitle className="text-[#5C7B78] font-bold text-2xl text-center mb-4">Verifikasi?</DialogTitle>
                <DialogDescription className="text-center text-gray-600 mb-4">
                   Apakah anda yakin ingin melakukan verifikasi untuk <strong>{selectedUser?.profile.fullName}</strong>?
                </DialogDescription>
             </DialogHeader>
             <div className="space-y-4">
                <div className="text-left">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Catatan Verifikasi</label>
                    <textarea 
                        value={verifyComment}
                        onChange={(e) => setVerifyComment(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5C7B78] outline-none h-24 resize-none"
                        placeholder="Masukkan catatan..."
                    />
                </div>
                <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => setIsVerifyModalOpen(false)} className="px-8 py-2 rounded-xl text-gray-500 border-gray-300">Batal</Button>
                    <Button onClick={submitVerification} className="px-8 py-2 rounded-xl bg-[#5C7B78] text-white hover:bg-[#4a6361]">Ya, Verifikasi</Button>
                </div>
             </div>
          </DialogContent>
       </Dialog>

       {/* --- Upload LOA Modal --- */}
       <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogContent className="max-w-2xl p-0 rounded-[32px] bg-white border-none overflow-hidden">
             <div className="p-8 pb-4 border-b border-gray-100"><DialogTitle className="text-[#5C7B78] font-bold text-2xl">Data Mahasiswa</DialogTitle></div>
             <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6 text-sm text-gray-600">
                   <div><p className="font-bold text-[#5C7B78] mb-1">Nama</p><p className="font-medium text-gray-800">{selectedUser?.profile.fullName}</p></div>
                   <div><p className="font-bold text-[#5C7B78] mb-1">NIM</p><p className="font-medium text-gray-800">{selectedUser?.profile.nim}</p></div>
                   <div><p className="font-bold text-[#5C7B78] mb-1">Judul Artikel</p><p className="font-medium text-gray-800 truncate">{selectedUser?.trainingFlow.articleTitle}</p></div>
                   <div><p className="font-bold text-[#5C7B78] mb-1">Kelompok Jurnal</p><p className="font-medium text-gray-800">{selectedUser?.trainingFlow.journalCode}</p></div>
                </div>
                <div className="pt-4">
                   <p className="font-bold text-[#5C7B78] mb-3">Upload File LOA</p>
                   <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50 relative group hover:bg-[#5C7B78]/5 hover:border-[#5C7B78] transition-colors">
                       {loaFile ? (<div className="flex flex-col items-center z-10"><FileText className="w-10 h-10 text-[#5C7B78] mb-2" /><p className="font-bold text-gray-700">{loaFile.name}</p><button onClick={(e) => {e.stopPropagation(); setLoaFile(null);}} className="text-red-500 text-xs font-bold mt-2 hover:underline">Hapus</button></div>) : (<><Upload className="w-10 h-10 text-gray-400 mb-2 group-hover:text-[#5C7B78]" /><p className="text-gray-500 text-sm">Klik atau drag file PDF di sini</p></>)}
                       <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setLoaFile(e.target.files[0])} />
                   </div>
                </div>
                <div className="flex gap-4 justify-end mt-4"><Button variant="outline" onClick={() => setIsUploadModalOpen(false)} className="px-8 py-6 rounded-xl text-gray-500 border-gray-300 font-bold">Batal</Button><Button onClick={submitUploadLoa} disabled={!loaFile} className="px-12 py-6 rounded-xl bg-[#5C7B78] text-white hover:bg-[#4a6361] font-bold disabled:opacity-50">Terbitkan</Button></div>
             </div>
          </DialogContent>
       </Dialog>

    </div>
  )
}