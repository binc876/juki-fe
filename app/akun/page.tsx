'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, FileText, MessageSquare, Loader2, Download, Eye, Send, LogOut } from 'lucide-react'
import { api } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAlert } from '@/components/ui/alert-provider'

export default function AkunPage() {
  const { showAlert } = useAlert()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [newFeedback, setNewFeedback] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (activeTab === 'profile') {
          const res = await api.get('/profiles/me')
          setProfile(res.data.data || res.data)
        } else if (activeTab === 'documents') {
          const res = await api.get('/attachments/me')
          setDocuments(Array.isArray(res.data) ? res.data : (res.data.data || []))
        } else if (activeTab === 'feedback') {
          const res = await api.get('/feedbacks/me')
          setFeedbacks(Array.isArray(res.data) ? res.data : (res.data.data || []))
        }
      } catch (err) {
        console.error('Gagal mengambil data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [activeTab])

  // Handle Create Feedback
  const handleCreateFeedback = async () => {
    if (!newFeedback.trim()) return
    try {
      await api.post('/feedbacks', { message: newFeedback })
      setNewFeedback('')
      // Refresh list
      const res = await api.get('/feedbacks/me')
      setFeedbacks(Array.isArray(res.data) ? res.data : (res.data.data || []))
    } catch (err) {
      console.error('Gagal mengirim feedback:', err)
      showAlert({ title: 'Gagal', message: 'Gagal mengirim feedback', type: 'error' })
    }
  }

  // Handle Logout
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-[#949F93] text-white font-sans selection:bg-white/30">
      
      {/* Header / Navbar Custom sesuai desain */}
      <header className="px-6 md:px-12 py-6 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-wide">Juki.Hub</div>
        
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <Link href="/beranda" className="hover:opacity-80 transition">Beranda</Link>
          <Link href="/pelatihanku" className="hover:opacity-80 transition">Pelatihanku</Link>
        </nav>

        <div className="w-10 h-10 relative rounded-full overflow-hidden border-2 border-white/50">
           <Image 
              src="/account-pic.jpg"
              alt="Profile"
              fill
              className="object-cover"
           />
        </div>
      </header>

      <main className="px-6 md:px-12 pb-12 flex flex-col md:flex-row gap-8 md:gap-16 mt-4">
        
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col justify-between min-h-[500px]">
          <nav className="space-y-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-6 py-3 rounded-r-full transition-all duration-300 font-medium ${
                activeTab === 'profile' 
                  ? 'bg-white text-[#949F93] shadow-lg translate-x-2' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Informasi Pribadi
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full text-left px-6 py-3 rounded-r-full transition-all duration-300 font-medium ${
                activeTab === 'documents' 
                  ? 'bg-white text-[#949F93] shadow-lg translate-x-2' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Dokumen
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`w-full text-left px-6 py-3 rounded-r-full transition-all duration-300 font-medium ${
                activeTab === 'feedback' 
                  ? 'bg-white text-[#949F93] shadow-lg translate-x-2' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Feedback
            </button>
          </nav>

          {/* Logout Button */}
          <div className="mt-auto pt-8">
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-3 px-6 py-3 border border-white rounded-xl hover:bg-white hover:text-[#949F93] transition-colors w-full md:w-auto"
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 relative">
           {/* Border Container */}
           <div className="border-2 border-white rounded-[32px] min-h-[500px] p-8 md:p-12 relative">
              
              {/* CONTENT: PROFILE */}
              {activeTab === 'profile' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl md:text-3xl font-bold mb-10">Informasi Pribadi</h2>
                  
                  <div className="space-y-6 max-w-xl">
                    {loading ? (
                       <p className="text-white/60 italic">Memuat data...</p> 
                    ) : profile ? (
                      <>
                        <div className="space-y-0.5">
                          <p className="text-xs md:text-sm text-white/80">Nama Lengkap</p>
                          <p className="text-base md:text-lg font-bold">{profile.fullName || '-'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs md:text-sm text-white/80">Nomor Induk Mahasiswa</p>
                          <p className="text-base md:text-lg font-bold">{profile.nim || '-'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs md:text-sm text-white/80">Email</p>
                          <p className="text-base md:text-lg font-bold">{profile.email || '-'}</p>
                        </div>
                         <div className="space-y-0.5">
                          <p className="text-xs md:text-sm text-white/80">WhatsApp</p>
                          <p className="text-base md:text-lg font-bold">{profile.phone || '-'}</p>
                        </div>
                        
                        {/* Data Tambahan (Jika ada di API) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-white/10 mt-4">
                           <div className="space-y-0.5">
                              <p className="text-xs md:text-sm text-white/80">Tempat Lahir</p>
                              <p className="text-base font-bold">{profile.birthPlace || '-'}</p>
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-xs md:text-sm text-white/80">Tanggal Lahir</p>
                              <p className="text-base font-bold">
                                {profile.birthDate 
                                  ? new Date(profile.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
                                  : '-'}
                              </p>
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-xs md:text-sm text-white/80">Jenis Kelamin</p>
                              <p className="text-base font-bold">
                                {profile.gender === 'MALE' ? 'Laki-laki' : profile.gender === 'FEMALE' ? 'Perempuan' : (profile.gender || '-')}
                              </p>
                           </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-white/60">Gagal memuat data profil.</p>
                    )}
                  </div>
                </div>
              )}

              {/* CONTENT: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl md:text-3xl font-bold mb-10">Dokumen</h2>

                  <div className="space-y-10">
                     {/* Section 1 */}
                     <div className="space-y-1">
                        <h3 className="text-xl font-bold">Dokumen Pelatihan</h3>
                        {documents.filter(d => d.type === 'TRAINING').length > 0 ? (
                           <div className="grid grid-cols-1 gap-3 pt-2">
                             {documents.filter(d => d.type === 'TRAINING').map((doc, idx) => (
                               <div key={idx} className="p-4 bg-white/10 border border-white/40 rounded-xl flex justify-between items-center hover:bg-white/20 transition">
                                 <span className="font-medium">{doc.filename}</span>
                                 <button className="text-xs bg-white text-[#949F93] px-4 py-1.5 rounded-lg font-bold">Download</button>
                               </div>
                             ))}
                           </div>
                        ) : (
                          <p className="text-white/70 text-sm font-medium">Tidak terdapat dokumen pelatihan yang tersedia</p>
                        )}
                     </div>

                     {/* Section 2 */}
                     <div className="space-y-1">
                        <h3 className="text-xl font-bold">Dokumen Bebas Tanggungan</h3>
                        {documents.filter(d => d.type === 'LOA').length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 pt-2">
                             {documents.filter(d => d.type === 'LOA').map((doc, idx) => (
                               <div key={idx} className="p-4 bg-white/10 border border-white/40 rounded-xl flex justify-between items-center hover:bg-white/20 transition">
                                 <span className="font-medium">{doc.filename}</span>
                                 <button className="text-xs bg-white text-[#949F93] px-4 py-1.5 rounded-lg font-bold">Download</button>
                               </div>
                             ))}
                           </div>
                        ) : (
                           <p className="text-white/70 text-sm font-medium">Tidak terdapat dokumen bebas tanggungan yang tersedia</p>
                        )}
                     </div>
                  </div>
                </div>
              )}

              {/* CONTENT: FEEDBACK */}
              {activeTab === 'feedback' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  {/* Kotak Input Feedback */}
                  <div className="border-2 border-white rounded-[24px] p-6 md:p-8">
                    <h2 className="text-2xl font-bold mb-1">Feedback</h2>
                    <p className="text-sm mb-6 text-white/80">Punya saran atau pengalaman seru bareng Jupalo? Ceritain ke kami ya!</p>

                    <div className="space-y-4">
                      <div className="relative group">
                        <textarea 
                          className="w-full h-48 rounded-[20px] p-6 pr-6 pb-16 bg-[#D4C4AF] border border-[#C0C0C0] text-[#4A5548] font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-white/80 focus:border-transparent resize-none placeholder:text-[#8C968A] transition-all duration-300"
                          placeholder="Ceritakan pengalamanmu atau berikan saran untuk Jupalo..."
                          value={newFeedback}
                          onChange={(e) => setNewFeedback(e.target.value)}
                        ></textarea>
                        
                        <div className="absolute bottom-5 right-5">
                           <button 
                            onClick={handleCreateFeedback}
                            disabled={!newFeedback.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white text-[#949F93] text-sm font-bold tracking-wide rounded-full shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                           >
                             <span>Kirim</span>
                             <Send className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kotak Feedback Terkirim */}
                  <div className="border-2 border-white rounded-[24px] p-6 md:p-8">
                    <h3 className="text-xl font-semibold mb-4 text-white">Feedback Terkirim</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {feedbacks.length > 0 ? feedbacks.map((item: any, idx) => (
                        <div key={idx} className="p-4 bg-white/19 border border-white rounded-[12px] shadow-sm transition hover:bg-white/25">
                          <p className="text-white text-base mb-2">{item.message}</p>
                          <p className="text-white/70 text-[10px] font-medium">
                            {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )) : (
                        <p className="text-white/60 italic">Belum ada feedback yang dikirim.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

           </div>
        </section>

      </main>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="max-w-md p-8 rounded-2xl">
           <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#D15651] flex items-center justify-center text-[#D15651]">
                 <LogOut className="w-6 h-6 ml-1" />
              </div>
              <DialogTitle className="text-xl font-bold text-gray-800">
                Apakah anda yakin ingin keluar?
              </DialogTitle>
              
              <div className="flex gap-4 w-full mt-6">
                 <Button 
                   onClick={handleLogout}
                   className="flex-1 bg-[#D15651] hover:bg-[#b54641] text-white py-6 rounded-xl"
                 >
                   Keluar
                 </Button>
                 <Button 
                   variant="outline"
                   onClick={() => setShowLogoutConfirm(false)}
                   className="flex-1 border-gray-300 text-gray-600 py-6 rounded-xl hover:bg-gray-50"
                 >
                   Batal
                 </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
