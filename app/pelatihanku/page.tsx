'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  CheckCircle2, 
  Circle, 
  Upload, 
  FileText, 
  CalendarDays, 
  Clock, 
  AlertCircle, 
  Download,
  Loader2,
  ChevronRight,
  ChevronLeft,
  X,
  User
} from 'lucide-react'
import { api } from '@/lib/api'
import NavbarPeserta from '@/components/dashboard/NavbarPeserta'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAlert } from '@/components/ui/alert-provider'

// --- Tipe Data ---
type UserStatus = 
  | 'PAYMENT_REQUIRED' | 'PAYMENT_WAITING' | 'PAYMENT_VERIFIED'
  | 'ADMINISTRATIVE_REQUIRED' | 'WAITING_ADMINISTRATIVE'
  | 'ARTICLE_WAITING' | 'ARTICLE_VERIFIED'
  | 'TRAINING_WAITING'
  | 'REVIEW_WAITING' | 'REVIEW_REVISION'
  | 'LOA_PUBLISHED';

interface Training {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location: string;
  quota: number;
  participantsCount: number;
}

// --- Helper Mapping Status ke Step ---
const getStepNumber = (status: UserStatus | string): number => {
  switch (status) {
    case 'PAYMENT_REQUIRED':
    case 'PAYMENT_WAITING':
    case 'PAYMENT_VERIFIED':
      return 1;
    case 'ADMINISTRATIVE_REQUIRED':
    case 'WAITING_ADMINISTRATIVE':
      return 2;
    case 'ARTICLE_WAITING':
      return 3;
    case 'ARTICLE_VERIFIED': // Siap pilih jadwal
    case 'TRAINING_WAITING': // Sudah pilih jadwal
      return 4;
    case 'REVIEW_WAITING':
    case 'REVIEW_REVISION':
      return 5;
    case 'LOA_PUBLISHED':
      return 6;
    default:
      return 1;
  }
}

const steps = [
  { id: 1, label: 'Bayar Pelatihan' },
  { id: 2, label: 'Daftar Pelatihan' },
  { id: 3, label: 'Submit Artikel' },
  { id: 4, label: 'Ikut Pelatihan' },
  { id: 5, label: 'Review Artikel' },
  { id: 6, label: 'Penerbitan LOA' },
]

// --- Helper Logo Bank ---
const getBankLogo = (bankName: string) => {
  const name = bankName?.toLowerCase() || '';
  if (name.includes('bni')) return 'https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg';
  if (name.includes('bri')) return 'https://upload.wikimedia.org/wikipedia/commons/6/68/BANK_BRI_logo.svg';
  if (name.includes('mandiri')) return 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg';
  if (name.includes('bca')) return 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg';
  if (name.includes('bsi')) return 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg';
  return null;
}

export default function PelatihankuPage() {
  const { showAlert } = useAlert()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [status, setStatus] = useState<UserStatus>('PAYMENT_REQUIRED')
  const [currentStep, setCurrentStep] = useState(1)
  
  // State untuk Action Form
  const [filePayment, setFilePayment] = useState<File | null>(null)
  const [articleTitle, setArticleTitle] = useState('')
  const [trainings, setTrainings] = useState<Training[]>([])
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [modalAction, setModalAction] = useState<() => void>(() => {})
  const [modalMessage, setModalMessage] = useState('')

  const [paymentSettings, setPaymentSettings] = useState<any>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const [allTrainings, setAllTrainings] = useState<Training[]>([])
  const [trainingMeta, setTrainingMeta] = useState({ page: 1, limit: 3, total: 0, totalPage: 1 })
  const [myTraining, setMyTraining] = useState<any>(null)

  const fetchMyTraining = async () => {
    try {
      const res = await api.get('/trainings/my-training')
      // Map to the nested 'training' object from the response
      if (res.data && res.data.hasTraining) {
          setMyTraining(res.data.training)
      } else {
          setMyTraining(null)
      }
    } catch (err) {
      console.error('Gagal memuat detail pelatihan saya', err)
    }
  }

  const fetchTrainings = async () => {
    try {
      // Fetch ALL available trainings
      const res = await api.get('/trainings')
      console.log('Available Trainings (All):', res.data); 
      
      const list = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setAllTrainings(list)
      
      // Initialize Pagination (Client Side)
      setTrainingMeta({ 
        page: 1, 
        limit: 3, 
        total: list.length, 
        totalPage: Math.ceil(list.length / 3) 
      })
    } catch (err) {
      console.error('Gagal memuat jadwal', err)
    }
  }

  // Helper chunk array
  const chunkArray = (arr: any[], size: number) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  // Create pages from allTrainings
  const pages = chunkArray(allTrainings, 3); // 3 items per page

  // Auto-slide effect
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (allTrainings.length <= 3 || isPaused) return; 

    const interval = setInterval(() => {
        setTrainingMeta(prev => {
            const nextPage = prev.page >= prev.totalPage ? 1 : prev.page + 1;
            return { ...prev, page: nextPage };
        });
    }, 5000); 

    return () => clearInterval(interval);
  }, [allTrainings.length, trainingMeta.totalPage, isPaused]);

  // Handle manual page change
  const handlePageChange = (newPage: number) => {
      setTrainingMeta(prev => ({ ...prev, page: newPage }));
      // Optional: Pause briefly on manual interaction if needed, but hover handles it naturally
  }

  // --- Fetch Data Utama ---
  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await api.get('/profiles/me')
      const userData = res.data.data || res.data
      setProfile(userData)
      
      const userStatus = userData.user?.trainingFlow?.statusCode || 'PAYMENT_REQUIRED'
      setStatus(userStatus)
      setCurrentStep(getStepNumber(userStatus))
      
      // Jika status memungkinkan pilih jadwal, ambil data
      if (userStatus === 'ARTICLE_VERIFIED' || userStatus === 'TRAINING_RESCHEDULE') {
        fetchTrainings()
      }

      // Jika sudah pilih jadwal atau lebih lanjut, ambil detail training yang dipilih
      const postSelectionStatuses = ['TRAINING_WAITING', 'TRAINING_VERIFIED', 'REVIEW_WAITING', 'REVIEW_REVISION', 'REVIEW_VERIFIED', 'LOA_WAITING', 'LOA_PUBLISHED'];
      if (postSelectionStatuses.includes(userStatus)) {
        fetchMyTraining()
      }

    } catch (err) {
      console.error('Gagal memuat profil', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings')
      // Format response biasanya array of key-value atau object langsung
      // Kita normalize ke object biar gampang
      const data = res.data.data || res.data
      
      let settingsObj: any = {}
      if (Array.isArray(data)) {
         data.forEach((item: any) => {
            settingsObj[item.key] = item.value
         })
      } else {
         settingsObj = data
      }
      setPaymentSettings(settingsObj)
    } catch (err) {
      console.error('Gagal memuat setting', err)
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchSettings()
  }, [])

  // --- Handlers Action ---

  // STEP 1: Upload Bukti Bayar
  const handleUploadPayment = async () => {
    if (!filePayment) return showAlert({ title: 'Perhatian', message: 'Pilih file terlebih dahulu!', type: 'warning' })
    
    const formData = new FormData()
    formData.append('file', filePayment)

    setActionLoading(true)
    try {
      // Axios otomatis mengatur header Content-Type multipart/form-data untuk FormData
      // Interceptor akan otomatis menyisipkan token Authorization
      await api.post('/payments/upload', formData)
      
      // alert('Bukti pembayaran berhasil diupload! Mohon tunggu verifikasi admin.')
      setShowUploadModal(false)
      
      // Reload halaman untuk memastikan status terbaru terambil dengan bersih
      window.location.reload() 
    } catch (err: any) {
      let msg = 'Gagal upload bukti bayar';
      if (err.response?.data?.message) {
          const m = err.response.data.message;
          msg = typeof m === 'object' ? JSON.stringify(m) : m;
      }
      showAlert({ title: 'Gagal', message: msg, type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // STEP 1.5: Mulai Administrasi (Transition from PAYMENT_VERIFIED -> ADMINISTRATIVE_REQUIRED)
  const handleStartAdmin = async () => {
    setActionLoading(true)
    try {
      await api.post('/administrative/start')
      await fetchProfile() // Refresh to get new status (ADMINISTRATIVE_REQUIRED)
      setCurrentStep(2)
    } catch (err: any) {
      let msg = 'Gagal memulai tahap administrasi';
      if (err.response?.data?.message) {
          const m = err.response.data.message;
          msg = typeof m === 'object' ? JSON.stringify(m) : m;
      }
      showAlert({ title: 'Gagal', message: msg, type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // STEP 2: Konfirmasi Administrasi
  const handleConfirmAdmin = async () => {
    setActionLoading(true)
    try {
      await api.post('/administrative/confirm')
      showAlert({ title: 'Berhasil', message: 'Data administrasi dikonfirmasi. Mohon tunggu verifikasi admin.', type: 'success' })
      fetchProfile()
    } catch (err: any) {
      let msg = 'Gagal konfirmasi administrasi';
      if (err.response?.data?.message) {
          const m = err.response.data.message;
          msg = typeof m === 'object' ? JSON.stringify(m) : m;
      }
      showAlert({ title: 'Gagal', message: msg, type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // STEP 3: Submit Judul Artikel
  const handleSubmitArticle = async () => {
    if (!articleTitle.trim()) return showAlert({ title: 'Perhatian', message: 'Judul artikel tidak boleh kosong', type: 'warning' })
    
    setActionLoading(true)
    try {
      await api.post('/articles/confirm-submission', { articleTitle })
      showAlert({ title: 'Berhasil', message: 'Judul artikel berhasil disimpan. Mohon tunggu verifikasi admin.', type: 'success' })
      fetchProfile()
    } catch (err: any) {
      let msg = 'Gagal submit artikel';
      if (err.response?.data?.message) {
          const m = err.response.data.message;
          msg = typeof m === 'object' ? JSON.stringify(m) : m;
      }
      showAlert({ title: 'Gagal', message: msg, type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // STEP 4: Pilih Training
  const handleSelectTraining = async (id: string) => {
    setModalMessage('Apakah kamu yakin ingin memilih jadwal ini?')
    setModalAction(() => async () => {
        setActionLoading(true)
        try {
          // Update endpoint to /join based on latest documentation
          await api.post(`/trainings/${id}/join`)
          showAlert({ title: 'Berhasil', message: 'Berhasil memilih jadwal pelatihan!', type: 'success' })
          fetchProfile()
          setShowConfirmModal(false)
        } catch (err: any) {
          let msg = 'Gagal memilih jadwal';
          if (err.response?.data?.message) {
              const m = err.response.data.message;
              msg = typeof m === 'object' ? JSON.stringify(m) : m;
          }
          showAlert({ title: 'Gagal', message: msg, type: 'error' })
        } finally {
          setActionLoading(false)
        }
    })
    setShowConfirmModal(true)
  }

  // STEP 5: Konfirmasi Revisi
  const handleConfirmRevision = async () => {
    setActionLoading(true)
    try {
      await api.post('/articles/confirm-revision')
      showAlert({ title: 'Berhasil', message: 'Konfirmasi revisi berhasil dikirim.', type: 'success' })
      fetchProfile()
    } catch (err: any) {
      let msg = 'Gagal konfirmasi revisi';
      if (err.response?.data?.message) {
          const m = err.response.data.message;
          msg = typeof m === 'object' ? JSON.stringify(m) : m;
      }
      showAlert({ title: 'Gagal', message: msg, type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // STEP 6: Download LOA
  const handleDownloadLoa = async () => {
    try {
        // Karena response PDF stream, kita buka di tab baru atau download blob
        // Cara termudah: redirect window ke url
        window.open(`${process.env.NEXT_PUBLIC_API_URL}/articles/loa?token=${localStorage.getItem('token')}`, '_blank')
    } catch (err) {
        console.error(err)
        showAlert({ title: 'Gagal', message: 'Gagal download LOA', type: 'error' })
    }
  }


  // --- Render Functions ---

  const renderContent = () => {
    if (loading) return <div className="flex h-64 items-center justify-center text-white"><Loader2 className="animate-spin w-8 h-8"/></div>

    // 1. PEMBAYARAN
    if (currentStep === 1) {
      // TAMPILAN MENUNGGU VERIFIKASI (Terima Kasih!)
      if (status === 'PAYMENT_WAITING') {
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
             <div className="w-24 h-24 bg-[#EFE8D8] rounded-full flex items-center justify-center">
                <Clock className="w-12 h-12 text-[#949F93]" strokeWidth={1.5} />
             </div>
             <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">Terima Kasih!</h2>
                <p className="text-white/80 max-w-md mx-auto leading-relaxed">
                  Konfirmasi pembayaran kamu sudah kami terima, mohon tunggu verifikasi dari admin untuk dapat lanjut ke proses selanjutnya.
                </p>
             </div>
          </div>
        )
      }

      // TAMPILAN PEMBAYARAN VERIFIED (Sukses!)
      if (status === 'PAYMENT_VERIFIED') {
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
             <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-[#5C7B78]" strokeWidth={1.5} />
             </div>
             <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">Pembayaran Terverifikasi!</h2>
                <p className="text-white/80 max-w-md mx-auto leading-relaxed">
                  Pembayaranmu sudah dikonfirmasi oleh admin. Silahkan lanjut ke tahap pengisian data administrasi.
                </p>
                <Button 
                   onClick={handleStartAdmin}
                   disabled={actionLoading}
                   className="bg-[#5C7B78] hover:bg-[#4a6361] text-white px-8 py-6 text-lg rounded-xl shadow-lg mt-4"
                >
                   {actionLoading ? 'Memproses...' : 'Lanjut Isi Data Administrasi'} <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
             </div>
          </div>
        )
      }

      // TAMPILAN BAYAR (Informasi Pembayaran)
      return (
        <div className="flex flex-col items-center py-8 px-4">
          <h2 className="text-2xl font-bold text-white mb-8">Informasi Pembayaran</h2>
          
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-3xl overflow-hidden p-8 md:p-10 relative">
             
             {/* Total Pembayaran */}
             <div className="text-center mb-8">
                <p className="text-gray-500 font-medium mb-1">Total Pembayaran</p>
                <h3 className="text-4xl font-bold text-[#5C7B78]">
                  Rp {parseInt(paymentSettings?.payment_amount || '0').toLocaleString('id-ID')}
                </h3>
             </div>

             <div className="w-full h-px bg-gray-200 mb-8" />

             <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                {/* Kiri: Info Rekening */}
                <div className="w-full md:w-5/12">
                   <div className="bg-[#F9F7F2] border border-[#EFE3D4] rounded-xl p-6 flex flex-col items-start text-left h-full justify-center space-y-4">
                      {/* Logo Bank & Nama Bank */}
                      <div className="flex items-center gap-3">
                        {paymentSettings?.payment_bank_name && getBankLogo(paymentSettings.payment_bank_name) && (
                          <div className="relative w-12 h-6 flex items-center justify-center">
                            <Image 
                              src={getBankLogo(paymentSettings.payment_bank_name) || ''}
                              alt={paymentSettings.payment_bank_name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        <div className="text-lg font-medium text-[#5C7B78] tracking-tight">
                          {paymentSettings?.payment_bank_name || 'BANK'}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Nomor Rekening</p>
                        <p className="text-lg font-bold text-gray-800 leading-none">{paymentSettings?.payment_account_number || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Atas Nama <span className="font-bold text-gray-700">{paymentSettings?.payment_account_name || '-'}</span></p>
                      </div>
                   </div>
                </div>

                {/* Kanan: Cara Pembayaran */}
                <div className="w-full md:w-7/12">
                   <h4 className="font-bold text-gray-700 mb-3">Cara :</h4>
                   <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 leading-relaxed marker:text-[#5C7B78] marker:font-bold">
                      <li>Lakukan pembayaran ke Rekening {paymentSettings?.payment_bank_name} sejumlah nominal diatas</li>
                      <li>Kirim bukti pembayaran melalui tombol dibawah</li>
                      <li>Tunggu verifikasi admin untuk proses selanjutnya</li>
                   </ol>
                </div>
             </div>
          </div>

          {/* Tombol Buka Modal */}
          <button 
            onClick={() => setShowUploadModal(true)}
            className="mt-8 bg-[#5C7B78] hover:bg-[#4a6361] text-white font-semibold py-3 px-10 rounded-xl shadow-lg transition-transform hover:scale-105"
          >
            Kirim Bukti Bayar
          </button>

          {/* FULLSCREEN UPLOAD MODAL */}
          <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
            <DialogContent
              className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !m-0 !border-none !rounded-none !bg-[#D9C8B2] !overflow-hidden !z-50 !translate-x-0 !translate-y-0"
              showCloseButton={false}
            >
              <DialogTitle className="sr-only">Konfirmasi Pembayaran</DialogTitle>

              {/* Full screen overlay */}
              <div className="absolute inset-0 w-full h-full overflow-y-auto">
                <div className="min-h-full flex flex-col items-center p-2 sm:p-4">
                  
                  {/* Header */}
                  <div className="w-full flex justify-between items-start mb-2 mt-10 px-4 sm:px-6 md:px-10 lg:px-12">
                    <span className="font-bold text-3xl sm:text-4xl md:text-5xl text-[#5C7B78] tracking-tight">Juki.hub</span>
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="text-[#5C7B78] hover:text-[#D15651] transition-colors p-1"
                    >
                      <X className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Main Content - Centered vertically */}
                  <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl text-center space-y-8 py-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#5C7B78]">Konfirmasi Pembayaran</h2>

                    <div className="space-y-4">
                      <p className="font-bold text-[#5C7B78] text-lg">Upload Bukti Pembayaran</p>
                      <p className="text-[#5C7B78]/80 text-sm -mt-3">Format gambar max 5 mb</p>

                      <div className="mt-6">
                        <input 
                           type="file" 
                           id="upload-modal-input" 
                           className="hidden" 
                           accept="image/*,application/pdf"
                           onChange={(e) => setFilePayment(e.target.files?.[0] || null)}
                        />
                        <label 
                           htmlFor="upload-modal-input"
                           className="block w-full border-2 border-[#5C7B78] border-dashed rounded-2xl p-8 cursor-pointer hover:bg-[#5C7B78]/5 transition-all group"
                        >
                           <div className="bg-[#EFE8D8] text-[#5C7B78] font-bold py-3 px-10 rounded-xl inline-block shadow-sm group-hover:shadow-md transition-all transform group-hover:scale-105">
                              Upload
                           </div>
                           <p className="mt-4 text-sm font-medium text-[#5C7B78] px-4 break-all">
                              {filePayment ? filePayment.name : 'Belum ada file yang diunggah'}
                           </p>
                        </label>
                        {filePayment && (
                           <button 
                            className="text-[#D15651] text-xs mt-3 font-semibold hover:underline" 
                            onClick={() => setFilePayment(null)}
                           >
                              Hapus File
                           </button>
                        )}
                      </div>
                    </div>

                    <button 
                       onClick={handleUploadPayment}
                       disabled={!filePayment || actionLoading}
                       className="w-full max-w-md bg-[#5C7B78] hover:bg-[#4a6361] text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {actionLoading ? 'Mengirim...' : 'Kirim'}
                    </button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )
    }

    // 2. ADMINISTRASI
    if (currentStep === 2) {
      // 2B. JIKA SUDAH PUNYA AKUN OJS (Lulus Step Ini)
      // Cek apakah user punya ojsAccount di profile
      if (profile?.user?.trainingFlow?.ojsAccount) {
         const ojs = profile.user.trainingFlow.ojsAccount;
         return (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
               <div className="w-24 h-24 bg-[#EFE8D8] rounded-2xl flex items-center justify-center mb-2">
                  <FileText className="w-12 h-12 text-[#5C7B78]" strokeWidth={1.5} />
               </div>
               
               <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white">Kamu sudah punya akun OJS!</h2>
                  <p className="text-white/80 text-sm">Berikut adalah akun OJS yang dapat kamu gunakan</p>
               </div>

               <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-xl text-left space-y-4">
                  <div className="grid grid-cols-[120px_10px_1fr] gap-y-3 text-sm md:text-base text-gray-700">
                     <span className="font-medium text-gray-500">Username</span>
                     <span>:</span>
                     <span className="font-bold text-[#5C7B78]">{ojs.username || '-'}</span>

                     <span className="font-medium text-gray-500">Password</span>
                     <span>:</span>
                     <span className="font-bold text-[#5C7B78]">{ojs.password || '-'}</span>

                     <span className="font-medium text-gray-500">Kelompok Jurnal</span>
                     <span>:</span>
                     <span className="font-bold text-[#5C7B78]">{profile?.user?.trainingFlow?.journalCode || '-'}</span>
                  </div>
               </div>

               {/* Link Jurnal */}
               {ojs.journalLink && (
                   <div className="w-full max-w-lg relative mt-4">
                      <input 
                        type="text" 
                        readOnly 
                        value={ojs.journalLink}
                        className="w-full py-3 pl-5 pr-12 rounded-xl text-sm text-gray-600 bg-white border border-gray-200 outline-none"
                      />
                      <button 
                        onClick={() => {
                           navigator.clipboard.writeText(ojs.journalLink);
                           showAlert({ title: 'Disalin', message: 'Link berhasil disalin', type: 'success' });
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5C7B78]"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      </button>
                   </div>
               )}

               <Button 
                   onClick={() => setCurrentStep(3)}
                   className="mt-6 bg-[#5C7B78] hover:bg-[#4a6361] text-white px-10 py-6 rounded-xl font-bold text-lg shadow-lg"
               >
                   Lanjut Submit Artikel
               </Button>
            </div>
         )
      }

      // 2A. MENUNGGU VERIFIKASI ADMIN (Yeay!!!)
      if (status === 'WAITING_ADMINISTRATIVE') {
         return (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
               <div className="w-24 h-24 bg-[#EFE8D8] rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-12 h-12 text-[#5C7B78]" strokeWidth={2} />
               </div>
               <div className="space-y-3">
                  <h2 className="text-4xl font-bold text-white">Yeay!!!</h2>
                  <p className="text-white/90 max-w-md mx-auto leading-relaxed text-sm md:text-base">
                    Terima kasih sudah mengisi google form.<br/>
                    Admin sedang memproses pendaftaran akun OJS kamu, mohon tunggu info selanjutnya.
                  </p>
               </div>
            </div>
         )
      }

      // 2. DEFAULT: PENGISIAN FORM (Belum Mengisi)
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
           <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Pengisian Form Administratif</h2>
           <p className="text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
              Silahkan lakukan pengisian data pada tautan google form berikut untuk pendaftaran akun OJS.
           </p>

           {/* Input Link Readonly */}
           <div className="w-full max-w-xl relative mb-4">
              <input 
                type="text" 
                readOnly 
                value={paymentSettings?.admin_form_link || 'Link belum tersedia'}
                className="w-full py-4 pl-6 pr-12 rounded-xl text-gray-600 bg-white border-none shadow-lg outline-none text-center sm:text-left"
              />
              <button 
                onClick={() => {
                   if (paymentSettings?.admin_form_link) {
                      navigator.clipboard.writeText(paymentSettings.admin_form_link);
                      showAlert({ title: 'Disalin', message: 'Link berhasil disalin', type: 'success' });
                   }
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5C7B78] transition-colors"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
           </div>

           <p className="text-white/60 text-xs mb-8">Ingat klik tombol berikut jika sudah mengisi google form</p>

           <Button 
              onClick={handleConfirmAdmin} 
              disabled={actionLoading}
              className="bg-[#5C7B78] hover:bg-[#4a6361] text-white font-bold text-lg py-6 px-12 rounded-xl shadow-xl transition-transform hover:scale-105"
           >
              {actionLoading ? 'Memproses...' : 'Saya Telah Mengisi Form'}
           </Button>
        </div>
      )
    }

    // 3. ARTIKEL OJS
    if (currentStep === 3) {
      // 3A. MENUNGGU VERIFIKASI / ARTIKEL SUDAH DISUBMIT (Yeay!!!)
      if (status === 'ARTICLE_WAITING' || status === 'ARTICLE_VERIFIED' || status === 'TRAINING_WAITING') {
         return (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
               <div className="w-24 h-24 bg-[#EFE8D8] rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-12 h-12 text-[#5C7B78]" strokeWidth={2} />
               </div>
               <div className="space-y-3">
                  <h2 className="text-4xl font-bold text-white">Yeay!!!</h2>
                  <p className="text-white/90 max-w-md mx-auto leading-relaxed text-sm md:text-base">
                    Terima kasih sudah submit jurnal kamu di OJS.<br/>
                    Silahkan lanjut untuk <strong>Ikut Pelatihan</strong>.
                  </p>
                  
                  {/* Button to Next Step manually if needed, though status check usually moves them */}
                  {/* If status is ARTICLE_VERIFIED, they can actually move to step 4 */}
                  {(status === 'ARTICLE_VERIFIED' || status === 'ARTICLE_WAITING') && (
                      <Button 
                        onClick={() => setCurrentStep(4)}
                        className="mt-4 bg-[#5C7B78] hover:bg-[#4a6361] text-white px-8 py-6 text-lg rounded-xl shadow-lg"
                      >
                        Lanjut Ikut Pelatihan <ChevronRight className="ml-2 w-5 h-5" />
                      </Button>
                  )}
               </div>
            </div>
         )
      }

      // 3B. FORM SUBMIT ARTIKEL (Waktunya Submit Artikel!)
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
           <div className="w-24 h-24 bg-[#EFE8D8] rounded-full flex items-center justify-center mb-6">
              <Clock className="w-12 h-12 text-[#5C7B78]" strokeWidth={1.5} />
           </div>

           <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Waktunya Submit Artikel!</h2>
           <p className="text-white/90 max-w-xl mx-auto mb-10 leading-relaxed text-sm md:text-base">
              Silahkan akses akun OJS menggunakan username dan password yang telah diberikan. 
              Lakukan submit artikel sesuai template jurnal kamu di OJS, admin akan memantau progres jurnal kamu di OJS.
           </p>

           <div className="w-full max-w-lg bg-white p-8 rounded-[24px] shadow-xl text-left space-y-6">
              <div className="space-y-2">
                  <label className="text-sm font-bold text-[#5C7B78] ml-1">Judul Artikel (Konfirmasi)</label>
                  <input 
                      type="text" 
                      value={articleTitle}
                      onChange={(e) => setArticleTitle(e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5C7B78] focus:border-transparent outline-none text-gray-800 font-medium placeholder:text-gray-400 transition-all"
                      placeholder="Masukkan judul artikel yang telah disubmit..."
                  />
              </div>

              <Button 
                  onClick={handleSubmitArticle} 
                  disabled={!articleTitle.trim() || actionLoading}
                  className="w-full bg-[#5C7B78] hover:bg-[#4a6361] text-white font-bold text-lg py-6 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                  {actionLoading ? 'Menyimpan...' : 'Konfirmasi Sudah Submit'}
              </Button>
           </div>
        </div>
      )
    }

    // 4. JADWAL PELATIHAN
    if (currentStep === 4) {
      
      // 4A. SUDAH MENGIKUTI (Lulus Absensi)
      if (status === 'TRAINING_VERIFIED' || status === 'REVIEW_WAITING' || status === 'REVIEW_REVISION' || status === 'REVIEW_VERIFIED') {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
               <div className="w-24 h-24 bg-[#EFE8D8] rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-12 h-12 text-[#5C7B78]" strokeWidth={2} />
               </div>
               <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white">Kamu sudah mengikuti jadwal pelatihan</h2>
                  <p className="text-white/80">Kamu sudah bisa melakukan proses Review Artikel.</p>
               </div>
               
               {/* Auto transition button usually not needed as stepper moves, but just in case */}
               <Button 
                  onClick={() => setCurrentStep(5)}
                  className="mt-4 bg-[#5C7B78] hover:bg-[#4a6361] text-white px-8 py-6 text-lg rounded-xl shadow-lg"
               >
                  Lanjut Review Artikel <ChevronRight className="ml-2 w-5 h-5" />
               </Button>
            </div>
          )
      }

      // 4B. SUDAH TERDAFTAR (Menunggu Hari H)
      if (status === 'TRAINING_WAITING') {
          return (
             <div className="flex flex-col items-center py-12 px-4 text-center">
                <h2 className="text-3xl font-bold text-white mb-8">Kamu terdaftar di batch pelatihan ini!</h2>
                
                {myTraining ? (
                    <div className="w-full max-w-xl bg-white rounded-[24px] p-8 shadow-xl text-left relative animate-in fade-in zoom-in-95 duration-500">
                        <div className="space-y-6">
                            {/* Batch Label */}
                            <div className="text-gray-500 text-sm font-medium">
                                {myTraining.batch || 'Batch Terdaftar'}
                            </div>

                            {/* Date & Title */}
                            <div>
                                <h3 className="text-3xl font-bold text-gray-800 mb-1">
                                    {myTraining.startAt 
                                        ? new Date(myTraining.startAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                        : 'Jadwal Ditentukan'}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {myTraining.title}
                                </p>
                            </div>
                            
                            {/* Footer: Location & Time */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                                <div className="text-[#D15651] font-bold text-lg">
                                    {myTraining.location || 'Zoom Meeting'}
                                </div>
                                <div className="bg-[#5C7B78] text-white px-6 py-2 rounded-full font-bold text-sm shadow-sm">
                                    {myTraining.startAt 
                                        ? `${new Date(myTraining.startAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} - ${new Date(myTraining.endAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} WIB`
                                        : '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-10 text-white/60 italic">Memuat detail jadwal...</div>
                )}

                <p className="text-white/80 text-sm max-w-lg mt-8 leading-relaxed">
                    Pastikan kamu hadir tepat waktu agar bisa mendapatkan validasi kehadiran dan lanjut ke tahap akhir penerbitan LoA.
                </p>
             </div>
          )
      }

      // 4C. RESCHEDULE / PILIH JADWAL
      const isReschedule = status === 'TRAINING_RESCHEDULE';
      
      return (
        <div className="flex flex-col items-center py-12 px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
              {isReschedule ? 'Pilih Ulang Jadwal Pelatihan' : 'Pilih Jadwal Pelatihan'}
          </h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
              {isReschedule 
                ? 'Kamu tidak hadir di pelatihan yang sudah dijadwalkan, silahkan melakukan reschedule Jadwal.' 
                : 'Sebelum ikut pelatihan, yuk pilih jadwal pelatihan kamu.'}
          </p>
          
          {isReschedule && (
              <div className="mb-8 bg-[#D15651]/20 border border-[#D15651] p-4 rounded-xl text-white font-medium max-w-2xl">
                  Kamu tidak hadir di pelatihan sebelumnya. Silakan pilih jadwal baru di bawah ini.
              </div>
          )}
          
          {allTrainings.length === 0 ? (
              <p className="text-center italic text-white/60 py-8 bg-white/10 rounded-xl w-full max-w-2xl">Belum ada jadwal tersedia saat ini.</p>
          ) : (
              <div 
                className="w-full max-w-6xl overflow-hidden"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                  <div 
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(-${(trainingMeta.page - 1) * 100}%)` }}
                  >
                      {pages.map((pageItems, i) => (
                          <div key={i} className="w-full shrink-0 px-1">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {pageItems.map((training) => (
                                      <div key={training.id} className="bg-white rounded-[20px] p-6 shadow-lg flex flex-col justify-between h-full text-left group hover:-translate-y-1 transition-transform duration-300">
                                          <div className="space-y-4 mb-6">
                                              <div className="flex justify-between items-start">
                                                  <div className="bg-[#5C7B78] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                                      {training.title}
                                                  </div>
                                              </div>
                                              
                                              <div>
                                                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                      <CalendarDays className="w-5 h-5 text-[#5C7B78]" />
                                                      {new Date(training.startAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                                                  </h4>
                                                  <div className="flex items-center gap-2 text-gray-500 text-sm mt-1 ml-7">
                                                      <Clock className="w-4 h-4" />
                                                      {new Date(training.startAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} - {new Date(training.endAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} WIB
                                                  </div>
                                              </div>

                                              <div className="space-y-2 pt-2">
                                                  <div className="flex justify-between text-sm">
                                                      <span className="text-gray-500">Lokasi</span>
                                                      <span className="font-bold text-gray-800">{training.location}</span>
                                                  </div>
                                                  <div className="flex justify-between text-sm">
                                                      <span className="text-gray-500">Sisa Kuota</span>
                                                      <span className="font-bold text-[#D98E2E]">{training.quota} Peserta</span>
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          <Button 
                                            onClick={() => handleSelectTraining(training.id)}
                                            disabled={training.quota <= 0 || actionLoading}
                                            className="w-full bg-[#5C7B78] hover:bg-[#4a6361] text-white font-bold py-6 rounded-xl shadow-md"
                                          >
                                              {isReschedule ? 'Reschedule Jadwal Ini' : 'Saya Pilih Jadwal Ini'}
                                          </Button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Pagination Controls (Dots) */}
          {allTrainings.length > 0 && trainingMeta.totalPage > 1 && (
             <div className="flex justify-center items-center w-full mt-8 gap-3">
                 {Array.from({ length: trainingMeta.totalPage }).map((_, idx) => {
                     const pageNum = idx + 1;
                     return (
                         <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                trainingMeta.page === pageNum 
                                ? 'bg-white w-8' 
                                : 'bg-white/40 hover:bg-white/60'
                            }`}
                            aria-label={`Go to page ${pageNum}`}
                         />
                     );
                 })}
             </div>
          )}
        </div>
      )
    }

    // 5. REVIEW
    if (currentStep === 5) {
      return (
        <div className="space-y-6">
           <h2 className="text-2xl font-bold text-[#5C7B78]">Review Artikel</h2>
           
           {status === 'REVIEW_REVISION' ? (
              <div className="space-y-4">
                 <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800">
                    <h4 className="font-bold flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Perlu Revisi</h4>
                    <p className="text-sm mt-1">Artikel kamu perlu diperbaiki. Silahkan cek komentar admin, perbaiki di OJS, lalu konfirmasi di bawah.</p>
                 </div>
                 <Button 
                    onClick={handleConfirmRevision} 
                    disabled={actionLoading}
                    className="w-full bg-[#5C7B78] hover:bg-[#4a6361]"
                 >
                    {actionLoading ? 'Memproses...' : 'Saya Sudah Melakukan Revisi'}
                 </Button>
              </div>
           ) : (
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-4 text-yellow-800">
                <Clock className="w-8 h-8" />
                <div>
                   <h4 className="font-bold">Menunggu Review</h4>
                   <p className="text-sm">Artikelmu sedang direview oleh tim kami. Jika ada revisi, notifikasi akan muncul di sini.</p>
                </div>
             </div>
           )}
        </div>
      )
    }

    // 6. LOA
    if (currentStep === 6) {
      return (
        <div className="space-y-6 text-center py-10">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-[#5C7B78]">Selamat!</h2>
            <p className="text-gray-600 max-w-md mx-auto">
                Artikel kamu telah diterima dan dipublikasikan. Kamu sekarang dapat mendownload Letter of Acceptance (LoA) sebagai syarat kelulusan.
            </p>
            
            <Button 
                onClick={handleDownloadLoa}
                className="mt-6 bg-[#5C7B78] hover:bg-[#4a6361] px-8 py-6 text-lg rounded-xl shadow-lg"
            >
                <Download className="w-6 h-6 mr-2" />
                Download LoA
            </Button>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-[#949F93] font-sans selection:bg-white/30">
      <NavbarPeserta />
      
      <main className="w-full pt-28 pb-12 px-4 md:px-0 flex flex-col items-center">
        
        {/* HORIZONTAL STEPPER */}
        <div className="w-full max-w-5xl mb-12 px-4">
            <div className="relative flex justify-between items-start">
                
                {/* Connecting Line (Background) */}
                <div className="absolute top-6 left-[8.33%] right-[8.33%] h-1 bg-[#CBCBCB] -z-0 rounded-full" />

                {/* Steps */}
                {steps.map((step) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id; // Untuk masa depan jika ingin style completed beda
                    
                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center group w-1/6">
                            {/* Circle */}
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 shadow-md
                                ${isActive ? 'bg-[#D15651] text-white scale-110' : 'bg-[#CBCBCB] text-white'}
                            `}>
                                {step.id}
                            </div>
                            
                            {/* Label */}
                            <p className="mt-3 text-center text-white font-bold text-sm md:text-base leading-tight">
                                {step.label}
                            </p>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="w-full max-w-6xl">
            {renderContent()}
        </div>

      </main>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
         <DialogContent>
            <DialogHeader>
                <DialogTitle>Konfirmasi</DialogTitle>
            </DialogHeader>
            <p>{modalMessage}</p>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Batal</Button>
                <Button onClick={modalAction} className="bg-[#5C7B78] hover:bg-[#4a6361] text-white">Ya, Lanjutkan</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  )
}