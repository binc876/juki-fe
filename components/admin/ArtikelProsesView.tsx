'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Upload,
  Eye,
  FileText,
  AlertTriangle,
  X
} from 'lucide-react'
import { api, getErrorMessage, downloadFile, viewFile } from '@/lib/api'
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { LoaDocument } from './LoaDocument';
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
  const [reviewAction, setReviewAction] = useState<'accept' | 'revision' | null>(null) // New state
  
  // Upload LOA Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [loaFile, setLoaFile] = useState<File | null>(null)
  const loaRef = useRef<HTMLDivElement>(null)

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
      setVerifyComment(type === 'article' ? 'Artikel telah diverifikasi.' : '')
      setReviewAction(null) // Reset
      setIsVerifyModalOpen(true)
  }

  const submitVerification = async (action?: 'accept' | 'revision') => {
      if (!selectedUser || !verifyType) return
      
      // Determine effective action for 'review' type if passed from button click
      const currentAction = action || reviewAction; 

      try {
          const token = localStorage.getItem('token')
          const headers = { Authorization: `Bearer ${token}` }
          
          let endpoint = '';
          let payload: any = {}; // Default empty

          if (verifyType === 'article') {
              endpoint = `/admin/articles/${selectedUser.id}/verify`;
              payload.comment = verifyComment || 'Artikel telah diverifikasi.';
          } else {
              // Review Type
              if (currentAction === 'accept') {
                  endpoint = `/admin/review-loa/${selectedUser.id}/review/accept`;
                  // Only add comment if user typed one
                  if (verifyComment) payload.comment = verifyComment;
              } else {
                  endpoint = `/admin/review-loa/${selectedUser.id}/review/revision`;
                  if (!verifyComment) {
                      showAlert({ title: 'Perhatian', message: 'Harap berikan catatan revisi.', type: 'warning' });
                      return;
                  }
                  payload.comment = verifyComment;
              }
          }

          console.log(`Submitting ${currentAction} to ${endpoint} with`, payload);
          await api.post(endpoint, payload, { headers })

          showAlert({ title: 'Berhasil', message: `Verifikasi ${currentAction === 'revision' ? 'revisi' : 'berhasil'}!`, type: 'success' })
          setIsVerifyModalOpen(false)
          fetchUsers()
      } catch (err: any) {
          showAlert({ title: 'Gagal', message: getErrorMessage(err), type: 'error' })
      }
  }

  const openUploadModal = (user: User) => {
      setSelectedUser(user)
      setLoaFile(null)
      setIsUploadModalOpen(true)
  }

  const submitUploadLoa = async () => {
      if (!selectedUser || !loaRef.current) return
      
      try {
          // 1. Generate PDF from DOM
          const canvas = await html2canvas(loaRef.current, { 
              scale: 2, // Use 2 for higher resolution text
              backgroundColor: '#ffffff',
              useCORS: true,
              logging: false,
              onclone: (clonedDoc) => {
                  // Critical fix for "unsupported color function lab" error
                  const style = clonedDoc.createElement('style');
                  style.innerHTML = `
                      * { 
                          color: rgb(0, 0, 0) !important;
                          background-color: rgb(255, 255, 255) !important;
                          border-color: rgb(200, 200, 200) !important;
                      }
                      /* Override any CSS variables that might use lab() */
                      :root {
                          --color-primary: rgb(92, 123, 120) !important;
                          --color-secondary: rgb(217, 142, 46) !important;
                      }
                  `;
                  clonedDoc.head.appendChild(style);
                  
                  // Force inline styles on root elements
                  clonedDoc.documentElement.style.backgroundColor = '#ffffff';
                  clonedDoc.documentElement.style.color = '#000000';
                  clonedDoc.body.style.backgroundColor = '#ffffff';
                  clonedDoc.body.style.color = '#000000';
                  
                  // Remove any problematic CSS custom properties
                  const allElements = clonedDoc.querySelectorAll('*');
                  allElements.forEach((el: any) => {
                      if (el.style) {
                          // Replace CSS variables with static values
                          const computedStyle = window.getComputedStyle(el);
                          if (computedStyle.color.includes('lab')) {
                              el.style.color = '#000000';
                          }
                          if (computedStyle.backgroundColor.includes('lab')) {
                              el.style.backgroundColor = '#ffffff';
                          }
                      }
                  });
              }
          });
          
          // Use JPEG with high quality
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
          const pdfBlob = pdf.output('blob');

          console.log(`Generated PDF Size: ${(pdfBlob.size / 1024 / 1024).toFixed(2)} MB`);

          // 2. Upload to Backend
          const token = localStorage.getItem('token')
          
          if (pdfBlob.size === 0) {
              throw new Error("Generated PDF is empty");
          }

          const formData = new FormData()
          formData.append('file', pdfBlob, `LOA_${selectedUser.profile.nim}.pdf`)

          await api.post(`/admin/review-loa/${selectedUser.id}/loa/upload`, formData, {
            headers: { Authorization: `Bearer ${token}` } 
          })

          showAlert({ title: 'Berhasil', message: 'LOA berhasil digenerate dan diterbitkan!', type: 'success' })
          setIsUploadModalOpen(false)
          fetchUsers()
      } catch (err: any) {
          console.error('LOA Generation Error:', err);
          showAlert({ 
              title: 'Gagal', 
              message: getErrorMessage(err), 
              type: 'error' 
          })
      }
  }

  const downloadLoa = async (user: User) => {
      const loa = user.attachments?.find(a => a.type === 'LOA')
      if (loa) {
          try {
              await viewFile(`/attachments/admin/${loa.id}/download`);
          } catch (err) {
              showAlert({ title: 'Gagal', message: 'Gagal melihat LOA', type: 'error' });
          }
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
          if (status === 'REVIEW_REVISION') {
              return <span className="text-[#D98E2E] text-[10px] font-bold">Menunggu Revisi</span>
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
                        placeholder={verifyType === 'review' ? "Berikan catatan revisi atau pesan penerimaan..." : "Masukkan catatan..."}
                    />
                </div>
                <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => setIsVerifyModalOpen(false)} className="flex-1 py-2 rounded-xl text-gray-500 border-gray-300">Batal</Button>
                    
                    {verifyType === 'article' ? (
                        <Button onClick={() => submitVerification()} className="flex-1 py-2 rounded-xl bg-[#5C7B78] text-white hover:bg-[#4a6361]">Ya, Verifikasi</Button>
                    ) : (
                        <>
                            <Button onClick={() => submitVerification('revision')} className="flex-1 py-2 rounded-xl bg-[#D98E2E] text-white hover:bg-[#b57b2b]">Minta Revisi</Button>
                            <Button onClick={() => submitVerification('accept')} className="flex-1 py-2 rounded-xl bg-[#5C7B78] text-white hover:bg-[#4a6361]">Terima Artikel</Button>
                        </>
                    )}
                </div>
             </div>
          </DialogContent>
       </Dialog>

       {/* --- Generate LOA Modal (Remade Split View) --- */}
       <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogContent className="!max-w-[95vw] md:!max-w-6xl p-0 rounded-[20px] bg-white border-none overflow-hidden h-[90vh] flex flex-col md:flex-row">
             
             {/* Left Panel: Control & Data */}
             <div className="w-full md:w-[400px] flex flex-col border-r border-gray-100 bg-white h-full relative z-10 shrink-0">
                {/* Header */}
                <div className="p-8 pb-4 border-b border-gray-50">
                   <DialogTitle className="text-[#5C7B78] font-bold text-2xl mb-2">Terbitkan LOA</DialogTitle>
                   <DialogDescription className="text-gray-500 text-sm leading-relaxed">
                      Review data mahasiswa sebelum menerbitkan dokumen resmi.
                   </DialogDescription>
                </div>

                {/* Data Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6 custom-scrollbar">
                   <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Detail Penerima</h4>
                      <div className="space-y-5">
                         <div className="group">
                            <label className="text-[10px] font-bold text-[#5C7B78] uppercase mb-1 block">Nama Lengkap</label>
                            <div className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 w-full">{selectedUser?.profile.fullName}</div>
                         </div>
                         <div className="group">
                            <label className="text-[10px] font-bold text-[#5C7B78] uppercase mb-1 block">NIM</label>
                            <div className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 w-full font-mono">{selectedUser?.profile.nim}</div>
                         </div>
                         <div className="group">
                            <label className="text-[10px] font-bold text-[#5C7B78] uppercase mb-1 block">Judul Artikel</label>
                            <div className="text-sm font-medium text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                               {selectedUser?.trainingFlow.articleTitle}
                            </div>
                         </div>
                         <div className="group">
                            <label className="text-[10px] font-bold text-[#5C7B78] uppercase mb-1 block">Jurnal Tujuan</label>
                            <div className="flex items-center gap-2">
                               <span className="bg-[#5C7B78] text-white text-xs font-bold px-3 py-1 rounded-full">{selectedUser?.trainingFlow.journalCode}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 pt-4 border-t border-gray-50 bg-white">
                   <Button 
                      onClick={submitUploadLoa} 
                      className="w-full py-6 bg-[#5C7B78] hover:bg-[#4a6361] text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all mb-3"
                   >
                      Generate & Terbitkan
                   </Button>
                   <Button 
                      variant="ghost" 
                      onClick={() => setIsUploadModalOpen(false)} 
                      className="w-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl"
                   >
                      Batal
                   </Button>
                </div>
             </div>

             {/* Right Panel: Preview Stage */}
             <div className="flex-1 bg-[#2D2F31] relative overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="h-14 bg-[#252729] flex items-center justify-between px-6 border-b border-white/5 shrink-0">
                   <div className="flex items-center gap-2 text-white/50 text-xs font-medium">
                      <Eye className="w-4 h-4" />
                      <span>Document Preview</span>
                   </div>
                   <div className="text-white/30 text-[10px]">A4 • Scaled 60%</div>
                </div>

                {/* Scrollable Canvas Area */}
                <div className="flex-1 overflow-auto flex items-start justify-center p-8 bg-[#2D2F31] custom-scrollbar">
                   {/* Tight Wrapper: Matches visual size to prevent ghost scrollbars */}
                   <div 
                      className="relative shadow-2xl shrink-0 transition-transform duration-300"
                      style={{ 
                         width: 'calc(210mm * 0.6)', 
                         height: 'calc(297mm * 0.6)',
                         marginBottom: '2rem' 
                      }}
                   >
                      {/* Actual Document: Full size but scaled down */}
                      <div 
                         style={{ 
                            width: '210mm', 
                            height: '297mm',
                            transform: 'scale(0.6)',
                            transformOrigin: 'top left',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            backgroundColor: 'white'
                         }} 
                      >
                          <LoaDocument 
                              name={selectedUser?.profile.fullName || ''}
                              articleTitle={selectedUser?.trainingFlow.articleTitle || ''}
                              date={new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          />
                      </div>
                      
                      {/* Overlay for sheen/depth */}
                      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] rounded-[1px]"></div>
                   </div>
                </div>
             </div>

          </DialogContent>
       </Dialog>

       {/* Hidden LOA Template for High-Resolution Generation (Capturing 1:1 scale) */}
       <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
          <div style={{ width: '210mm' }}>
             {selectedUser && (
                <LoaDocument 
                   ref={loaRef}
                   name={selectedUser.profile.fullName}
                   articleTitle={selectedUser.trainingFlow.articleTitle || 'Judul Artikel'}
                   date={new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
             )}
          </div>
       </div>

    </div>
  )
}