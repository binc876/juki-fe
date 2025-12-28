'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserTicket } from "@/lib/types"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"
import UpdateSubmissionEvidenceModal from "@/components/pelatihan/UpdateSubmissionEvidenceModal"

interface ReviewJurnalSectionProps {
  activeTicket: UserTicket | null;
  onUploadRevisi: () => void;
  onNavigate: (stage: number) => void;
}

export default function ReviewJurnalSection({ activeTicket, onUploadRevisi, onNavigate }: ReviewJurnalSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const detail = activeTicket?.user_ticket_detail;

  const isReviewApproved = detail?.article_revision_status === 'approved';
  const isRevisionNeeded = detail?.article_revision_status === 'revise';
  const isPendingReview = detail?.article_revision_status === 'pending';

  // 1. Review Approved -> Success
  if (isReviewApproved) {
    return (
        <div className="text-center mt-20 animate-fade-in-up space-y-6">
            <CheckCircle2 className="mx-auto text-green-400" size={64} />
            <h2 className="text-3xl font-bold text-white">Artikelmu sudah dinyatakan valid oleh tim Jupalo.</h2>
            <p className="text-white/80">Kamu bisa melanjutkan ke tahap akhir untuk melihat LOA kamu.</p>
            <Button onClick={() => onNavigate(6)} className="bg-white text-black font-bold py-3 px-8 rounded-lg text-lg">Lanjutkan ke LOA</Button>
        </div>
    );
  }

  // 2. Revision is needed
  if (isRevisionNeeded) {
    return (
      <>
        <UpdateSubmissionEvidenceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            onUploadRevisi(); // This refreshes the parent component's data
          }}
          activeTicket={activeTicket}
        />
        <div className="text-center mt-10 animate-fade-in-up max-w-2xl mx-auto">
            <AlertCircle className="mx-auto text-yellow-400" size={64} />
            <h2 className="text-3xl font-bold text-white my-4">Artikel Kamu Butuh Revisi</h2>
            
            <div className="bg-white/10 p-6 rounded-lg mb-6">
                <h3 className="font-bold text-lg mb-2">Catatan dari Admin:</h3>
                <p className="text-white/90 italic">Silakan periksa kembali artikel Anda dan pastikan sudah sesuai dengan panduan.</p>
            </div>

            <p className="text-white/80 mb-6">Silakan perbaiki artikelmu sesuai catatan di atas dan unggah kembali file Artikel yang sudah direvisi.</p>

            <Button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg text-lg"
            >
              Upload Bukti Submit Artikel
            </Button>
        </div>
      </>
    );
  }

  // 3. Default: Pending Review (or any other status)
  return (
    <div className="text-center mt-20 animate-fade-in-up space-y-4 bg-white/90 text-[#3d5754] max-w-lg mx-auto p-8 rounded-xl shadow-lg">
        <Clock className="mx-auto" size={48} />
        <h2 className="text-2xl font-bold mb-2">
          {isPendingReview ? 'Artikel Sedang Direview' : 'Menunggu Status Artikel'}
        </h2>
        <p>
          {isPendingReview 
            ? 'Tunggu yaa, artikel kamu sedang dalam proses review oleh Tim Jupalo.'
            : 'Status artikel Anda akan diperbarui di sini.'
          }
        </p>
    </div>
  );
}