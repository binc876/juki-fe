'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Award,
  Upload,
  FileText
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
    journalCode?: string;
  };
}

export default function LoaView() {
  const { showAlert } = useAlert();
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPage: 1 })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<any>(null)

  // Action States
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Review / LOA Actions
  const [isReviewActionOpen, setIsReviewActionOpen] = useState(false)
  const [isUploadLoaOpen, setIsUploadLoaOpen] = useState(false)
  const [reviewActionType, setReviewActionType] = useState<'accept' | 'revision'>('accept')
  const [reviewComment, setReviewComment] = useState('')
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

      // Fetch users in REVIEW_WAITING (ARTICLE_VERIFIED/REVIEW_REVISION?) or REVIEW_VERIFIED status
      // Based on flow: After Admin Verifies Article -> User in ARTICLE_VERIFIED -> Admin Reviews -> REVIEW_VERIFIED -> Admin Uploads LOA -> LOA_PUBLISHED
      // So we need users who are ready for Review or Ready for LOA.
      // Assuming 'ARTICLE_VERIFIED' means ready for review?
      // Or maybe 'REVIEW_WAITING'?
      // Let's filter by relevant statuses.
      // Based on Postman "Accept Review" endpoint: /admin/review-loa/:userId/review/accept
      // Based on Postman "Upload LOA" endpoint: /admin/review-loa/:userId/loa/upload
      
      const params: Record<string, string | number> = {
        page: meta.page,
        limit: meta.limit,
        status: 'LOA_PUBLISHED'
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
      console.error('Failed to fetch LOA list:', err)
      // 401 handled globally
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

  // --- Actions: Review (Accept/Revision) ---
  const handleOpenReviewAction = (user: User, type: 'accept' | 'revision') => {
    setSelectedUser(user)
    setReviewActionType(type)
    setReviewComment(type === 'accept' ? 'Artikel diterima tanpa revisi.' : '')
    setIsReviewActionOpen(true)
  }

  const submitReviewAction = async () => {
    if (!selectedUser) return
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const endpoint = reviewActionType === 'accept' 
        ? `/admin/review-loa/${selectedUser.id}/review/accept`
        : `/admin/review-loa/${selectedUser.id}/review/revision`
      
      const payload = {
          comment: reviewComment
      }

      await api.post(endpoint, payload, { headers })

      showAlert({
        title: 'Berhasil',
        message: `Review berhasil disubmit: ${reviewActionType === 'accept' ? 'Diterima' : 'Revisi diminta'}!`,
        type: 'success'
      })
      setIsReviewActionOpen(false)
      fetchUsers()
    } catch (err: any) {
      console.error('Review submission failed:', err)
      showAlert({
        title: 'Gagal',
        message: err.response?.data?.message || 'Gagal mensubmit review.',
        type: 'error'
      })
    }
  }

  // --- Actions: Upload LOA ---
  const handleOpenUploadLoa = (user: User) => {
    setSelectedUser(user)
    setLoaFile(null)
    setIsUploadLoaOpen(true)
  }

  const submitUploadLoa = async () => {
    if (!selectedUser || !loaFile) {
        showAlert({
            title: 'Perhatian',
            message: 'Mohon pilih file LOA terlebih dahulu.',
            type: 'warning'
        })
        return
    }
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', loaFile)

      await api.post(`/admin/review-loa/${selectedUser.id}/loa/upload`, formData, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
      })

      showAlert({
        title: 'Berhasil',
        message: 'LOA berhasil diupload dan dipublikasikan!',
        type: 'success'
      })
      setIsUploadLoaOpen(false)
      fetchUsers()
    } catch (err: any) {
      console.error('LOA upload failed:', err)
      showAlert({
        title: 'Gagal',
        message: err.response?.data?.message || 'Gagal mengupload LOA.',
        type: 'error'
      })
    }
  }

  return (
    <div className="space-y-6">
       
       {/* Header */}
       <div className="flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-bold text-[#5C7B78]">Penerbitan LOA</h2>
            <p className="text-[#5C7B78]/80 font-medium text-xl mt-1">
              Total : {stats?.process?.loa_published || 0} LOA Terbit
            </p>
          </div>
       </div>

       {/* Main Card */}
       <div className="bg-white rounded-[32px] p-10 min-h-[600px] shadow-sm mt-4">
          
          {/* Toolbar */}
          <div className="flex justify-between mb-8">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari Nama / Judul Artikel" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5C7B78]/20" 
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="text-[#5C7B78] text-left border-b-2 border-gray-100 text-lg">
                  <th className="pb-6 font-bold">Nama</th>
                  <th className="pb-6 font-bold text-center">NIM</th>
                  <th className="pb-6 font-bold">Judul Artikel</th>
                  <th className="pb-6 font-bold text-center">Kelompok Jurnal</th>
                  <th className="pb-6 font-bold text-center">File LOA</th>
                  <th className="pb-6 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 text-base">
                {loading ? (
                    <tr><td colSpan={6} className="text-center py-20 text-gray-400 font-bold">Memuat data...</td></tr>
                ) : users.length > 0 ? (
                  users.map((user, idx) => {
                    const loaFile = user.attachments?.find(a => a.type === 'LOA');
                    return (
                    <tr key={idx} className="border-b border-gray-50 last:border-none">
                      <td className="py-6 font-medium">{user.profile?.fullName || '-'}</td>
                      <td className="py-6 text-center">{user.profile?.nim || '-'}</td>
                      <td className="py-6 max-w-[250px] truncate" title={user.trainingFlow?.articleTitle}>{user.trainingFlow?.articleTitle || '-'}</td>
                      <td className="py-6 text-center">{user.trainingFlow?.journalCode || '-'}</td>
                      <td className="py-6 text-center">
                         {loaFile ? (
                             <a 
                                href={`${process.env.NEXT_PUBLIC_API_URL}/attachments/admin/${loaFile.id}/download?token=${localStorage.getItem('token')}`}
                                target="_blank" rel="noreferrer"
                                className="text-[#5C7B78] font-bold hover:underline flex items-center justify-center gap-1"
                             >
                                <Award className="w-4 h-4" /> Download
                             </a>
                         ) : <span className="text-gray-400 text-sm">Belum ada file</span>}
                      </td>
                      <td className="py-6 text-center">
                         <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => handleOpenUploadLoa(user)}
                              className="border border-[#5C7B78] text-[#5C7B78] px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#5C7B78] hover:text-white transition-colors"
                            >
                              Re-Upload LOA
                            </button>
                         </div>
                      </td>
                    </tr>
                  )})
                ) : (
                   <tr><td colSpan={6} className="text-center py-20 text-gray-400 italic">Belum ada data LOA published.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-100">
             <div className="text-gray-600 font-medium">
                Menampilkan <span className="font-bold text-gray-900">{(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)}</span> dari <span className="font-bold text-gray-900">{meta.total}</span> Data
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

       {/* --- Review Action Dialog --- */}
       <Dialog open={isReviewActionOpen} onOpenChange={setIsReviewActionOpen}>
          <DialogContent className="max-w-lg p-8 rounded-2xl bg-white">
             <DialogHeader>
                <DialogTitle className="text-[#5C7B78] font-bold text-xl text-center mb-2">Review Artikel</DialogTitle>
                <DialogDescription className="text-center text-gray-500">
                   {reviewActionType === 'accept' ? 'Terima artikel ini dan lanjut ke proses LOA?' : 'Minta revisi kepada peserta?'}
                </DialogDescription>
             </DialogHeader>
             <div className="space-y-4 mt-4">
                <div>
                   <label className="text-sm font-bold text-gray-600 block mb-2">Komentar / Catatan</label>
                   <textarea 
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#5C7B78] outline-none h-32 resize-none"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                   />
                </div>
                <div className="flex gap-3 pt-2">
                   <Button variant="outline" onClick={() => setIsReviewActionOpen(false)} className="flex-1 py-6 rounded-xl text-gray-600 border-gray-300">Batal</Button>
                   <Button onClick={submitReviewAction} className="flex-1 py-6 rounded-xl text-white font-bold bg-[#5C7B78] hover:bg-[#4a6361]">Submit</Button>
                </div>
             </div>
          </DialogContent>
       </Dialog>

       {/* --- Upload LOA Dialog --- */}
       <Dialog open={isUploadLoaOpen} onOpenChange={setIsUploadLoaOpen}>
          <DialogContent className="max-w-lg p-8 rounded-2xl bg-white">
             <DialogHeader>
                <DialogTitle className="text-[#5C7B78] font-bold text-xl text-center mb-2">Upload LOA</DialogTitle>
                <DialogDescription className="text-center text-gray-500">
                   Upload file Letter of Acceptance (PDF) untuk {selectedUser?.profile.fullName}.
                </DialogDescription>
             </DialogHeader>
             <div className="space-y-6 mt-4">
                <div className="border-2 border-dashed border-[#5C7B78]/30 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-[#F9FAFB]">
                   {loaFile ? (
                       <div className="flex flex-col items-center">
                           <FileText className="w-12 h-12 text-[#5C7B78] mb-2" />
                           <p className="font-bold text-gray-700">{loaFile.name}</p>
                           <p className="text-xs text-gray-500">{(loaFile.size / 1024).toFixed(2)} KB</p>
                           <button onClick={() => setLoaFile(null)} className="text-red-500 text-xs font-bold mt-2 hover:underline">Hapus</button>
                       </div>
                   ) : (
                       <>
                           <Upload className="w-12 h-12 text-gray-400 mb-2" />
                           <p className="text-gray-500 text-sm">Drag & drop atau klik untuk upload</p>
                           <input 
                              type="file" 
                              accept=".pdf"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => e.target.files && setLoaFile(e.target.files[0])}
                           />
                       </>
                   )}
                </div>
                <div className="flex gap-3 pt-2">
                   <Button variant="outline" onClick={() => setIsUploadLoaOpen(false)} className="flex-1 py-6 rounded-xl text-gray-600 border-gray-300">Batal</Button>
                   <Button onClick={submitUploadLoa} disabled={!loaFile} className="flex-1 py-6 rounded-xl text-white font-bold bg-[#5C7B78] hover:bg-[#4a6361] disabled:opacity-50">Upload & Publish</Button>
                </div>
             </div>
          </DialogContent>
       </Dialog>

    </div>
  )
}
