'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import SubmitJurnalModal from "@/components/pelatihan/SubmitJurnalModal"
import { UserTicket } from "@/lib/types"
import { Clock, CheckCircle2 } from "lucide-react"

interface SubmitJurnalSectionProps {
  activeTicket: UserTicket | null;
  onSubmitJurnal: () => void;
}

export default function SubmitJurnalSection({ activeTicket, onSubmitJurnal }: SubmitJurnalSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isApproved = activeTicket?.approved_by_admin_at !== null;
  const hasSubmittedJurnal = activeTicket?.user_ticket_detail?.article_path !== null;

  // Case 1: Registration is not approved by admin yet.
  if (!isApproved) {
    return (
      <div className="text-center mt-20 animate-fade-in bg-white/90 text-[#3d5754] max-w-lg mx-auto p-8 rounded-xl shadow-lg">
        <Clock className="mx-auto mb-4 text-yellow-600" size={48} />
        <h2 className="text-2xl font-bold mb-2">Pendaftaranmu Belum Terverifikasi</h2>
        <p className="text-lg">Tunggu yaa.. Pendaftaranmu masih diverifikasi oleh Tim Jupalo.</p>
        <p className="text-sm mt-4 text-gray-500">Kamu bisa melanjutkan ke tahap ini setelah pendaftaran disetujui.</p>
      </div>
    )
  }

  // Case 2: Approved, but has already submitted the journal.
  if (hasSubmittedJurnal) {
    return (
      <div className="text-center mt-20 animate-fade-in bg-white/90 text-[#3d5754] max-w-lg mx-auto p-8 rounded-xl shadow-lg">
        <CheckCircle2 className="mx-auto mb-4 text-green-600" size={48} />
        <h2 className="text-3xl font-bold mb-4">Artikel Telah Dikirim</h2>
        <p className="text-lg">Artikel kamu sudah berhasil di-submit dan sedang menunggu untuk direview.</p>
      </div>
    )
  }

  // Case 3: Approved and ready to submit journal.
  return (
    <>
      <div className="text-center mt-20 animate-fade-in">
        <h2 className="text-3xl font-bold mb-4">Upload Artikel Kamu</h2>
        <p className="text-lg mb-6">Pendaftaranmu telah disetujui! Sekarang, silakan upload artikel kamu.</p>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#F5F3EC] text-[#5C7B78] hover:bg-gray-200 font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
        >
          Upload Artikel
        </Button>
      </div>

      <SubmitJurnalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          onSubmitJurnal();
        }}
        activeTicket={activeTicket}
      />
    </>
  )
}
