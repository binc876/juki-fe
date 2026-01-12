'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  CheckCircle2, 
  Circle, 
  Upload, 
  MapPin, 
  Users, 
  FileText, 
  CalendarDays, 
  Clock, 
  AlertCircle,
  AlertTriangle,
  Download,
  Loader2,
  ChevronRight,
  ChevronLeft,
  X,
  User,
  Copy
} from 'lucide-react'
import { api, getErrorMessage, downloadFile } from '@/lib/api'
import NavbarPeserta from '@/components/dashboard/NavbarPeserta'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAlert } from '@/components/ui/alert-provider'

// --- Tipe Data ---
type UserStatus = 
  | 'PAYMENT_REQUIRED' | 'PAYMENT_WAITING' | 'PAYMENT_VERIFIED'
  | 'ADMINISTRATIVE_REQUIRED' | 'WAITING_ADMINISTRATIVE'
  | 'ARTICLE_WAITING' | 'ARTICLE_VERIFIED'
  | 'TRAINING_WAITING' | 'TRAINING_VERIFIED' | 'TRAINING_RESCHEDULE'
  | 'REVIEW_WAITING' | 'REVIEW_REVISION' | 'REVIEW_VERIFIED'
  | 'LOA_WAITING' | 'LOA_PUBLISHED';

interface Training {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location: string;
  quota: number;
  participantsCount: number;
  batch?: string;
  journalCode?: string;
  mentorName?: string;
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
    case 'ARTICLE_WAITING': // Bridge view is in Step 2
      return 2;
    case 'ARTICLE_VERIFIED': // Siap pilih jadwal
    case 'TRAINING_WAITING': // Sudah pilih jadwal
      return 4;
    case 'TRAINING_VERIFIED': // Sudah ikut training -> Review
    case 'REVIEW_WAITING':
    case 'REVIEW_REVISION':
      return 5;
    case 'REVIEW_VERIFIED': // Review OK -> LOA
    case 'LOA_WAITING':
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
  const [showArticleInput, setShowArticleInput] = useState(false) // New state for modal

  const [allTrainings, setAllTrainings] = useState<Training[]>([])
  const [trainingMeta, setTrainingMeta] = useState({ page: 1, limit: 3, total: 0, totalPage: 1 })
  const [myTraining, setMyTraining] = useState<any>(null)

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString));

  const formatTime = (start: string, end: string) => {
    const opt: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    return `${new Date(start).toLocaleTimeString(
      'id-ID',
      opt
    )} - ${new Date(end).toLocaleTimeString('id-ID', opt)} WIB`;
  };

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
  const fetchProfile = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true)
      const res = await api.get('/profiles/me')
      const userData = res.data.data || res.data
      setProfile(userData)
      
      const userStatus = userData.user?.trainingFlow?.statusCode || 'PAYMENT_REQUIRED'
      setStatus(userStatus)
      
      let newStep = getStepNumber(userStatus);
      
      // Fix: If ARTICLE_WAITING and articleTitle exists, user has submitted -> Go to Step 3 (Yeay View)
      // Otherwise, stay at Step 2 (Bridge View)
      if (userStatus === 'ARTICLE_WAITING' && userData.user?.trainingFlow?.articleTitle) {
          newStep = 3;
      }

      // Prevent regression if user manually advanced (e.g. from Step 2 Bridge to Step 3 Form)
      // while status is still 'ARTICLE_WAITING'
      if (userStatus === 'ARTICLE_WAITING' && currentStep > newStep) {
          // Keep current manual step
      } else {
          setCurrentStep(newStep)
      }
      
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
      if (!isBackground) setLoading(false)
    }
  }, [currentStep]) // Depend on currentStep to avoid stale closure

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
  }, []) // Initial fetch (fetchProfile is stable enough for initial, but technically better to separate or omit dep if we want run once. Empty is fine for "mount")

  // Polling for Status Updates
  useEffect(() => {
    const pollingStatuses = [
        'PAYMENT_WAITING', 
        'WAITING_ADMINISTRATIVE', 
        'ARTICLE_WAITING',
        'TRAINING_WAITING',
        'REVIEW_WAITING',
        'LOA_WAITING'
    ];

    let intervalId: NodeJS.Timeout;

    if (pollingStatuses.includes(status)) {
        intervalId = setInterval(() => {
            fetchProfile(true);
        }, 5000); // Poll every 5 seconds
    }

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, [status, fetchProfile]); // Add fetchProfile as dependency

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
      showAlert({ title: 'Gagal', message: getErrorMessage(err), type: 'error' })
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
      showAlert({ title: 'Gagal', message: getErrorMessage(err), type: 'error' })
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
      showAlert({ title: 'Gagal', message: getErrorMessage(err), type: 'error' })
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
      setShowArticleInput(false) // Close modal
      fetchProfile()
    } catch (err: any) {
      showAlert({ title: 'Gagal', message: getErrorMessage(err), type: 'error' })
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
          // Update endpoint to /select as requested
          await api.post(`/trainings/${id}/select`)
          showAlert({ title: 'Berhasil', message: 'Berhasil memilih jadwal pelatihan!', type: 'success' })
          fetchProfile()
          setShowConfirmModal(false)
        } catch (err: any) {
          showAlert({ title: 'Gagal', message: getErrorMessage(err), type: 'error' })
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
      showAlert({ title: 'Gagal', message: getErrorMessage(err), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // STEP 6: Download LOA
  const handleDownloadLoa = async () => {
    try {
        await downloadFile('/articles/loa', `LOA_JUKI_${profile?.profile?.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
        console.error(err)
        showAlert({ title: 'Gagal', message: 'Gagal mendownload LoA. Pastikan file sudah tersedia.', type: 'error' })
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
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
               <div className="w-20 h-20 bg-[#EFE8D8] rounded-2xl flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 text-[#5C7B78]" strokeWidth={1.5} />
               </div>
               
               <h2 className="text-3xl font-bold text-white mb-2">Kamu sudah punya akun OJS!</h2>
               <p className="text-white/80 text-sm mb-8">Berikut adalah akun OJS yang dapat kamu gunakan</p>

               <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-xl text-left space-y-4 mb-6">
                  <div className="grid grid-cols-[140px_10px_1fr] gap-y-4 text-sm md:text-base text-gray-700">
                     <span className="font-bold text-[#5C7B78]">Username</span>
                     <span className="font-bold text-[#5C7B78]">:</span>
                     <span className="font-bold text-gray-800">{ojs.username || '-'}</span>

                     <span className="font-bold text-[#5C7B78]">Password</span>
                     <span className="font-bold text-[#5C7B78]">:</span>
                     <span className="font-bold text-gray-800">{ojs.password || '-'}</span>

                     <span className="font-bold text-[#5C7B78]">Kelompok Jurnal</span>
                     <span className="font-bold text-[#5C7B78]">:</span>
                     <span className="font-bold text-gray-800 uppercase">{profile?.user?.trainingFlow?.journalCode || ojs.journalCode || '-'}</span>
                  </div>
               </div>

               {/* Link Jurnal */}
               {ojs.journalLink && (
                   <div className="w-full max-w-lg relative mb-8">
                      <input 
                        type="text" 
                        readOnly 
                        value={ojs.journalLink}
                        className="w-full py-4 pl-6 pr-12 rounded-xl text-gray-600 bg-white shadow-lg outline-none text-center sm:text-left"
                      />
                      <button 
                        onClick={() => {
                           navigator.clipboard.writeText(ojs.journalLink);
                           showAlert({ title: 'Disalin', message: 'Link berhasil disalin', type: 'success' });
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5C7B78] transition-colors"
                      >
                         <Copy className="w-5 h-5" />
                      </button>
                   </div>
               )}

               <Button 
                   onClick={() => setCurrentStep(3)}
                   className="w-full max-w-lg bg-[#5C7B78] hover:bg-[#4a6361] text-white py-6 rounded-xl font-bold text-lg shadow-lg"
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
      if (status === 'ARTICLE_WAITING' && profile?.user?.trainingFlow?.articleTitle) {
         return (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
               <div className="w-24 h-24 bg-[#EFE8D8] rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-12 h-12 text-[#5C7B78]" strokeWidth={2} />
               </div>
               <div className="space-y-3">
                  <h2 className="text-4xl font-bold text-white">Yeay!!!</h2>
                  <p className="text-white/90 max-w-md mx-auto leading-relaxed text-sm md:text-base">
                    Terima kasih sudah submit jurnal kamu di OJS.<br/>
                    Admin sedang memverifikasi artikel kamu, mohon tunggu info selanjutnya.
                  </p>
                  
                  <Button 
                    onClick={() => setCurrentStep(4)}
                    disabled={status === 'ARTICLE_WAITING'}
                    className="mt-4 bg-[#5C7B78] hover:bg-[#4a6361] text-white px-8 py-6 text-lg rounded-xl shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {status === 'ARTICLE_WAITING' ? 'Menunggu Verifikasi Admin...' : 'Lanjut Ikut Pelatihan'} 
                    {status !== 'ARTICLE_WAITING' && <ChevronRight className="ml-2 w-5 h-5" />}
                  </Button>
               </div>
            </div>
         )
      }

      // 3B. VIEW ARTICLE SUBMISSION (Header + Card Info + Action Form)
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-8">
           
           {/* PART 1: HEADER */}
           <div className="space-y-4">
              <div className="w-20 h-20 bg-[#EFE8D8] rounded-full flex items-center justify-center mx-auto mb-2">
                 <Clock className="w-10 h-10 text-[#5C7B78]" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Waktunya Submit Artikel!</h2>
              <p className="text-white/90 max-w-xl mx-auto leading-relaxed text-sm md:text-base">
                 Silahkan akses akun OJS menggunakan username dan password yang telah diberikan. 
                 Lakukan submit artikel sesuai template jurnal kamu di OJS.
              </p>
           </div>

           {/* PART 2: CARD KREDENSIAL OJS */}
           {profile?.user?.trainingFlow?.ojsAccount && (
              <div className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                 <div className="w-16 h-16 bg-[#F9F7F2] rounded-2xl flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-[#5C7B78]" />
                 </div>
                 <h3 className="font-bold text-gray-800 text-xl">Kamu sudah punya akun OJS!</h3>

                 <div className="text-left space-y-4 bg-[#F9F7F2] p-6 rounded-2xl border border-[#EFE3D4]">
                    <div className="flex justify-between items-center">
                       <span className="text-gray-500 font-medium">Username</span>
                       <span className="font-bold text-gray-800 font-mono select-all">{profile.user.trainingFlow.ojsAccount.username || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-gray-500 font-medium">Password</span>
                       <span className="font-bold text-gray-800 font-mono select-all">{profile.user.trainingFlow.ojsAccount.password || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-gray-500 font-medium">Kelompok Jurnal</span>
                       <span className="font-bold text-gray-800 uppercase">{profile?.user?.trainingFlow?.journalCode || profile.user.trainingFlow.ojsAccount.journalCode || '-'}</span>
                    </div>
                 </div>

                 {profile.user.trainingFlow.ojsAccount.journalLink && (
                    <a 
                       href={profile.user.trainingFlow.ojsAccount.journalLink}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center justify-center gap-2 w-full py-4 bg-[#EFE8D8] hover:bg-[#e5dec5] text-[#5C7B78] font-bold rounded-xl transition-all shadow-sm"
                    >
                       Buka Website OJS <ChevronRight className="w-4 h-4" />
                    </a>
                 )}
              </div>
           )}

           {/* PART 3: ACTION FORM (Wajib Ada untuk Backend) */}
           <div className="w-full max-w-lg bg-white/10 p-8 rounded-[32px] border border-white/20 backdrop-blur-sm text-left space-y-6">
              <div className="space-y-2">
                  <label className="text-sm font-bold text-white ml-1">Judul Artikel yang Disubmit</label>
                  <input 
                      type="text" 
                      value={articleTitle}
                      onChange={(e) => setArticleTitle(e.target.value)}
                      className="w-full p-4 bg-white border-none rounded-xl focus:ring-2 focus:ring-[#5C7B78] outline-none text-gray-800 font-medium placeholder:text-gray-400 transition-all"
                      placeholder="Masukkan judul artikel Anda..."
                  />
              </div>

              <Button 
                  onClick={handleSubmitArticle} 
                  disabled={!articleTitle.trim() || actionLoading}
                  className="w-full bg-[#5C7B78] hover:bg-[#4a6361] text-white font-bold text-lg py-7 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                  {actionLoading ? 'Memproses...' : 'Saya Sudah Submit di OJS'}
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
                    <Card className="w-full max-w-2xl bg-white border-2 border-gray-300 rounded-2xl shadow-xl overflow-hidden p-2 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex flex-col h-full rounded-xl overflow-hidden">
                            {/* HEADER */}
                            <div className="flex items-center gap-4 px-6 py-5 h-[100px] bg-[#5C7B78] text-white text-left">
                                <CalendarDays className="w-12 h-12 shrink-0" strokeWidth={2.5} />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-medium uppercase tracking-wider text-white/90 truncate">
                                        {myTraining.batch || 'Batch Terdaftar'} | {myTraining.title}
                                    </span>
                                    <h3 className="text-2xl font-bold truncate">
                                        {myTraining.startAt ? formatDate(myTraining.startAt) : 'Jadwal Ditentukan'}
                                    </h3>
                                </div>
                            </div>

                            {/* BODY */}
                            <CardContent className="px-6 py-6 bg-white text-gray-700 font-medium text-left">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <MapPin className="w-6 h-6 text-[#5C7B78] shrink-0" />
                                        <span className="text-lg">{myTraining.location || 'Zoom Meeting'}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Clock className="w-6 h-6 text-[#5C7B78] shrink-0" />
                                        <span className="text-lg">
                                            {myTraining.startAt ? formatTime(myTraining.startAt, myTraining.endAt) : '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <FileText className="w-6 h-6 text-[#5C7B78] shrink-0" />
                                        <span>Kelompok Jurnal : <strong className="text-gray-900">{profile?.user?.trainingFlow?.journalCode || '-'}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <User className="w-6 h-6 text-[#5C7B78] shrink-0" />
                                        <span>Dosen Pembimbing : <span className="text-gray-900">{myTraining.mentorName || '-'}</span></span>
                                    </div>
                                </div>
                            </CardContent>
                        </div>
                    </Card>
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
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 place-items-start">
                                  {pageItems.map((training) => (
                                      <Card
                                        key={training.id}
                                        className="
                                          w-full
                                          max-w-[440px]
                                          min-h-[400px]
                                          bg-white
                                          border-2 border-gray-300
                                          rounded-2xl
                                          shadow-sm
                                          overflow-hidden
                                          p-2
                                          box-border
                                          transition-all
                                          duration-300
                                          hover:border-[#5C7B78]
                                          hover:shadow-md
                                          group
                                        "
                                      >
                                        <div className="flex flex-col h-full rounded-xl overflow-hidden">
                                          {/* HEADER */}
                                          <div className="
                                            flex
                                            items-center
                                            gap-4
                                            px-5
                                            py-3
                                            h-[90px]
                                            bg-[#5C7B78]
                                            text-white
                                            transition-colors
                                            group-hover:bg-[#4a6361]
                                            text-left
                                          ">
                                            <CalendarDays className="w-10 h-10 shrink-0" strokeWidth={2.5} />
                                            <div className="flex flex-col min-w-0">
                                              <span className="
                                                text-[11px]
                                                lg:text-[12px]
                                                font-medium
                                                uppercase
                                                tracking-wider
                                                text-white/90
                                                truncate
                                              ">
                                                {training.batch ? `${training.batch} | ` : ''}
                                                {training.title}
                                              </span>
                                              <h3 className="
                                                text-lg
                                                lg:text-[22px]
                                                font-bold
                                                truncate
                                              ">
                                                {formatDate(training.startAt)}
                                              </h3>
                                            </div>
                                          </div>

                                          {/* BODY */}
                                          <CardContent className="
                                            flex-grow
                                            px-5
                                            py-4
                                            bg-white
                                            text-gray-700
                                            text-[13px]
                                            lg:text-[15px]
                                            font-medium
                                            flex
                                            flex-col
                                            justify-center
                                            text-left
                                          ">
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-3 min-w-0">
                                                <MapPin className="w-5 h-5 text-[#5C7B78] shrink-0" />
                                                <span className="truncate">{training.location}</span>
                                              </div>
                                              <div className="flex items-center gap-3 min-w-0">
                                                <Clock className="w-5 h-5 text-[#5C7B78] shrink-0" />
                                                <span className="truncate">
                                                  {formatTime(training.startAt, training.endAt)}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-3 min-w-0">
                                                <FileText className="w-5 h-5 text-[#5C7B78] shrink-0" />
                                                <span className="truncate">
                                                  Kelompok Jurnal :
                                                  <strong className="text-gray-900">
                                                    {' '}
                                                    {training.journalCode || 'JOESMENT'}
                                                  </strong>
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-3 min-w-0">
                                                <User className="w-5 h-5 text-[#5C7B78] shrink-0" />
                                                <span className="truncate">
                                                  Dosen Pembimbing :
                                                  <span className="text-gray-900">
                                                    {' '}
                                                    {training.mentorName || 'Bayu Setiawan'}
                                                  </span>
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-3 pt-1 min-w-0">
                                                <Users className="w-5 h-5 text-[#5C7B78] shrink-0" />
                                                <span className="truncate">
                                                  Sisa Kuota :
                                                  <span className="text-[#D35F5F] font-bold">
                                                    {' '}
                                                    {training.quota} Peserta
                                                  </span>
                                                </span>
                                              </div>
                                              
                                              <Button 
                                                onClick={() => handleSelectTraining(training.id)}
                                                disabled={training.quota <= 0 || actionLoading}
                                                className="w-full bg-[#5C7B78] hover:bg-[#4a6361] text-white font-bold py-6 rounded-xl shadow-md mt-4"
                                              >
                                                  {isReschedule ? 'Reschedule Jadwal Ini' : 'Saya Pilih Jadwal Ini'}
                                              </Button>
                                            </div>
                                          </CardContent>
                                        </div>
                                      </Card>
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
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-8">
           
           {/* PART 1: HEADER */}
           <div className="space-y-4">
              <div className="w-20 h-20 bg-[#EFE8D8] rounded-full flex items-center justify-center mx-auto mb-2">
                 <Clock className="w-10 h-10 text-[#5C7B78]" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Waktunya Review Artikel!</h2>
              <p className="text-white/90 max-w-xl mx-auto leading-relaxed text-sm md:text-base">
                 Silahkan melakukan review dan revisi artikel di OJS.<br/>
                 Admin akan memantau progres jurnal kamu di OJS.
              </p>
           </div>

           {/* REVISION ALERT (If needed) */}
           {status === 'REVIEW_REVISION' && (
              <div className="w-full max-w-lg bg-white/10 p-6 rounded-[24px] border border-white/20 backdrop-blur-sm text-left">
                 <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-full shrink-0">
                       <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="space-y-2">
                       <h4 className="font-bold text-white text-lg">Perlu Revisi</h4>
                       <p className="text-white/80 text-sm">
                          Artikel kamu perlu diperbaiki. Silahkan cek komentar admin di OJS, perbaiki, lalu konfirmasi di sini jika sudah selesai.
                       </p>
                       <Button 
                          onClick={handleConfirmRevision} 
                          disabled={actionLoading}
                          className="mt-2 w-full bg-[#D98E2E] hover:bg-[#b57b2b] text-white font-bold"
                       >
                          {actionLoading ? 'Memproses...' : 'Saya Sudah Melakukan Revisi'}
                       </Button>
                    </div>
                 </div>
              </div>
           )}
        </div>
      )
    }

    // 6. LOA
    if (currentStep === 6) {
      if (status === 'LOA_PUBLISHED') {
        return (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-8 animate-in fade-in duration-700">
              <div className="w-24 h-24 bg-[#EFE8D8] rounded-full flex items-center justify-center mb-2 shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-[#5C7B78]" strokeWidth={2} />
              </div>
              <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold text-white">LOA Kamu Telah Terbit!</h2>
                  <p className="text-white/90 max-w-2xl mx-auto leading-relaxed text-sm md:text-lg">
                      Selamat! Kamu telah menyelesaikan seluruh rangkaian pelatihan dan dinyatakan lolos. 
                      LOA (Letter of Acceptance) untuk keperluan syarat kelulusanmu sudah tersedia dan bisa kamu unduh kapan saja.
                  </p>
              </div>
              
              <Button 
                  onClick={handleDownloadLoa}
                  className="mt-6 bg-[#5C7B78] hover:bg-[#4a6361] px-12 py-7 text-xl font-bold rounded-2xl shadow-xl transition-transform hover:scale-105"
              >
                  <Download className="w-6 h-6 mr-3" />
                  Download LOA
              </Button>
          </div>
        )
      }

      // Default: Waiting State (LOA_WAITING)
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-8 animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-[#EFE8D8] rounded-full flex items-center justify-center mb-2">
                <Clock className="w-12 h-12 text-[#5C7B78]" strokeWidth={1.5} />
            </div>
            <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold text-white">Artikel Anda Telah Disetujui!</h2>
                <p className="text-white/90 max-w-xl mx-auto leading-relaxed text-sm md:text-lg font-medium">
                    Selamat! Artikel Anda telah berhasil melewati tahap review.<br/>
                    Saat ini admin sedang menyiapkan dokumen Letter of Acceptance (LoA) Anda. Mohon cek halaman ini secara berkala.
                </p>
            </div>
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