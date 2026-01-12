'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  FileText, 
  CheckCircle, 
  Award, 
  MessageSquare, 
  LogOut,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  FileIcon,
  Download,
  Eye
} from 'lucide-react'
import { api, getErrorMessage, downloadFile, viewFile } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAlert } from '@/components/ui/alert-provider'
import JadwalPelatihanView from '@/components/admin/JadwalPelatihanView'
import VerifikasiView from '@/components/admin/VerifikasiView'
import LoaView from '@/components/admin/LoaView'
import ArtikelProsesView from '@/components/admin/ArtikelProsesView'

// --- Types ---
interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  profile?: {
    fullName: string;
    nim: string;
    phone: string;
    birthPlace?: string;
    birthDate?: string;
    gender?: string;
  };
  trainingFlow?: {
    statusCode: string;
    articleTitle?: string;
    journalCode?: string;
    ojsAccount?: {
      username?: string;
      password?: string;
      journalLink?: string;
    }
  };
  attachments?: {
    id: string;
    type: string;
    originalName: string;
    filePath: string;
  }[];
}

// --- Helper: Status Badge ---
const getStatusBadge = (status: string, customLabel?: string) => {
  const styles: Record<string, string> = {
    'PAYMENT_REQUIRED': 'bg-[#FFB800] text-white',
    'PAYMENT_WAITING': 'bg-[#97A094] text-white',
    'PAYMENT_VERIFIED': 'bg-[#97A094] text-white',
    'ARTICLE_WAITING': 'bg-[#D15651] text-white',
    'ARTICLE_VERIFIED': 'bg-[#97A094] text-white',
    'TRAINING_WAITING': 'bg-[#97A094] text-white',
    'TRAINING_VERIFIED': 'bg-[#97A094] text-white',
    'REVIEW_VERIFIED': 'bg-[#97A094] text-white',
    'LOA_PUBLISHED': 'bg-[#37C618] text-white',
  }
  
  const labels: Record<string, string> = {
    'PAYMENT_REQUIRED': 'Belum Bayar Pelatihan',
    'PAYMENT_WAITING': 'Sudah Bayar Pelatihan',
    'PAYMENT_VERIFIED': 'Pembayaran Terverifikasi',
    'ARTICLE_WAITING': 'Belum submit artikel di OJS',
    'ARTICLE_VERIFIED': 'Sudah submit artikel di OJS',
    'TRAINING_WAITING': 'Sudah Daftar Pelatihan',
    'TRAINING_VERIFIED': 'Sudah mengikuti pelatihan',
    'REVIEW_VERIFIED': 'Sudah review artikel di OJS',
    'LOA_PUBLISHED': 'Sudah terbit LOA',
  }

  const statusCode = status || 'PAYMENT_REQUIRED';
  const label = customLabel || labels[statusCode] || statusCode.replace(/_/g, ' ');
  
  return (
    <span className={`inline-block w-[180px] py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider whitespace-nowrap text-center ${styles[statusCode] || 'bg-gray-300 text-gray-700'}`}>
      {label}
    </span>
  )
}

// Helper Decode JWT
const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function AdminPage() {
  const { showAlert } = useAlert()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  // --- State Manajemen Peserta ---
  const [users, setUsers] = useState<User[]>([])
  const [userMeta, setUserMeta] = useState({ page: 1, limit: 10, total: 0, totalPage: 1 })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // Default: Semua Status
  const [selectedUser, setSelectedUser] = useState<any>(null) // Detail User
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [userStats, setUserStats] = useState<any>(null)

  // Cek Role Admin via JWT
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/');
      return;
    }

    const payload = decodeToken(token);
    
    if (!payload || !payload.roles) {
      showAlert({ title: 'Sesi Tidak Valid', message: 'Sesi Anda tidak valid, silakan login kembali.', type: 'warning' });
      localStorage.clear();
      router.push('/');
      return;
    }

    const roles = payload.roles as string[];
    const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');

    if (!isAdmin) {
      showAlert({ title: 'Akses Ditolak', message: 'Anda tidak memiliki akses ke halaman ini!', type: 'error' });
      router.push('/beranda');
    } else {
      const displayRole = roles.includes('SUPER_ADMIN') ? 'SUPER ADMIN' : 'ADMIN';
      setUserRole(displayRole);
      setUserEmail(payload.email || '');
      setLoading(false);
    }
  }, [router])

  // --- Fetch User Stats ---
  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/users/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserStats(res.data);
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
    }
  };

  // --- Fetch Users (Server-Side) ---
  const fetchUsers = async () => {
    try {
      setLoading(activeTab === 'users' ? false : true); // Hanya show global loading di awal
      
      const params: any = {
        page: userMeta.page,
        limit: userMeta.limit,
      };

      if (searchQuery.trim()) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;

      const token = localStorage.getItem('token');
      
      // Fetch Users and Stats in Parallel
      const [resUsers, resStats] = await Promise.all([
        api.get('/users', { 
          params,
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/users/stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      // Update Stats
      setUserStats(resStats.data);

      // Process Users Data
      const data = resUsers.data.data || resUsers.data;
      let meta = resUsers.data.meta;

      // Fallback if meta is missing
      if (!meta) {
         // Use stats.roles.user as total ONLY if no filters are applied
         const isFiltering = searchQuery.trim() || statusFilter;
         const statsTotal = resStats.data?.roles?.user || 0;
         const effectiveTotal = isFiltering ? data.length : statsTotal;

         meta = { 
            page: userMeta.page, 
            limit: userMeta.limit, 
            total: effectiveTotal, 
            totalPage: Math.ceil(effectiveTotal / userMeta.limit) || 1
         };
      }
      
      setUsers(Array.isArray(data) ? data : []);
      setUserMeta(meta);
      
    } catch (err: any) {
      console.error('Gagal ambil data user:', err);
      if (err.response?.status === 401) {
         // Handled globally but keeping consistent wording if triggered
         showAlert({
            title: 'Sesi Berakhir',
            message: 'Ups, sesi kamu telah berakhir! 😅\n\nDemi keamanan akun, silakan login kembali untuk melanjutkan aktivitas ya.',
            type: 'warning',
            onConfirm: () => handleLogout()
         });
      }
    } finally {
      setLoading(false);
    }
  }

  // Trigger fetch saat tab aktif, page berubah, atau filter berubah
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, userMeta.page, statusFilter]);

  // Handle Search (dengan Enter agar tidak spam API)
  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setUserMeta(prev => ({ ...prev, page: 1 }));
      fetchUsers();
    }
  };

  // --- Detail User ---
  const handleViewDetail = async (userId: string) => {
    try {
      const res = await api.get(`/users/${userId}`)
      setSelectedUser(res.data.data || res.data)
      setIsDetailOpen(true)
    } catch (err) {
      console.error('Gagal ambil detail:', err)
      showAlert({ title: 'Gagal', message: getErrorMessage(err), type: 'error' })
    }
  }

  // --- Edit User ---
  const handleOpenEdit = () => {
    if (!selectedUser) return
    setEditForm({
      fullName: selectedUser.profile?.fullName,
      nim: selectedUser.profile?.nim,
      email: selectedUser.email,
      phone: selectedUser.profile?.phone,
      articleTitle: selectedUser.trainingFlow?.articleTitle,
      ojsUsername: selectedUser.trainingFlow?.ojsAccount?.username,
      ojsPassword: selectedUser.trainingFlow?.ojsAccount?.password,
      journalCode: selectedUser.trainingFlow?.journalCode,
      journalLink: selectedUser.trainingFlow?.ojsAccount?.journalLink,
    })
    setIsEditOpen(true)
  }

  const handleUpdateUser = async () => {
    try {
      await api.patch(`/users/${selectedUser.id}`, editForm)
      showAlert({ title: 'Berhasil', message: 'Data berhasil diupdate!', type: 'success' })
      setIsEditOpen(false)
      handleViewDetail(selectedUser.id) // Refresh detail
      fetchUsers() // Refresh list
    } catch (err) {
      console.error('Update gagal:', err)
      showAlert({ title: 'Gagal', message: getErrorMessage(err), type: 'error' })
    }
  }

  // Handle Logout
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.clear()
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#949F93] flex items-center justify-center text-white">
        Memuat Dashboard Admin...
      </div>
    )
  }

  // --- Render Content Berdasarkan Tab ---
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 border border-white/30 p-6 rounded-2xl">
                <h3 className="text-lg font-medium text-white/80">Total Peserta</h3>
                <p className="text-4xl font-bold mt-2">1,240</p>
              </div>
              <div className="bg-white/10 border border-white/30 p-6 rounded-2xl">
                <h3 className="text-lg font-medium text-white/80">Menunggu Verifikasi</h3>
                <p className="text-4xl font-bold mt-2 text-yellow-300">45</p>
              </div>
              <div className="bg-white/10 border border-white/30 p-6 rounded-2xl">
                <h3 className="text-lg font-medium text-white/80">LOA Terbit</h3>
                <p className="text-4xl font-bold mt-2 text-green-300">890</p>
              </div>
            </div>
          </div>
        )
      case 'users':
        return (
          <div>
            <div className="flex flex-col gap-1 mb-6">
               <h2 className="text-3xl font-bold text-[#5C7B78]">Management Peserta</h2>
               <p className="text-[#5C7B78]/80 font-medium text-lg">Total : {userStats?.roles?.user ?? 0} Peserta</p>
            </div>
            
            <div className="bg-white rounded-[24px] p-6 min-h-[600px] shadow-sm">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Cari peserta" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1, searchQuery)}
                    className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5C7B78]/20" 
                  />
                </div>
                <div className="w-full max-w-[250px]">
                   <select 
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setUserMeta(prev => ({...prev, page: 1})); // Reset ke hal 1 saat filter berubah
                    }}
                    className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 text-gray-700 font-medium focus:outline-none cursor-pointer text-sm"
                   >
                      <option value="">Semua Status</option>
                      <option value="PAYMENT_REQUIRED">Belum Bayar Pelatihan</option>
                      <option value="PAYMENT_WAITING">Sudah Bayar Pelatihan</option>
                      <option value="ARTICLE_WAITING">Belum submit artikel di OJS</option>
                      <option value="ARTICLE_VERIFIED">Sudah submit artikel di OJS</option>
                      <option value="TRAINING_WAITING">Sudah Daftar Pelatihan</option>
                      <option value="TRAINING_VERIFIED">Sudah mengikuti pelatihan</option>
                      <option value="REVIEW_VERIFIED">Sudah review artikel di OJS</option>
                      <option value="LOA_PUBLISHED">Sudah terbit LOA</option>
                   </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="text-[#5C7B78] text-left border-b border-gray-100">
                      <th className="pb-4 font-bold pl-4">Nama</th>
                      <th className="pb-4 font-bold">NIM</th>
                      <th className="pb-4 font-bold">Email</th>
                      <th className="pb-4 font-bold">WhatsApp</th>
                      <th className="pb-4 font-bold text-center">Status</th>
                      <th className="pb-4 font-bold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm">
                    {users.map((user, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none">
                        <td className="py-4 pl-4 font-medium text-gray-900">{user.profile?.fullName || '-'}</td>
                        <td className="py-4">{user.profile?.nim || '-'}</td>
                        <td className="py-4">{user.email}</td>
                        <td className="py-4">{user.profile?.phone || '-'}</td>
                        <td className="py-4 text-center">
                           {getStatusBadge(user.trainingFlow?.statusCode || '', user.trainingFlow?.status?.label)}
                        </td>
                        <td className="py-4 text-center">
                          <button 
                            onClick={() => handleViewDetail(user.id)}
                            className="bg-[#5C7B78] hover:bg-[#4a6361] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                       <tr>
                         <td colSpan={6} className="text-center py-10 text-gray-400">Data tidak ditemukan</td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100 text-sm text-gray-600">
                 <div>
                    Menampilkan <span className="font-bold">{users.length > 0 ? (userMeta.page - 1) * userMeta.limit + 1 : 0}-{Math.min(userMeta.page * userMeta.limit, userMeta.total)}</span> dari <span className="font-bold">{userMeta.total}</span> Peserta
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setUserMeta({...userMeta, page: Math.max(1, userMeta.page - 1)})}
                      disabled={userMeta.page === 1}
                      className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                       <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold px-2">Halaman {userMeta.page} dari {userMeta.totalPage}</span>
                    <button 
                      onClick={() => setUserMeta({...userMeta, page: Math.min(userMeta.totalPage, userMeta.page + 1)})}
                      disabled={userMeta.page === userMeta.totalPage}
                      className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                       <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            </div>
          </div>
        )
      case 'trainings':
        return <JadwalPelatihanView />
      case 'articles':
        return <ArtikelProsesView />
      case 'verification':
        return <VerifikasiView />
      case 'loa':
        return <LoaView />
      // ... tab lain tetap sama (placeholder)
      default:
        return (
          <div className="flex items-center justify-center h-full text-white/50">
             Fitur ini belum diimplementasikan.
          </div>
        )
    }
  }

  // Helper untuk Button Menu
  const MenuButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full text-left px-6 py-3 rounded-r-full transition-all duration-300 font-medium flex items-center gap-3 ${
        activeTab === id
          ? 'bg-white text-[#949F93] shadow-lg translate-x-2' 
          : 'text-white hover:bg-white/10'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-[#949F93] text-white font-sans selection:bg-white/30">
      
      {/* Header Admin */}
      <header className="px-6 md:px-12 py-6 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
           {/* Placeholder Avatar User */}
           <div className="w-12 h-12 relative rounded-full overflow-hidden border-2 border-white/50 bg-[#D4C4AF]">
              <Image src="/account-pic.jpg" alt="Admin" fill className="object-cover" />
           </div>
           <div>
             <div className="text-xl font-bold tracking-wide">Admin Jupalo</div>
           </div>
        </div>
      </header>

      <main className="px-6 md:px-12 pb-12 flex flex-col md:flex-row gap-8 md:gap-12 mt-8">
        
        {/* Sidebar Menu */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col min-h-[600px]">
          <nav className="space-y-2">
            <MenuButton id="dashboard" label="Dashboard" icon={LayoutDashboard} />
            <MenuButton id="users" label="Manajemen Peserta" icon={Users} />
            <MenuButton id="trainings" label="Jadwal Pelatihan" icon={CalendarDays} />
            <MenuButton id="articles" label="Artikel Proses" icon={FileText} />
            <MenuButton id="verification" label="Verifikasi" icon={CheckCircle} />
            <MenuButton id="loa" label="LOA" icon={Award} />
            <MenuButton id="feedback" label="Feedback" icon={MessageSquare} />
          </nav>

          {/* Logout */}
          <div className="mt-auto pt-8 border-t border-white/10">
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-3 px-6 py-3 border border-white/50 rounded-xl hover:bg-white hover:text-[#949F93] transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 relative">
           {/* Untuk Tab Users dan Trainings backgroundnya transparant agar menyatu dengan design inner components */}
           {['users', 'trainings'].includes(activeTab) ? renderContent() : (
             <div className="border-2 border-white rounded-[32px] min-h-[600px] p-8 md:p-10 relative bg-white/5 backdrop-blur-sm">
                {renderContent()}
             </div>
           )}
        </section>

      </main>

      {/* --- MODAL DETAIL USER (Fullscreen) --- */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent 
          className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !m-0 !border-none !rounded-none !bg-[#D4D4D4] !overflow-hidden !z-50 !translate-x-0 !translate-y-0"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Data Peserta</DialogTitle>
          
          {/* Full screen overlay scrollable */}
          <div className="absolute inset-0 w-full h-full overflow-y-auto">
            <div className="min-h-full flex flex-col items-center p-4 sm:p-6 md:p-10">
              
              {/* Header */}
              <div className="w-full max-w-7xl flex justify-between items-start mb-8 mt-4 px-4 sm:px-6 md:px-10">
                <span className="font-bold text-3xl sm:text-4xl md:text-5xl text-[#5C7B78] tracking-tight">Data Peserta</span>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="text-[#5C7B78] hover:text-[#D15651] transition-colors p-1"
                >
                  <X className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 stroke-[2.5]" />
                </button>
              </div>

              {selectedUser && (
                <div className="w-full max-w-6xl space-y-6 pb-12 animate-in fade-in zoom-in-95 duration-300">
                  {/* Card 1: Informasi Pribadi */}
                  <div className="bg-white rounded-2xl p-8 shadow-sm text-gray-700">
                     <h3 className="text-xl font-bold text-[#5C7B78] mb-6 border-b pb-4">Informasi Pribadi</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                        <div>
                           <p className="text-sm text-gray-500 mb-1">Nama Lengkap</p>
                           <p className="text-lg font-bold text-[#5C7B78]">{selectedUser.profile?.fullName || '-'}</p>
                        </div>
                        <div>
                           <p className="text-sm text-gray-500 mb-1">WhatsApp</p>
                           <p className="text-lg font-bold text-[#5C7B78]">{selectedUser.profile?.phone || '-'}</p>
                        </div>
                        <div>
                           <p className="text-sm text-gray-500 mb-1">NIM</p>
                           <p className="text-lg font-bold text-[#5C7B78]">{selectedUser.profile?.nim || '-'}</p>
                        </div>
                        <div>
                           <p className="text-sm text-gray-500 mb-1">Judul Artikel</p>
                           <p className="text-lg font-bold text-[#5C7B78]">{selectedUser.trainingFlow?.articleTitle || '-'}</p>
                        </div>
                        <div>
                           <p className="text-sm text-gray-500 mb-1">Email</p>
                           <p className="text-lg font-bold text-[#5C7B78]">{selectedUser.email}</p>
                        </div>
                        <div>
                           <p className="text-sm text-gray-500 mb-1">Status</p>
                           {getStatusBadge(selectedUser.trainingFlow?.statusCode, selectedUser.trainingFlow?.status?.label)}
                        </div>
                     </div>
                  </div>

                  {/* Card 2: Data Akun OJS */}
                  <div className="bg-white rounded-2xl p-8 shadow-sm text-gray-700">
                     <h3 className="text-xl font-bold text-[#5C7B78] mb-6 border-b pb-4">Data Akun OJS</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                        <div>
                           <p className="text-sm text-gray-500 mb-1">Username</p>
                           <p className="text-lg font-bold text-[#5C7B78]">{selectedUser.trainingFlow?.ojsAccount?.username || '-'}</p>
                        </div>
                        <div>
                           <p className="text-sm text-gray-500 mb-1">Kelompok Jurnal</p>
                           <p className="text-lg font-bold text-[#5C7B78]">{selectedUser.trainingFlow?.journalCode || '-'}</p>
                        </div>
                        <div>
                           <p className="text-sm text-gray-500 mb-1">Password</p>
                           <p className="text-lg font-bold text-[#5C7B78]">{selectedUser.trainingFlow?.ojsAccount?.password || '-'}</p>
                        </div>
                        <div>
                           <p className="text-sm text-gray-500 mb-1">Link Jurnal</p>
                           <p className="text-lg font-bold text-[#5C7B78] truncate">{selectedUser.trainingFlow?.ojsAccount?.journalLink || '-'}</p>
                        </div>
                     </div>
                  </div>

                  {/* Card 3: Dokumen */}
                  <div className="bg-white rounded-2xl p-8 shadow-sm text-gray-700">
                     <h3 className="text-xl font-bold text-[#5C7B78] mb-6 border-b pb-4">Dokumen</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedUser.attachments && selectedUser.attachments.length > 0 ? (
                           selectedUser.attachments.map((doc: any, idx: number) => (
                              <div key={idx} className="border border-dashed border-gray-400 rounded-lg p-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition">
                                 <div className="flex items-center gap-3 overflow-hidden">
                                    <FileIcon className="text-[#5C7B78] shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                       <span className="font-medium text-sm truncate max-w-[150px] md:max-w-[200px]" title={doc.originalName}>
                                          {doc.originalName}
                                       </span>
                                       <span className="text-xs text-gray-500 font-semibold">{doc.type.replace(/_/g, ' ')}</span>
                                    </div>
                                 </div>
                                 <button 
                                    onClick={async () => {
                                        try {
                                            await viewFile(`/attachments/admin/${doc.id}/download`);
                                        } catch (err) {
                                            showAlert({ title: 'Gagal', message: 'Gagal melihat dokumen', type: 'error' });
                                        }
                                    }}
                                    className="bg-[#5C7B78] hover:bg-[#4a6361] text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors ml-2 flex items-center gap-1"
                                 >
                                    <Eye className="w-3 h-3" /> Lihat
                                 </button>
                              </div>
                           ))
                        ) : (
                           <p className="text-gray-400 italic col-span-2 text-center py-4">Belum ada dokumen yang diunggah.</p>
                        )}
                     </div>
                  </div>

                  {/* Tombol Edit */}
                  <div className="flex justify-center pt-8">
                     <button 
                        onClick={handleOpenEdit}
                        className="bg-[#5C7B78] hover:bg-[#4a6361] text-white text-xl font-bold py-4 px-20 rounded-xl shadow-lg transition-transform hover:scale-105"
                     >
                        Edit Data
                     </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL EDIT USER (Stacked) --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-5xl bg-white rounded-3xl p-0 border-none overflow-hidden">
           <div className="p-8">
              <DialogTitle className="text-2xl font-bold text-[#5C7B78] text-center mb-6">Edit Data Peserta</DialogTitle>
              
              <div className="space-y-4">
                 {/* Section Info Pribadi */}
                 <div>
                    <h3 className="text-base font-bold text-[#5C7B78] mb-3">Informasi Pribadi</h3>
                    <div className="space-y-3">
                       <div>
                          <label className="text-gray-500 text-xs mb-1 block font-medium">Nama Lengkap</label>
                          <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#5C7B78] outline-none"
                            value={editForm.fullName || ''}
                            onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                          />
                       </div>
                       <div>
                          <label className="text-gray-500 text-xs mb-1 block font-medium">NIM</label>
                          <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800"
                            value={editForm.nim || ''}
                            onChange={(e) => setEditForm({...editForm, nim: e.target.value})}
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-gray-500 text-xs mb-1 block font-medium">Email</label>
                             <input 
                               type="email" 
                               className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800"
                               value={editForm.email || ''}
                               onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                             />
                          </div>
                          <div>
                             <label className="text-gray-500 text-xs mb-1 block font-medium">WhatsApp</label>
                             <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#5C7B78]">
                                <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-500 font-medium border-r border-gray-300">+62</span>
                                <input 
                                  type="text" 
                                  className="w-full p-2.5 text-sm text-gray-800 outline-none"
                                  value={editForm.phone ? editForm.phone.replace(/^62|^0/, '') : ''}
                                  onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, "")
                                    if (value.startsWith("0")) {
                                      value = value.slice(1)
                                    }
                                    setEditForm({...editForm, phone: `62${value}`})
                                  }}
                                />
                             </div>
                          </div>
                       </div>
                       <div>
                          <label className="text-gray-500 text-xs mb-1 block font-medium">Judul Artikel</label>
                          <textarea 
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 h-16 resize-none"
                            value={editForm.articleTitle || ''}
                            onChange={(e) => setEditForm({...editForm, articleTitle: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 {/* Reset Password Button */}
                 <div className="flex justify-end">
                    <button className="bg-[#5C7B78] text-white px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 shadow-md">
                       Reset Password
                    </button>
                 </div>

                 {/* Section Data Akun OJS - Hanya muncul jika ada data */}
                 {(selectedUser?.trainingFlow?.ojsAccount || editForm.ojsUsername) && (
                   <div className="pt-3 border-t border-gray-100">
                      <h3 className="text-base font-bold text-[#5C7B78] mb-3">Data Akun OJS</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                         <div>
                            <label className="text-gray-500 text-xs mb-1 block font-medium">Username</label>
                            <input 
                              type="text" 
                              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800"
                              value={editForm.ojsUsername || ''}
                              onChange={(e) => setEditForm({...editForm, ojsUsername: e.target.value})}
                            />
                         </div>
                         <div>
                            <label className="text-gray-500 text-xs mb-1 block font-medium">Password</label>
                            <input 
                              type="text" 
                              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800"
                              value={editForm.ojsPassword || ''}
                              onChange={(e) => setEditForm({...editForm, ojsPassword: e.target.value})}
                            />
                         </div>
                         <div>
                            <label className="text-gray-500 text-xs mb-1 block font-medium">Kelompok Jurnal</label>
                            <select 
                              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 appearance-none bg-white"
                              value={editForm.journalCode || ''}
                              onChange={(e) => setEditForm({...editForm, journalCode: e.target.value})}
                            >
                               <option value="">Pilih Kelompok</option>
                               <option value="JIE">JIE</option>
                               <option value="JUKIS">JUKIS</option>
                            </select>
                         </div>
                         <div>
                            <label className="text-gray-500 text-xs mb-1 block font-medium">Link Jurnal</label>
                            <textarea 
                              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 h-16 resize-none"
                              value={editForm.journalLink || ''}
                              onChange={(e) => setEditForm({...editForm, journalLink: e.target.value})}
                            />
                         </div>
                      </div>
                   </div>
                 )}

                 {/* Actions */}
                 <div className="grid grid-cols-2 gap-4 mt-4">
                    <button 
                       onClick={() => setIsEditOpen(false)}
                       className="border-2 border-[#D15651] text-[#D15651] py-2.5 rounded-xl text-sm font-bold hover:bg-[#D15651] hover:text-white transition shadow-sm"
                    >
                       Batal
                    </button>
                    <button 
                       onClick={handleUpdateUser}
                       className="bg-[#5C7B78] text-white py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-lg"
                    >
                       Update
                    </button>
                 </div>
              </div>
           </div>
        </DialogContent>
      </Dialog>
      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="max-w-md p-8 rounded-2xl">
           <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#D15651] flex items-center justify-center text-[#D15651]">
                 <LogOut className="w-6 h-6 ml-1" />
              </div>
              <DialogTitle className="text-xl font-bold text-gray-800">
                Keluar dari Admin Panel?
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