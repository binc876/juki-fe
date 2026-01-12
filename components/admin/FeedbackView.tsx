'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare,
  User,
  Trash2,
  Clock,
  Quote,
  MoreHorizontal
} from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAlert } from '@/components/ui/alert-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface Feedback {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  user?: {
    email: string;
    profile?: {
      fullName: string;
      nim: string;
    }
  }
}

export default function FeedbackView() {
  const { showAlert } = useAlert()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPage: 1 })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const params: any = {
        page: meta.page,
        limit: meta.limit,
      }
      
      if (searchQuery) params.search = searchQuery

      const res = await api.get('/feedbacks', { params, headers })
      const data = res.data.data || res.data
      const total = res.data.meta?.total || (Array.isArray(data) ? data.length : 0)
      
      const newMeta = {
        page: meta.page,
        limit: meta.limit,
        total: total,
        totalPage: Math.ceil(total / meta.limit) || 1
      }

      setFeedbacks(Array.isArray(data) ? data : [])
      setMeta(newMeta)

    } catch (err: any) {
      console.error('Failed to fetch feedbacks:', err)
    } finally {
      setLoading(false)
    }
  }, [meta.page, meta.limit, searchQuery])

  useEffect(() => {
    fetchFeedbacks()
  }, [fetchFeedbacks])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setMeta(prev => ({ ...prev, page: 1 }))
      fetchFeedbacks()
    }
  }

  const handleDeleteFeedback = async () => {
    if (!selectedFeedback) return
    try {
      const token = localStorage.getItem('token')
      await api.delete(`/feedbacks/${selectedFeedback.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showAlert({ title: 'Berhasil', message: 'Feedback berhasil dihapus!', type: 'success' })
      setIsDeleteOpen(false)
      fetchFeedbacks()
    } catch (err) {
      console.error('Delete failed:', err)
      showAlert({ title: 'Gagal', message: getErrorMessage(err), type: 'error' })
    }
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?'
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       
       {/* Header Section */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
          <div className="space-y-1">
            <h2 className="text-4xl font-extrabold text-[#5C7B78] tracking-tight">Feedback Pengguna</h2>
            <p className="text-[#5C7B78]/70 font-medium text-lg">
              Total : {meta.total} Feedback Masuk
            </p>
          </div>

          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#5C7B78] transition-colors" />
            <input 
              type="text" 
              placeholder="Cari feedback atau mahasiswa..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full bg-white border-2 border-transparent shadow-sm rounded-2xl pl-12 pr-4 py-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-[#5C7B78]/10 focus:border-[#5C7B78]/20 transition-all text-sm font-medium" 
            />
          </div>
       </div>

       {/* List Header (Labels) */}
       <div className="hidden lg:grid grid-cols-[25%_1fr_15%_10%] px-10 text-xs font-bold text-[#5C7B78] uppercase tracking-widest opacity-60">
          <span>Pengirim</span>
          <span>Pesan / Feedback</span>
          <span className="text-center">Waktu</span>
          <span className="text-right pr-4">Aksi</span>
       </div>

       {/* Card List Area */}
       <div className="space-y-4">
          {loading ? (
             [1,2,3].map(i => (
                <div key={i} className="h-24 bg-white/50 animate-pulse rounded-[24px] border border-white/20"></div>
             ))
          ) : feedbacks.length > 0 ? (
             feedbacks.map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-transparent hover:border-[#5C7B78]/20 hover:shadow-lg transition-all duration-300 group"
                >
                   <div className="flex flex-col lg:grid lg:grid-cols-[25%_1fr_15%_10%] gap-6 items-center">
                      
                      {/* Column 1: User Info */}
                      <div className="flex items-center gap-4 w-full">
                         <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-[#5C7B78] font-bold text-sm shadow-inner shrink-0 group-hover:bg-[#5C7B78] group-hover:text-white transition-colors duration-500">
                            {getInitials(item.user?.profile?.fullName || '')}
                         </div>
                         <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 truncate text-base">
                              {item.user?.profile?.fullName || 'Anonim'}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-mono font-bold tracking-wider uppercase">
                              {item.user?.profile?.nim || 'Mahasiswa'}
                            </p>
                         </div>
                      </div>

                      {/* Column 2: Message */}
                      <div className="w-full relative px-2">
                         <p className="text-sm leading-relaxed text-gray-600 font-medium italic lg:line-clamp-2 group-hover:line-clamp-none transition-all">
                            "{item.message}"
                         </p>
                      </div>

                      {/* Column 3: Date */}
                      <div className="flex lg:flex-col items-center lg:justify-center gap-2 text-gray-400 w-full lg:w-auto">
                         <Clock className="w-3.5 h-3.5" />
                         <div className="flex flex-col lg:items-center">
                            <span className="text-[10px] font-bold uppercase tracking-tight">
                               {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] opacity-70 font-mono">
                               {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                      </div>

                      {/* Column 4: Actions */}
                      <div className="flex justify-end w-full lg:w-auto">
                         <button 
                           onClick={() => {
                              setSelectedFeedback(item)
                              setIsDeleteOpen(true)
                           }}
                           className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                           title="Hapus"
                         >
                            <Trash2 className="w-6 h-6" />
                         </button>
                      </div>

                   </div>
                </div>
             ))
          ) : (
             <div className="bg-white rounded-[40px] p-20 text-center shadow-sm border-2 border-dashed border-gray-100 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                   <MessageSquare className="w-12 h-12" strokeWidth={1} />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-gray-800">Belum Ada Feedback</h3>
                   <p className="text-gray-400">Suara mahasiswa akan muncul di sini.</p>
                </div>
             </div>
          )}
       </div>

       {/* Pagination */}
       {feedbacks.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4 px-2">
             <div className="text-sm font-bold text-[#5C7B78]/60 bg-white px-6 py-2 rounded-full shadow-sm border border-gray-50">
                Menampilkan <span className="text-[#5C7B78]">{feedbacks.length}</span> dari <span className="text-[#5C7B78]">{meta.total}</span> Feedback
             </div>
             
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setMeta({...meta, page: Math.max(1, meta.page - 1)})}
                  disabled={meta.page === 1}
                  className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#5C7B78] hover:border-[#5C7B78]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                   <ChevronLeft className="w-6 h-6" />
                </button>
                
                <div className="bg-white px-6 h-12 rounded-2xl border border-gray-100 flex items-center shadow-sm font-bold text-gray-700 min-w-[140px] justify-center">
                   Halaman {meta.page} dari {meta.totalPage}
                </div>

                <button 
                  onClick={() => setMeta({...meta, page: Math.min(meta.totalPage, meta.page + 1)})}
                  disabled={meta.page >= meta.totalPage}
                  className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#5C7B78] hover:border-[#5C7B78]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                   <ChevronRight className="w-6 h-6" />
                </button>
             </div>
          </div>
       )}

       {/* Delete Modal remains same or slightly refined */}
       <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-md p-0 rounded-[32px] bg-white border-none overflow-hidden shadow-2xl">
             <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                   <Trash2 className="w-10 h-10 text-red-500" />
                </div>
                <DialogTitle className="text-gray-900 font-black text-2xl mb-2">Hapus Feedback?</DialogTitle>
                <DialogDescription className="text-gray-500">
                   Feedback dari <strong>{selectedFeedback?.user?.profile?.fullName || 'mahasiswa ini'}</strong> akan dihapus selamanya.
                </DialogDescription>
                <div className="flex flex-col gap-3 mt-10">
                   <Button onClick={handleDeleteFeedback} className="w-full py-7 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-lg transition-all">Ya, Hapus Sekarang</Button>
                   <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="w-full py-7 rounded-2xl text-gray-400 font-bold hover:bg-gray-50">Batal</Button>
                </div>
             </div>
          </DialogContent>
       </Dialog>

    </div>
  )
}
