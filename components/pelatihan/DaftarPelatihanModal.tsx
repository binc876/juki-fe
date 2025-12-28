/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Calendar as CalendarIcon, MapPin, Users, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
// import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

interface DaftarPelatihanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userTicketId: number | null;
}

interface IFormData {
  nama_lengkap: string;
  email: string;
  nim: string;
  whatsapp: string;
  judul_artikel: string;
  tanggal_pelatihan_id: number | null;
  bukti_pembayaran: File | null;
  surat_pernyataan: File | null;
  konfirmasiData: boolean;
  konfirmasiJadwal: boolean;
}

interface IJadwalPelatihan {
  id: number;
  batch_number: string;
  started_at: string;
  ended_at: string;
  subtitle: string;
  location: string;
  lecturer: string;
  quota: number;
  current_quota: number;
  peserta: any[];
  // tanggal_pelatihan?: string;
  // jam_mulai?: string;
  // jam_selesai?: string;
  // lokasi?: string;
  // kuota?: number;
  // date?: string;
}

const formatPhoneNumber = (phone: string) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('62')) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return `+62${cleaned}`;
};

export default function DaftarPelatihanModal({ isOpen, onClose, onSuccess, userTicketId }: DaftarPelatihanModalProps) {
  const [step, setStep] = useState(1)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<IFormData>({
    nama_lengkap: '',
    email: '',
    nim: '',
    whatsapp: '',
    judul_artikel: '',
    tanggal_pelatihan_id: null,
    bukti_pembayaran: null,
    surat_pernyataan: null,
    konfirmasiData: false,
    konfirmasiJadwal: false,
  });

  useEffect(() => {
    if (isOpen) {
      console.log('[DEBUG] DaftarPelatihanModal opened with props:', { isOpen, userTicketId });
    }
  }, [isOpen, userTicketId]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!userTicketId) {
      console.error('[DEBUG] handleSubmit Error: userTicketId is missing.');
      setNotification({ message: 'ID Tiket tidak ditemukan.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const payload = new FormData()
    payload.append('user_ticket_id', String(userTicketId));
    payload.append('article_title', formData.judul_artikel)
    payload.append('training_schedule_id', String(formData.tanggal_pelatihan_id || ''))

    if (formData.bukti_pembayaran) {
      payload.append('payment_evidence', formData.bukti_pembayaran)
    }

    if (formData.surat_pernyataan) {
      payload.append('statement_letter', formData.surat_pernyataan)
    }

    console.log('[DEBUG] Submitting registration form with payload:');
    for (const pair of payload.entries()) {
      if (pair[1] instanceof File) {
        console.log(`  ${pair[0]}: [File] name="${(pair[1] as File).name}", size=${(pair[1] as File).size}`);
      } else {
        console.log(`  ${pair[0]}: ${pair[1]}`);
      }
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ message: 'Token tidak ditemukan, silakan login kembali.', type: 'error' });
        return;
      }

      const response = await api.post('/user-tickets/use', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        }
      })

      console.log('[DEBUG] API Success:', response.data);

      setNotification({ message: 'Pendaftaran berhasil dikirim!', type: 'success' });
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500);
    } catch (err: any) {
      console.error('[DEBUG] API Error:', err.response ? err.response.data : err);
      setNotification({ message: 'Terjadi kesalahan saat mengirim data.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  }

  const isStep1Valid = 
    formData.judul_artikel.trim() !== ''

  const isStep2Valid = formData.tanggal_pelatihan_id !== null

  const isStep3Valid =
    formData.bukti_pembayaran &&
    formData.surat_pernyataan &&
    formData.konfirmasiData &&
    formData.konfirmasiJadwal

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormData({
        nama_lengkap: '',
        email: '',
        nim: '',
        whatsapp: '',
        judul_artikel: '',
        tanggal_pelatihan_id: null,
        bukti_pembayaran: null,
        surat_pernyataan: null,
        konfirmasiData: false,
        konfirmasiJadwal: false,
      });
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !m-0 !border-none !rounded-none !bg-[#D9C8B2] !overflow-hidden !z-50 !translate-x-0 !translate-y-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Daftar Pelatihan</DialogTitle>

        {notification && (
          <div
            className={cn(
              "absolute top-8 left-1/2 -translate-x-1/2 p-4 rounded-md text-white z-50",
              notification.type === 'success' ? "bg-green-500" : "bg-red-500"
            )}
          >
            {notification.message}
            <button onClick={() => setNotification(null)} className="ml-4 font-bold">X</button>
          </div>
        )}

        <div className="absolute inset-0 w-full h-full flex flex-col">
          {/* Header */}
          <div className="w-full flex justify-between items-center p-4 md:p-8">
            <span className="font-bold text-2xl md:text-3xl text-[#5C7B78]">Jupalo.</span>
            <button
              onClick={onClose}
              className="text-[#5C7B78] hover:text-[#D15651] transition-colors p-1"
            >
              <X className="w-6 h-6 md:w-8 md:h-8 stroke-3" />
            </button>
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold text-center mb-6 md:mb-8 text-[#5C7B78] px-4">Daftar Pelatihan.</h1>

          {/* Step indicators - Label hanya muncul di step aktif */}
          <div className="flex justify-center items-center space-x-4 md:space-x-8 mb-10 px-4">
            {[
              { number: 1, label: 'Data Diri' }, 
              { number: 2, label: 'Tanggal Pelatihan' }, 
              { number: 3, label: 'Upload Dokumen' }
            ].map((stepItem, index) => (
              <div
                key={index}
                className="flex items-center gap-2 md:gap-3"
              >
                <div
                  className={cn(
                    'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-base md:text-lg flex-shrink-0',
                    step === stepItem.number 
                      ? 'bg-[#5C7B78] text-white' 
                      : stepItem.number < step 
                        ? 'bg-[#5C7B78] text-white' 
                        : 'bg-[#E5E5E5] text-[#9CA3AF]'
                  )}
                >
                  {stepItem.number}
                </div>
                {step === stepItem.number && (
                  <span
                    className="text-sm md:text-lg font-medium text-[#5C7B78] whitespace-nowrap"
                  >
                    {stepItem.label}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex-grow overflow-y-auto px-4 md:px-20 pb-10">
            <div className="max-w-6xl mx-auto">
              {step === 1 && <Step1 formData={formData} setFormData={setFormData} />}
              {step === 2 && <Step2 formData={formData} setFormData={setFormData} />}
              {step === 3 && <Step3 formData={formData} setFormData={setFormData} setNotification={setNotification} />}
            </div>
          </div>

          <div className="flex justify-center gap-3 md:gap-4 mt-6 pb-6 md:pb-10 px-4">
              {step > 1 && (
                <Button onClick={handleBack} className="px-6 md:px-10 py-2 md:py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-full text-sm md:text-base">
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !isStep1Valid) ||
                    (step === 2 && !isStep2Valid)
                  }
                  className={cn('px-6 md:px-10 py-2 md:py-3 bg-[#5C7B78] hover:bg-[#4a6562] text-white rounded-full text-sm md:text-base',
                    ((step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)) ? 'opacity-50 cursor-not-allowed hover:bg-[#5C7B78]' : ''
                  )}
                >
                  Next
                </Button>
              ) : (
                <Button
                  disabled={!isStep3Valid}
                  onClick={handleSubmit}
                  className={cn("px-6 md:px-10 py-2 md:py-3 bg-[#5C7B78] hover:bg-[#4a6562] text-white rounded-full text-sm md:text-base",
                    !isStep3Valid ? 'opacity-50 cursor-not-allowed hover:bg-[#5C7B78]' : ''
                  )}
                >
                  Daftar
                </Button>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface StepProps {
  formData: IFormData;
  setFormData: React.Dispatch<React.SetStateAction<IFormData>>;
}

interface Step3Props extends StepProps {
  setNotification: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'error' } | null>>;
}

function Step1({ formData, setFormData }: StepProps) {
    const [loadingUser, setLoadingUser] = useState(true);
    const [userError, setUserError] = useState<string | null>(null);

    useEffect(() => {
      const populateUserData = () => {
        setLoadingUser(true);
        const userData = localStorage.getItem('user');

        if (!userData) {
          setUserError('User data not found in local storage.');
          setLoadingUser(false);
          return;
        }

        try {
            const parsedUser = JSON.parse(userData);

            setFormData((prev) => ({
              ...prev,
              nama_lengkap: parsedUser.name || '',
              nim: parsedUser.student_number || '',
              email: parsedUser.email || '',
              whatsapp: formatPhoneNumber(parsedUser.mobile_number || ''),
            }));
        } catch (err) {
            console.error("Gagal mem-parsing data user dari localStorage:", err);
            setUserError('Gagal memuat data user dari penyimpanan lokal.');
        } finally {
            setLoadingUser(false);
        }
      };

      populateUserData();
    }, [setFormData]);
  
    if (loadingUser) {
      return <div className="text-center text-[#5C7B78]">Memuat data user...</div>;
    }

    if (userError) {
      return <div className="text-center text-red-500">Error: {userError}</div>;
    }

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'>
          <div>
            <label className="block mb-2 text-[#5C7B78] font-medium text-sm md:text-base">Nama Lengkap</label>
            <input
              type="text"
              value={formData.nama_lengkap}
              disabled
              className="w-full rounded-xl px-4 py-2 md:py-3 bg-[#5C7B78] text-white placeholder-gray-200 font-medium text-sm md:text-base cursor-not-allowed opacity-90"
            />
          </div>
  
          <div>
            <label className="block mb-2 text-[#5C7B78] font-medium text-sm md:text-base">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full rounded-xl px-4 py-2 md:py-3 bg-[#5C7B78] text-white placeholder-gray-200 font-medium text-sm md:text-base cursor-not-allowed opacity-90"
            />
          </div>
  
          <div>
            <label className="block mb-2 text-[#5C7B78] font-medium text-sm md:text-base">Nomor Induk Mahasiswa</label>
            <input
              type="text"
              value={formData.nim}
              disabled
              className="w-full rounded-xl px-4 py-2 md:py-3 bg-[#5C7B78] text-white placeholder-gray-200 font-medium text-sm md:text-base cursor-not-allowed opacity-90"
            />
          </div>
  
          <div>
            <label className="block mb-2 text-[#5C7B78] font-medium text-sm md:text-base">WhatsApp</label>
            <input
              type="text"
              value={formData.whatsapp}
              disabled
              placeholder='Masukkan nomor whatsapp'
              className="w-full rounded-xl px-4 py-2 md:py-3 bg-[#5C7B78] text-white placeholder-gray-300 font-medium text-sm md:text-base"
            />
          </div>
        </div>
        <div>
          <label className="block text-[#5C7B78] mb-2 font-medium text-sm md:text-base">Judul Artikel</label>
          <textarea
            rows={4}
            value={formData.judul_artikel}
            onChange={(e) => setFormData({ ...formData, judul_artikel: e.target.value })}
            placeholder="Tulis judul artikel kamu.."
            className="w-full rounded-xl px-4 py-2 md:py-3 bg-transparent text-[#5C7B78] placeholder-gray-400 border-2 border-[#5C7B78] font-medium text-sm md:text-base"
          />
        </div>
      </div>
    )
  }
  
  function Step2({ formData, setFormData }: StepProps) {
    const [listJadwalPelatihan, setListJadwalPelatihan] = useState<IJadwalPelatihan[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 3
  
    const sortedJadwal = (Array.isArray(listJadwalPelatihan) ? listJadwalPelatihan : [])
      .slice()
      .sort((a, b) => {
            return new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
        })
      .filter((jadwal: IJadwalPelatihan) => (jadwal.quota - jadwal.current_quota) > 0)

      // .sort((a, b) => {
      //   const dateA = new Date(a.started_at || a.tanggal_pelatihan || a.date || '')
      //   const dateB = new Date(b.started_at || b.tanggal_pelatihan || b.date || '')
      //   return dateA.getTime() - dateB.getTime()
      // })
      // .filter((jadwal: IJadwalPelatihan) => {
      //   const quota = jadwal.quota || jadwal.kuota || 0
      //   const pesertaLength = jadwal.peserta?.length || 0
      //   return (quota - pesertaLength) > 0
      // })
  
    const totalItems = sortedJadwal.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentItems = sortedJadwal.slice(startIndex, endIndex)
  
    // const formatHariTanggal = (tanggalString: string) => {
    //   if (!tanggalString) return { hari: 'Hari', tanggal: 'Tanggal tidak tersedia' }
    //   const tanggal = new Date(tanggalString)
    //   if (isNaN(tanggal.getTime())) return { hari: 'Hari', tanggal: 'Tanggal tidak valid' }
      
    //   const hari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(tanggal)
    //   const tanggalFormat = new Intl.DateTimeFormat('id-ID', { 
    //     day: 'numeric', 
    //     month: 'long', 
    //     year: 'numeric' 
    //   }).format(tanggal)
      
    //   return { hari, tanggal: tanggalFormat }
    // }
  
    const handlePreviousPage = () => {
      setCurrentPage(prev => Math.max(prev - 1, 1))
    }
  
    const handleNextPage = () => {
      setCurrentPage(prev => Math.min(prev + 1, totalPages))
    }
  
    const handlePageClick = (pageNumber: number) => {
      setCurrentPage(pageNumber)
    }
  
    const getPageNumbers = () => {
      const pageNumbers: (number | string)[] = []
      
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
          pageNumbers.push(i)
        }
      } else {
        pageNumbers.push(1)
        
        if (currentPage <= 4) {
          for (let i = 2; i <= 5; i++) {
            pageNumbers.push(i)
          }
          pageNumbers.push('...')
          pageNumbers.push(totalPages)
        } else if (currentPage >= totalPages - 3) {
          pageNumbers.push('...')
          for (let i = totalPages - 4; i <= totalPages; i++) {
            pageNumbers.push(i)
          }
        } else {
          pageNumbers.push('...')
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pageNumbers.push(i)
          }
          pageNumbers.push('...')
          pageNumbers.push(totalPages)
        }
      }
      
      return pageNumbers
    }
  
    useEffect(() => {
      setLoading(true);
      api.get('/training-schedules')
        .then(res => {
          if (Array.isArray(res.data)) {
            setListJadwalPelatihan(res.data)
          } else if (Array.isArray(res.data.data)) {
            setListJadwalPelatihan(res.data.data)
          } else {
            console.error('Data is not an array:', res.data)
            setListJadwalPelatihan([])
          }
        })
        .catch(err => {
          api.get('/training-schedules')
            .then(res => {
              if (Array.isArray(res.data)) {
                setListJadwalPelatihan(res.data)
              } else if (Array.isArray(res.data.data)) {
                setListJadwalPelatihan(res.data.data)
              } else {
                console.error('Data is not an array:', res.data)
                setListJadwalPelatihan([])
              }
            })
            .catch(err2 => {
              console.error('Both API calls failed:', err, err2)
              setListJadwalPelatihan([])
            })
        })
        .finally(() => setLoading(false));
    }, []);
  
    useEffect(() => {
      setCurrentPage(1)
    }, [listJadwalPelatihan]);

    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#5C7B78]" />
        </div>
      );
    }
  
    return (
      <div className="max-w-6xl mx-auto text-center space-y-6 md:space-y-8">
        <p className="text-[#5C7B78] font-medium text-base md:text-lg">Pilih Tanggal Pelatihan</p>
  
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {currentItems.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500 py-8">
              <p>Tidak ada jadwal pelatihan tersedia</p>
              <p className="text-sm">Total data: {listJadwalPelatihan.length}</p>
            </div>
          ) : (
            currentItems.map((jadwal: IJadwalPelatihan) => {
              return (
                <div key={jadwal.id}
                onClick={() => setFormData({ ...formData, tanggal_pelatihan_id: jadwal.id })}
                  className={cn(
                    'bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer',
                    formData.tanggal_pelatihan_id === jadwal.id
                      ? 'bg-[#D15651] border-[#D15651]'
                      : 'bg-white border-[#5C7B78] hover:bg-[#D15651]'
                  )}
                 >
                        <div className="bg-gradient-to-r from-[#5C7B78] to-[#4e6a67] p-4 text-white">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5" />
                                <div className="flex flex-col items-start">
                                    <span className="text-xs text-gray-300">{jadwal.batch_number} | {jadwal.subtitle}</span>
                                    <h2 className="text-lg font-bold">
                                        {(() => {
                                            const start = new Date(jadwal.started_at);
                                            const formattedDate = start.toLocaleDateString('id-ID', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            });
                                            return `${formattedDate}`;
                                        })()}
                                    </h2>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-start gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{jadwal.location}</span>
                            </div>
                            {/* Mulai */}
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-700">
                                    {(() => {
                                        const start = new Date(jadwal.started_at);
                                        const end = new Date(jadwal.ended_at);
                                        const formattedTime = start.toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        });
                                        const formattedEndTime = end.toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        });
                                        return `${formattedTime} - ${formattedEndTime} WIB`;
                                    })()}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-700">Dosbing:</span>
                                <span className="font-semibold text-gray-700">{jadwal.lecturer}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-700">Sisa Kuota:</span>
                                <span className="font-semibold text-red-700">{jadwal.quota - jadwal.current_quota} peserta</span>
                            </div>
                        </div>
                    </div>
              )
              // const tanggal = jadwal.started_at || jadwal.tanggal_pelatihan || jadwal.date || ''
              // const jamMulai = jadwal.started_at ? jadwal.started_at.slice(11,16) : (jadwal.jam_mulai?.slice(0, 5) || '09:00')
              // const jamSelesai = jadwal.ended_at ? jadwal.ended_at.slice(11,16) : (jadwal.jam_selesai?.slice(0, 5) || '11:00')
              // const lokasi = jadwal.location || jadwal.lokasi || 'Gedung G15'
              // const dosen = jadwal.lecturer || 'Ahmad Bin Hanbal'
              // const quota = jadwal.quota || jadwal.kuota || 25
              // const pesertaLength = jadwal.peserta?.length || 0
              // const sisaKuota = quota - pesertaLength
              
              // const { hari, tanggal: tanggalFormat } = formatHariTanggal(tanggal)

              // return (
              //   <Card
              //     key={jadwal.id}
              //     onClick={() => setFormData({ ...formData, tanggal_pelatihan_id: jadwal.id })}
              //     className={cn(
              //       'w-full sm:w-72 md:w-80 rounded-2xl p-4 md:p-6 cursor-pointer transition-all shadow-lg border-2',
              //       formData.tanggal_pelatihan_id === jadwal.id
              //         ? 'bg-[#D15651] text-white border-[#D15651]'
              //         : 'bg-[#5C7B78] text-white border-[#5C7B78] hover:bg-[#4a6562]'
              //     )}
              //   >
              //     <CardContent className="p-0 text-center">
              //       <h2 className="font-bold text-lg md:text-xl mb-2 break-words">{hari}, {tanggalFormat}</h2>
              //       <p className="text-base md:text-lg mb-3 md:mb-4">{jamMulai} - {jamSelesai} WIB</p>
              //       <p className="text-xs md:text-sm mb-1 break-words">Lokasi : {lokasi}</p>
              //       <p className="text-xs md:text-sm mb-3 md:mb-4 break-words">Dosen : {dosen}</p>
              //       <div className={cn(
              //         'inline-block px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium',
              //         formData.tanggal_pelatihan_id === jadwal.id
              //           ? 'bg-white text-[#D15651]'
              //           : 'bg-white text-[#5C7B78]'
              //       )}>
              //         Sisa Kuota: {sisaKuota} peserta
              //       </div>
              //     </CardContent>
              //   </Card>
              // )
            })
          )}
        </div>
  
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 md:mt-8 gap-1 md:gap-2 flex-wrap px-2">
            <Button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={cn(
                'flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200',
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#5C7B78] text-white hover:bg-[#4a6562] shadow-md hover:shadow-lg border border-white'
              )}
            >
              <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Prev</span>
            </Button>
  
            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNumber, index) => {
                if (pageNumber === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 md:px-3 py-2 text-gray-400 text-xs md:text-sm">
                      •••
                    </span>
                  )
                }
  
                const isActive = currentPage === pageNumber
                
                return (
                  <Button
                    key={pageNumber}
                    onClick={() => handlePageClick(pageNumber as number)}
                    className={cn(
                      'w-8 h-8 md:w-10 md:h-10 rounded-full p-0 text-xs md:text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-[#5C7B78] text-white shadow-md border border-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-[#5C7B78] hover:bg-opacity-10 hover:border-[#5C7B78]'
                    )}
                  >
                    {pageNumber}
                  </Button>
                )
              })}
            </div>
  
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={cn(
                'flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200',
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#5C7B78] text-white hover:bg-[#4a6562] shadow-md hover:shadow-lg border border-white'
              )}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </div>
        )}
      </div>
    )
  }
  
  function Step3({ formData, setFormData, setNotification }: Step3Props) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'bukti' | 'surat') => {
      const file = e.target.files?.[0]
      if (!file) return

      // Ubah batas maksimal dari 2MB ke 1MB
      if (file.size > 1 * 1024 * 1024) {
        setNotification({ message: 'Ukuran file maksimal 1MB', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
        return
      }
  
      if (type === 'surat' && file.type !== 'application/pdf') {
        setNotification({ message: 'File harus dalam format .pdf', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
        return
      }
  
      if (type === 'bukti') {
        setFormData({ ...formData, bukti_pembayaran: file })
      } else {
        setFormData({ ...formData, surat_pernyataan: file })
      }
    }
  
    return (
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Upload Bukti Pembayaran */}
          <div className="text-center md:text-left space-y-4">
            <div className="w-full md:inline-block">
              <div className="space-y-2">
                <h3 className="text-base md:text-lg font-bold text-[#5C7B78]">Upload Bukti Pembayaran</h3>
                <p className="text-xs md:text-sm text-[#5C7B78]">Format gambar - maksimal 1 MB</p>
              </div>
              
              <div className="space-y-3 mt-4">
                <Button
                  onClick={() => document.getElementById('bukti-input')?.click()}
                  className="w-full md:w-auto bg-transparent border border-[#5C7B78] text-[#5C7B78] hover:bg-[#5C7B78] hover:text-white py-3 md:py-4 px-6 md:px-8 rounded-lg font-normal text-base md:text-lg transition-colors duration-200"
                >
                  Upload File
                </Button>
                
                <input
                  id="bukti-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'bukti')}
                  className="hidden"
                />
                
                {formData.bukti_pembayaran ? (
                  <p className="text-xs md:text-sm text-green-600 font-medium break-words">
                    ✓ {formData.bukti_pembayaran.name}
                  </p>
                ) : (
                  <p className="text-xs md:text-sm text-[#D15651] italic">
                    Belum ada file yang di unggah
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Upload Surat Pernyataan */}
          <div className="text-center md:text-left space-y-4">
            <div className="w-full md:inline-block">
              <div className="space-y-2">
                <h3 className="text-base md:text-lg font-bold text-[#5C7B78]">
                  Upload Surat Pernyataan{' '}
                  <a
                    href="/pendaftaran/SURAT PERNYATAAN.docx"
                    download
                    className="text-xs md:text-sm font-normal text-blue-600 hover:underline break-words"
                  >
                    (unduh template)
                  </a>
                </h3>
                <p className="text-xs md:text-sm text-[#5C7B78]">Format .pdf - maksimal 1 MB</p>
              </div>
              
              <div className="space-y-3 mt-4">
                <Button
                  onClick={() => document.getElementById('surat-input')?.click()}
                  className="w-full md:w-auto bg-transparent border border-[#5C7B78] text-[#5C7B78] hover:bg-[#5C7B78] hover:text-white py-3 md:py-4 px-6 md:px-8 rounded-lg font-normal text-base md:text-lg transition-colors duration-200"
                >
                  Upload File
                </Button>
                
                <input
                  id="surat-input"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'surat')}
                  className="hidden"
                />
                
                {formData.surat_pernyataan ? (
                  <p className="text-xs md:text-sm text-green-600 font-medium break-words">
                    ✓ {formData.surat_pernyataan.name}
                  </p>
                ) : (
                  <p className="text-xs md:text-sm text-[#D15651] italic">
                    Belum ada file yang di unggah
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex justify-center text-[#5C7B78] mt-8 md:mt-12">
          <div className="space-y-4 w-full max-w-2xl px-4">
            <label className="flex items-start md:items-center gap-3 text-sm md:text-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.konfirmasiData}
                onChange={(e) => setFormData({ ...formData, konfirmasiData: e.target.checked })}
                className="w-5 h-5 text-[#5C7B78] border-2 border-[#5C7B78] rounded focus:ring-[#5C7B78] cursor-pointer flex-shrink-0 mt-0.5 md:mt-0"
              />
              <span className="break-words">Saya sudah mengisi semua data dengan benar</span>
            </label>
            <label className="flex items-start md:items-center gap-3 text-sm md:text-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.konfirmasiJadwal}
                onChange={(e) => setFormData({ ...formData, konfirmasiJadwal: e.target.checked })}
                className="w-5 h-5 text-[#5C7B78] border-2 border-[#5C7B78] rounded focus:ring-[#5C7B78] cursor-pointer flex-shrink-0 mt-0.5 md:mt-0"
              />
              <span className="break-words">Saya setuju mengikuti pelatihan sesuai jadwal yang dipilih</span>
            </label>
          </div>
        </div>
      </div>
    )
  }