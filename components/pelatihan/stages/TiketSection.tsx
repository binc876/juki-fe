'use client'

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { UserTicket } from "@/lib/types"
import { Copy, Clock } from "lucide-react"
import KonfirmasiPembayaranModal from "@/components/modal/KonfirmasiPembayaranModal"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'

interface TiketSectionProps {
  activeTicket: UserTicket | null;
  onNavigate: (stage: number) => void;
  onOpenPembayaranModal: (userTicketId: string) => void;
}

export default function TiketSection({ activeTicket, onNavigate, onOpenPembayaranModal }: TiketSectionProps) {
  const [openModal, setOpenModal] = useState(false)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const [showSuccessState, setShowSuccessState] = useState(false)
  const router = useRouter()

  const handlePaymentSubmit = (file: File) => {
    console.log('File dikirim:', file)
    // TODO: Send file to API
    setPaymentSubmitted(true)
    setOpenModal(false)
  }

  // Simulate payment verification after 4 seconds (for slicing only)
  useEffect(() => {
    if (paymentSubmitted && !showSuccessState) {
      const timer = setTimeout(() => {
        setShowSuccessState(true)
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [paymentSubmitted, showSuccessState])

  // Check if payment is verified by admin
  const isPaymentVerified = activeTicket?.invoice?.status === 'settlement'

  // Show success state when payment is verified OR after 4 second delay (for slicing)
  if (isPaymentVerified || showSuccessState) {
    return (
      <div className="flex flex-col items-center justify-center mt-10 animate-fade-in-up min-h-[400px]">
        <div className="bg-[#F5F3EC] rounded-full w-32 h-32 flex items-center justify-center mb-6 shadow-lg">
          <svg 
            className="w-16 h-16 text-[#5C7B78]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={3} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        <h2 className="text-4xl font-bold mb-4 text-center text-[#F5F3EC]">
          Pembayaran Sukses!
        </h2>
        
        <p className="text-center text-[#F5F3EC] max-w-md text-lg leading-relaxed">
          Yeay! Pembayaran kamu sudah di verifikasi admin, 
          silahkan lanjut untuk Daftar Pelatihan.
        </p>
      </div>
    )
  }

  // Show waiting state after payment submission
  if (paymentSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center mt-10 animate-fade-in-up min-h-[400px]">
        <div className="bg-[#F5F3EC] rounded-full w-32 h-32 flex items-center justify-center mb-6 shadow-lg">
          <Clock className="w-16 h-16 text-[#5C7B78]" />
        </div>
        
        <h2 className="text-4xl font-bold mb-4 text-center text-[#F5F3EC]">
          Terima Kasih!
        </h2>
        
        <p className="text-center text-[#F5F3EC] max-w-md text-lg leading-relaxed">
          Konfirmasi pembayaran kamu sudah kami terima, 
          mohon tunggu verifikasi dari admin untuk dapat 
          lanjut ke proses selanjutnya.
        </p>
      </div>
    )
  }

  // Original payment info display
  return (
    <div className="flex flex-col items-center mt-10 animate-fade-in-up">
      <h2 className="text-3xl font-bold mb-6 text-center">Informasi Pembayaran</h2>
      <Card
        onClick={() => onNavigate(2)}
        className="bg-white/90 rounded-xl shadow-lg w-full max-w-4xl cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      >
        <CardHeader>
          {/* Total Payment */}
          <div className="mb-2">
            <p className="text-center text-base sm:text-lg font-semibold mb-1 sm:mb-2">
              Total Pembayaran
            </p>
            <p className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-[#5C7B78] break-words px-2">
              Rp 150.000
            </p>
            <hr className="my-4 sm:my-6 border-t border-gray-300/50" />
          </div>
        </CardHeader>
        <CardContent className="flex items-start p-6 sm:p-8">
          {/* Payment Info Section */}
          <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-5 md:gap-6 mb-6">
            {/* VA Card */}
            <div className="bg-[#ECEDDA] border-2 border-[#5C7B78] rounded-xl p-5 w-full lg:flex-1">
              {/* Bank Logo & Name */}
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex-shrink-0">
                  <Image
                    src="https://jasalogocepat.com/wp-content/uploads/2023/12/Logo-Bank-BNI-PNG-1024x334.png"
                    alt=""
                    width={120}
                    height={40}
                    unoptimized
                  />
                </div>
                <p className="font-bold text-sm sm:text-base md:text-sm uppercase leading-tight">
                  Bank Negara Indonesia
                </p>
              </div>

              {/* VA Number Label */}
              <p className="text-xs sm:text-sm text-[#5C7B78]/70 mb-1 sm:mb-2">
                Nomor virtual akun
              </p>
              {/* VA Number with Copy Button */}
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-[#5C7B78]/20">
                <p className="font-bold text-base sm:text-sm md:text-sm tracking-wider break-all flex-1">
                  123456789011
                </p>
                <button
                  className="flex-shrink-0 p-2 rounded-md
                              text-[#5C7B78]
                              hover:bg-[#5C7B78]/10
                              active:bg-[#5C7B78]/20
                              active:scale-95
                              transition-all"
                  aria-label="Copy virtual account number"
                >
                  <Copy className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-[#5C7B78]/70 mb-1 sm:mb-2">
                Atas Nama <b>Jurnal Ekonomi Pembangunan</b>
              </p>
            </div>

            {/* Instructions */}
            <div className="w-full lg:flex-1 bg-gray-50 lg:bg-transparent rounded-lg lg:rounded-none p-3 sm:p-4 lg:p-0">
              <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">
                Cara Pembayaran:
              </h3>
              <ol className="list-decimal pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 text-xs sm:text-sm leading-relaxed">
                <li>Lakukan pembayaran ke Nomor Rekening BNI sejumlah nominal diatas</li>
                <li>Kirim bukti pembayaran melalui tombol dibawah</li>
                <li>Tunggu verifikasi admin untuk proses selanjutnya</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
      <Button 
        className="bg-[#5C7B78] font-semibold text-lg py-6 px-10 rounded-xl shadow-md m-4" 
        onClick={() => setOpenModal(true)}
      >
        Kirim Bukti Bayar
      </Button>
      <KonfirmasiPembayaranModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  )
}