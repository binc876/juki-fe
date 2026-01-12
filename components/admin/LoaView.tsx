'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Award,
  Upload,
  FileText,
  Eye,
  X,
  AlertTriangle
} from 'lucide-react'
import { api, getErrorMessage, downloadFile, viewFile } from '@/lib/api'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { LoaDocument } from './LoaDocument'
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
    ojsAccount?: {
        username?: string;
        password?: string;
        journalLink?: string;
        journalCode?: string;
    };
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
  const loaRef = useRef<HTMLDivElement>(null)
  
  // Review / LOA Actions
  const [isReviewActionOpen, setIsReviewActionOpen] = useState(false)
  const [isUploadLoaOpen, setIsUploadLoaOpen] = useState(false)
  const [reviewActionType, setReviewActionType] = useState<'accept' | 'revision'>('accept')
  const [reviewComment, setReviewComment] = useState('')

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

      // Fetch users who already have LOA published (for re-upload/re-generate)
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
        message: getErrorMessage(err),
        type: 'error'
      })
    }
  }

  // --- Actions: Generate LOA ---
  const handleOpenUploadLoa = (user: User) => {
    setSelectedUser(user)
    setIsUploadLoaOpen(true)
  }

  const submitUploadLoa = async () => {
    if (!selectedUser || !loaRef.current) return
    
    try {
        let linkRect: DOMRect | null = null;

        // 1. Generate PDF from DOM
        const canvas = await html2canvas(loaRef.current, { 
            scale: 2, 
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            onclone: (clonedDoc) => {
                // 1. Fix for "lab" color function error
                const style = clonedDoc.createElement('style');
                style.innerHTML = `
                    * { 
                        color: #000000 !important;
                        border-color: #000000 !important;
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                    }
                    :root {
                        --background: 255 255 255 !important;
                        --foreground: 0 0 0 !important;
                    }
                    .document-root { background-color: #ffffff !important; }
                    .watermark-container, .watermark-container * { background-color: transparent !important; }
                `;
                clonedDoc.head.appendChild(style);

                // 2. Scan and remove any remaining 'lab(' or 'oklch' from inline styles
                const allElements = clonedDoc.querySelectorAll('*');
                allElements.forEach((el: any) => {
                    if (el.style) {
                        const computed = window.getComputedStyle(el);
                        if (computed.color?.includes('lab') || computed.color?.includes('oklch')) el.style.color = '#000000';
                        if (computed.backgroundColor?.includes('lab') || computed.backgroundColor?.includes('oklch')) el.style.backgroundColor = 'transparent';
                    }
                });

                // 3. Find link position
                const linkEl = clonedDoc.querySelector('.footer-link');
                if (linkEl) {
                    linkRect = linkEl.getBoundingClientRect();
                }
            }
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        // MANUALLY ADD LINK OVERLAY
        if (linkRect && selectedUser.trainingFlow.ojsAccount?.journalLink) {
            const mmFactor = 210 / (loaRef.current.clientWidth || 794);
            
            const x = linkRect.left * mmFactor;
            const y = linkRect.top * mmFactor;
            const w = linkRect.width * mmFactor;
            const h = linkRect.height * mmFactor;

            pdf.link(x, y, w, h, { url: selectedUser.trainingFlow.ojsAccount.journalLink });
        }

        const pdfBlob = pdf.output('blob');

        if (pdfBlob.size === 0) throw new Error("Generated PDF is empty");

        // 2. Upload to Backend
        const token = localStorage.getItem('token')
        const formData = new FormData()
        formData.append('file', pdfBlob, `LOA_${selectedUser.profile.nim}.pdf`)

        await api.post(`/admin/review-loa/${selectedUser.id}/loa/upload`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })

        showAlert({ title: 'Berhasil', message: 'LOA berhasil diperbarui!', type: 'success' })
        setIsUploadLoaOpen(false)
        fetchUsers()
    } catch (err: any) {
        console.error('LOA Generation Error:', err);
        const errorMsg = err?.message || 'Gagal generate/upload LOA';
        showAlert({ 
            title: 'Gagal', 
            message: errorMsg.includes('lab') 
                ? 'Gagal karena masalah format warna. Silakan hubungi admin.'
                : errorMsg, 
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
                             <button 
                                onClick={async () => {
                                    try {
                                        await viewFile(`/attachments/admin/${loaFile.id}/download`);
                                    } catch (err) {
                                        showAlert({ title: 'Gagal', message: 'Gagal melihat LOA', type: 'error' });
                                    }
                                }}
                                className="text-[#5C7B78] font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                             >
                                <Eye className="w-4 h-4" /> Lihat
                             </button>
                         ) : <span className="text-gray-400 text-sm">Belum ada file</span>}
                      </td>
                      <td className="py-6 text-center">
                         <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => handleOpenUploadLoa(user)}
                              className="border border-[#5C7B78] text-[#5C7B78] px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#5C7B78] hover:text-white transition-colors"
                            >
                              Re-Generate LOA
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

       {/* --- Generate LOA Modal (Split View) --- */}
       <Dialog open={isUploadLoaOpen} onOpenChange={setIsUploadLoaOpen}>
          <DialogContent className="!max-w-[95vw] md:!max-w-6xl p-0 rounded-[20px] bg-white border-none overflow-hidden h-[90vh] flex flex-col md:flex-row">
             
             {/* Left Panel: Control & Data */}
             <div className="w-full md:w-[400px] flex flex-col border-r border-gray-100 bg-white h-full relative z-10 shrink-0">
                <div className="p-8 pb-4 border-b border-gray-50">
                   <DialogTitle className="text-[#5C7B78] font-bold text-2xl mb-2">Terbitkan LOA</DialogTitle>
                   <DialogDescription className="text-gray-500 text-sm leading-relaxed">
                      Review data mahasiswa sebelum menerbitkan ulang dokumen resmi.
                   </DialogDescription>
                </div>

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

                <div className="p-8 pt-4 border-t border-gray-50 bg-white">
                   <Button 
                      onClick={submitUploadLoa} 
                      className="w-full py-6 bg-[#5C7B78] hover:bg-[#4a6361] text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all mb-3"
                   >
                      Generate & Terbitkan
                   </Button>
                   <Button 
                      variant="ghost" 
                      onClick={() => setIsUploadLoaOpen(false)} 
                      className="w-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl"
                   >
                      Batal
                   </Button>
                </div>
             </div>

             {/* Right Panel: Preview Stage */}
             <div className="flex-1 bg-[#2D2F31] relative overflow-hidden flex flex-col">
                <div className="h-14 bg-[#252729] flex items-center justify-between px-6 border-b border-white/5 shrink-0">
                   <div className="flex items-center gap-2 text-white/50 text-xs font-medium">
                      <Eye className="w-4 h-4" />
                      <span>Document Preview</span>
                   </div>
                   <div className="text-white/30 text-[10px]">A4 • Scaled 60%</div>
                </div>

                <div className="flex-1 overflow-auto flex items-start justify-center p-8 bg-[#2D2F31] custom-scrollbar">
                   <div 
                      className="relative shadow-2xl shrink-0 transition-transform duration-300"
                      style={{ 
                         width: 'calc(210mm * 0.6)', 
                         height: 'calc(297mm * 0.6)',
                         marginBottom: '2rem' 
                      }}
                   >
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
                              ojsLink={selectedUser?.trainingFlow.ojsAccount?.journalLink}
                          />
                      </div>
                      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] rounded-[1px]"></div>
                   </div>
                </div>
             </div>

          </DialogContent>
       </Dialog>

       {/* Hidden LOA Template for High-Resolution Generation */}
       <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
          <div style={{ width: '210mm' }}>
             {selectedUser && (
                <LoaDocument 
                   ref={loaRef}
                   name={selectedUser.profile.fullName}
                   articleTitle={selectedUser.trainingFlow.articleTitle || 'Judul Artikel'}
                   date={new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                   ojsLink={selectedUser.trainingFlow.ojsAccount?.journalLink}
                />
             )}
          </div>
       </div>

    </div>
  )
}

