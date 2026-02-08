'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, FileText, Loader2, Download, Eye, Send, LogOut, Lock, EyeOff } from 'lucide-react'
import { api, getErrorMessage, viewFile, downloadFile } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogTitle,
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
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Change Password State
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [changePasswordLoading, setChangePasswordLoading] = useState(false)

  const menuItems = [
    { id: 'profile', label: 'Informasi Pribadi' },
    { id: 'documents', label: 'Dokumen' },
    { id: 'password', label: 'Ganti Password' },
    { id: 'feedback', label: 'Feedback' }
  ]

  const activeMenuItem = menuItems.find(item => item.id === activeTab)

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (activeTab === 'profile') {
          const res = await api.get('/profiles/me')
          const data = res.data.data || res.data
          
          // Admin Protection
          const roles = data.user?.roles || []
          if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
              router.replace('/admin')
              return
          }

          setProfile(data)
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
      showAlert({ title: 'Gagal', message: getErrorMessage(err), type: 'error' })
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

  // Handle Change Password
  const handleChangePassword = async () => {
    // Validation
    if (!oldPassword || !newPassword) {
      showAlert({ title: 'Perhatian', message: 'Password lama dan password baru harus diisi', type: 'warning' })
      return
    }

    if (oldPassword.length < 6) {
      showAlert({ title: 'Perhatian', message: 'Password lama minimal 6 karakter', type: 'warning' })
      return
    }

    if (newPassword.length < 6) {
      showAlert({ title: 'Perhatian', message: 'Password baru minimal 6 karakter', type: 'warning' })
      return
    }

    setChangePasswordLoading(true)
    try {
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword
      })
      
      showAlert({ 
        title: 'Berhasil', 
        message: 'Password berhasil diubah. Anda akan logout otomatis dan harus login kembali dengan password baru.', 
        type: 'success' 
      })
      
      // Clear form
      setOldPassword('')
      setNewPassword('')
      
      // Logout after 2 seconds
      setTimeout(() => {
        handleLogout()
      }, 2000)
      
    } catch (err) {
      console.error('Gagal mengubah password:', err)
      showAlert({ title: 'Gagal', message: getErrorMessage(err), type: 'error' })
    } finally {
      setChangePasswordLoading(false)
    }
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#949F93] text-white font-sans selection:bg-white/30">
      
      {/* Header / Navbar Fixed */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#949F93]/90 backdrop-blur-md px-4 sm:px-6 md:px-12 py-4 md:py-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="text-xl sm:text-2xl font-bold tracking-wide">Juki.Hub</div>
          
          <nav className="hidden md:flex gap-6 lg:gap-8 text-sm font-medium">
            <Link href="/beranda" className="hover:opacity-80 transition">Beranda</Link>
            <Link href="/pelatihanku" className="hover:opacity-80 transition">Pelatihanku</Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full overflow-hidden border-2 border-white/50">
              <Image 
                  src="/account-pic.jpg"
                  alt="Profile"
                  fill
                  className="object-cover"
              />
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 sm:mt-4 pb-2">
            <nav className="flex flex-col gap-1 sm:gap-2">
              <Link 
                href="/beranda" 
                className="py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg hover:bg-white/10 transition text-sm sm:text-base"
                onClick={() => setMobileMenuOpen(false)}
              >
                Beranda
              </Link>
              <Link 
                href="/pelatihanku" 
                className="py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg hover:bg-white/10 transition text-sm sm:text-base"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pelatihanku
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="px-4 sm:px-6 md:px-12 pb-8 sm:pb-12 flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-16 pt-24 sm:pt-28 md:pt-32">
        
        {/* Mobile Dropdown Menu */}
        <div className="lg:hidden w-full">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white text-[#949F93] rounded-xl font-medium text-sm sm:text-base shadow-md"
            >
              <span>{activeMenuItem?.label}</span>
              <svg 
                className={`w-5 h-5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-10">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      setDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 sm:px-6 py-3 text-sm sm:text-base transition-colors ${
                      activeTab === item.id
                        ? 'bg-[#949F93] text-white font-semibold'
                        : 'text-[#949F93] hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Logout Button Mobile */}
          <div className="mt-4">
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-white text-white rounded-xl hover:bg-white hover:text-[#949F93] transition-colors w-full text-sm sm:text-base font-medium"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between sticky top-24 h-[calc(100vh-140px)]">
          <nav className="space-y-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-6 py-3 rounded-r-full transition-all duration-300 font-medium text-base ${
                  activeTab === item.id
                    ? 'bg-white text-[#949F93] shadow-lg translate-x-2'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Logout Button Desktop */}
          <div className="mt-auto pt-8">
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-3 px-6 py-3 border border-white rounded-xl hover:bg-white hover:text-[#949F93] transition-colors w-full text-base"
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 relative">
           {/* Border Container */}
           <div className="border-2 border-white rounded-2xl sm:rounded-[32px] min-h-[400px] sm:min-h-[500px] p-4 sm:p-6 md:p-8 lg:p-12 relative">
              
              {/* CONTENT: PROFILE */}
              {activeTab === 'profile' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 md:mb-10">Informasi Pribadi</h2>
                  
                  <div className="space-y-4 sm:space-y-6 max-w-xl">
                    {loading ? (
                       <p className="text-white/60 italic text-sm sm:text-base">Memuat data...</p> 
                    ) : profile ? (
                      <>
                        <div className="space-y-0.5">
                          <p className="text-xs sm:text-sm text-white/80">Nama Lengkap</p>
                          <p className="text-sm sm:text-base md:text-lg font-bold break-words">{profile.fullName || '-'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs sm:text-sm text-white/80">Nomor Induk Mahasiswa</p>
                          <p className="text-sm sm:text-base md:text-lg font-bold">{profile.nim || '-'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs sm:text-sm text-white/80">Email</p>
                          <p className="text-sm sm:text-base md:text-lg font-bold break-all">{profile.user?.email || profile.email || '-'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs sm:text-sm text-white/80">WhatsApp</p>
                          <p className="text-sm sm:text-base md:text-lg font-bold">{profile.phone || '-'}</p>
                        </div>

                        <div className="space-y-0.5">
                          <p className="text-xs sm:text-sm text-white/80">Status KTM</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                             <span className={`px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase ${profile.user?.attachments?.some((a: any) => a.type === 'KTM') ? 'bg-green-500/20 text-green-200' : 'bg-yellow-500/20 text-yellow-200'}`}>
                                {profile.user?.attachments?.some((a: any) => a.type === 'KTM') ? 'Sudah Terunggah' : 'Belum Terunggah'}
                             </span>
                             {profile.user?.attachments?.find((a: any) => a.type === 'KTM') && (
                                <button 
                                  onClick={() => {
                                    const ktm = profile.user.attachments.find((a: any) => a.type === 'KTM');
                                    viewFile(`/attachments/${ktm.id}/download`);
                                  }}
                                  className="text-[10px] sm:text-xs underline hover:text-white/70"
                                >
                                  Lihat KTM
                                </button>
                             )}
                          </div>
                        </div>
                        
                        {/* Data Tambahan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2 border-t border-white/10 mt-4">
                           <div className="space-y-0.5">
                              <p className="text-xs sm:text-sm text-white/80">Tempat Lahir</p>
                              <p className="text-sm sm:text-base font-bold break-words">{profile.birthPlace || '-'}</p>
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-xs sm:text-sm text-white/80">Tanggal Lahir</p>
                              <p className="text-sm sm:text-base font-bold">
                                {profile.birthDate 
                                  ? new Date(profile.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
                                  : '-'}
                              </p>
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-xs sm:text-sm text-white/80">Jenis Kelamin</p>
                              <p className="text-sm sm:text-base font-bold">
                                {profile.gender === 'MALE' ? 'Laki-laki' : profile.gender === 'FEMALE' ? 'Perempuan' : (profile.gender || '-')}
                              </p>
                           </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-white/60 text-sm sm:text-base">Gagal memuat data profil.</p>
                    )}
                  </div>
                </div>
              )}

              {/* CONTENT: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 md:mb-10">Daftar Dokumen</h2>

                  <div className="space-y-6 sm:space-y-8 md:space-y-10">
                     {/* Section 1: Alur Pelatihan */}
                     <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 sm:gap-3 border-b border-white/20 pb-2">
                           <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
                           <h3 className="text-lg sm:text-xl font-bold">Riwayat Alur Pelatihan</h3>
                        </div>
                        
                        {documents.some(d => ['LOA', 'ARTICLE', 'PAYMENT'].includes(d.type)) ? (
                           <div className="grid grid-cols-1 gap-2 sm:gap-3">
                             {documents
                                .filter(d => ['LOA', 'ARTICLE', 'PAYMENT'].includes(d.type))
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((doc, idx) => (
                               <div key={idx} className="p-3 sm:p-4 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-white/15 transition-all group">
                                 <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/50 mb-0.5">
                                       {doc.type === 'LOA' ? 'Letter of Acceptance' : doc.type === 'ARTICLE' ? 'Draft Artikel' : 'Bukti Pembayaran'}
                                    </span>
                                    <span className="font-medium text-xs sm:text-sm md:text-base truncate" title={doc.originalName}>
                                       {doc.originalName}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] text-white/40 mt-1">
                                       Diunggah pada {new Date(doc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                 </div>
                                 <div className="flex gap-2 shrink-0">
                                    <button 
                                       onClick={() => viewFile(`/attachments/${doc.id}/download`)}
                                       className="text-[9px] sm:text-[10px] md:text-xs bg-white/10 hover:bg-white/20 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold border border-white/20 transition-colors flex items-center gap-1"
                                    >
                                       <Eye className="w-3 h-3" /> Preview
                                    </button>
                                    <button 
                                       onClick={() => {
                                          const name = profile?.fullName || 'Peserta';
                                          const safeName = name.replace(/\s+/g, '_');
                                          const ext = doc.originalName.split('.').pop();
                                          let customName = doc.originalName;
                                          
                                          if (doc.type === 'LOA') customName = `LOA_JUKI_${safeName}.pdf`;
                                          else if (doc.type === 'ARTICLE') customName = `Artikel_JUKI_${safeName}.${ext}`;
                                          else if (doc.type === 'PAYMENT') customName = `Bukti_Bayar_JUKI_${safeName}.${ext}`;
                                          
                                          downloadFile(`/attachments/${doc.id}/download`, customName);
                                       }}
                                       className="text-[9px] sm:text-[10px] md:text-xs bg-white text-[#949F93] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold shadow-md hover:bg-opacity-90 transition-all flex items-center gap-1"
                                    >
                                       <Download className="w-3 h-3" /> Download
                                    </button>
                                 </div>
                               </div>
                             ))}
                           </div>
                        ) : (
                          <p className="text-white/50 text-xs sm:text-sm italic py-4">Belum ada riwayat dokumen pelatihan.</p>
                        )}
                     </div>

                     {/* Section 2: Administrasi & Persyaratan */}
                     <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 sm:gap-3 border-b border-white/20 pb-2">
                           <User className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
                           <h3 className="text-lg sm:text-xl font-bold">Dokumen Administrasi</h3>
                        </div>

                        {documents.some(d => ['KTM', 'BEBAS_TANGGUNGAN'].includes(d.type)) ? (
                            <div className="grid grid-cols-1 gap-2 sm:gap-3">
                             {documents
                                .filter(d => ['KTM', 'BEBAS_TANGGUNGAN'].includes(d.type))
                                .map((doc, idx) => (
                               <div key={idx} className="p-3 sm:p-4 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-white/15 transition-all">
                                 <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/50 mb-0.5">
                                       {doc.type === 'KTM' ? 'Kartu Tanda Mahasiswa' : 'Surat Bebas Tanggungan'}
                                    </span>
                                    <span className="font-medium text-xs sm:text-sm md:text-base truncate">
                                       {doc.originalName}
                                    </span>
                                 </div>
                                 <div className="flex gap-2 shrink-0">
                                    <button 
                                       onClick={() => viewFile(`/attachments/${doc.id}/download`)}
                                       className="text-[9px] sm:text-xs bg-white/10 hover:bg-white/20 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold border border-white/20 transition-colors"
                                    >
                                       Lihat
                                    </button>
                                    <button 
                                       onClick={() => {
                                          const name = profile?.fullName || 'Peserta';
                                          const safeName = name.replace(/\s+/g, '_');
                                          const ext = doc.originalName.split('.').pop();
                                          let customName = doc.originalName;
                                          
                                          if (doc.type === 'KTM') customName = `KTM_JUKI_${safeName}.${ext}`;
                                          else if (doc.type === 'BEBAS_TANGGUNGAN') customName = `Bebas_Tanggungan_JUKI_${safeName}.${ext}`;
                                          
                                          downloadFile(`/attachments/${doc.id}/download`, customName);
                                       }}
                                       className="text-[9px] sm:text-xs bg-white text-[#949F93] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold shadow-md"
                                    >
                                       Download
                                    </button>
                                 </div>
                               </div>
                             ))}
                           </div>
                        ) : (
                           <p className="text-white/50 text-xs sm:text-sm italic py-4">Dokumen administrasi belum tersedia.</p>
                        )}
                     </div>
                  </div>
                </div>
              )}

              {/* CONTENT: CHANGE PASSWORD */}
              {activeTab === 'password' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 md:mb-10">Ganti Password</h2>
                  
                  <div className="max-w-xl space-y-4 sm:space-y-6">
                    {/* Info Box */}
                    <div className="bg-blue-500/20 border border-blue-400/40 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-blue-100">
                      <p className="font-medium mb-1">⚠️ Perhatian:</p>
                      <p>Setelah password berhasil diubah, Anda akan otomatis logout dan harus login kembali dengan password baru. Semua sesi login Anda akan dihapus.</p>
                    </div>

                    {/* Old Password */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-bold text-white ml-1">Password Lama</label>
                      <div className="relative">
                        <input 
                          type={showOldPassword ? "text" : "password"}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="w-full p-3 sm:p-4 pr-10 sm:pr-12 bg-white border-none rounded-xl focus:ring-2 focus:ring-white/50 outline-none text-gray-800 text-sm sm:text-base font-medium placeholder:text-gray-400 transition-all"
                          placeholder="Masukkan password lama"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showOldPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                      {oldPassword && oldPassword.length < 6 && (
                        <p className="text-xs text-red-300 ml-1">Password minimal 6 karakter</p>
                      )}
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-bold text-white ml-1">Password Baru</label>
                      <div className="relative">
                        <input 
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full p-3 sm:p-4 pr-10 sm:pr-12 bg-white border-none rounded-xl focus:ring-2 focus:ring-white/50 outline-none text-gray-800 text-sm sm:text-base font-medium placeholder:text-gray-400 transition-all"
                          placeholder="Masukkan password baru (min. 6 karakter)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                      {newPassword && newPassword.length < 6 && (
                        <p className="text-xs text-red-300 ml-1">Password minimal 6 karakter</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button 
                      onClick={handleChangePassword}
                      disabled={changePasswordLoading || !oldPassword || !newPassword || oldPassword.length < 6 || newPassword.length < 6}
                      className="w-full bg-white text-[#949F93] hover:bg-white/90 font-bold text-base sm:text-lg py-5 sm:py-7 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {changePasswordLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          Memproses...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                          Ubah Password
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* CONTENT: FEEDBACK */}
              {activeTab === 'feedback' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 sm:space-y-6">
                  {/* Kotak Input Feedback */}
                  <div className="border-2 border-white rounded-2xl sm:rounded-[24px] p-4 sm:p-6 md:p-8">
                    <h2 className="text-xl sm:text-2xl font-bold mb-1">Feedback</h2>
                    <p className="text-xs sm:text-sm mb-4 sm:mb-6 text-white/80">Punya saran atau pengalaman seru bareng Jupalo? Ceritain ke kami ya!</p>

                    <div className="space-y-4">
                      <div className="relative group">
                        <textarea 
                          className="w-full h-32 sm:h-40 md:h-48 rounded-2xl sm:rounded-[20px] p-4 sm:p-6 pr-4 sm:pr-6 pb-12 sm:pb-16 bg-[#D4C4AF] border border-[#C0C0C0] text-[#4A5548] text-sm sm:text-base font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-white/80 focus:border-transparent resize-none placeholder:text-[#8C968A] transition-all duration-300"
                          placeholder="Ceritakan pengalamanmu atau berikan saran untuk Jupalo..."
                          value={newFeedback}
                          onChange={(e) => setNewFeedback(e.target.value)}
                        ></textarea>
                        
                        <div className="absolute bottom-3 sm:bottom-5 right-3 sm:right-5">
                           <button 
                            onClick={handleCreateFeedback}
                            disabled={!newFeedback.trim()}
                            className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-[#949F93] text-xs sm:text-sm font-bold tracking-wide rounded-full shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                           >
                             <span>Kirim</span>
                             <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kotak Feedback Terkirim */}
                  <div className="border-2 border-white rounded-2xl sm:rounded-[24px] p-4 sm:p-6 md:p-8">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">Feedback Terkirim</h3>
                    <div className="space-y-3 sm:space-y-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                      {feedbacks.length > 0 ? feedbacks.map((item: any, idx) => (
                        <div key={idx} className="p-3 sm:p-4 bg-white/19 border border-white rounded-xl sm:rounded-[12px] shadow-sm transition hover:bg-white/25">
                          <p className="text-white text-sm sm:text-base mb-2 break-words">{item.message}</p>
                          <p className="text-white/70 text-[9px] sm:text-[10px] font-medium">
                            {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )) : (
                        <p className="text-white/60 italic text-sm">Belum ada feedback yang dikirim.</p>
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
        <DialogContent className="max-w-[90vw] sm:max-w-md p-6 sm:p-8 rounded-2xl mx-4">
           <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#D15651] flex items-center justify-center text-[#D15651]">
                 <LogOut className="w-5 h-5 sm:w-6 sm:h-6 ml-1" />
              </div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-gray-800">
                Apakah anda yakin ingin keluar?
              </DialogTitle>
              
              <div className="flex gap-3 sm:gap-4 w-full mt-4 sm:mt-6">
                 <Button 
                   onClick={handleLogout}
                   className="flex-1 bg-[#D15651] hover:bg-[#b54641] text-white py-5 sm:py-6 rounded-xl text-sm sm:text-base"
                 >
                   Keluar
                 </Button>
                 <Button 
                   variant="outline"
                   onClick={() => setShowLogoutConfirm(false)}
                   className="flex-1 border-gray-300 text-gray-600 py-5 sm:py-6 rounded-xl hover:bg-gray-50 text-sm sm:text-base"
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
