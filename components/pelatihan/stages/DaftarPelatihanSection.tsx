'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DaftarPelatihanModal from "@/components/pelatihan/DaftarPelatihanModal"
import { User, UserTicket } from "@/lib/types"
import { CheckCircle2, Clock } from "lucide-react"
import { api } from "@/lib/api"

interface DaftarPelatihanSectionProps {
  activeTicket: UserTicket | null;
  onRegistrationSuccess: () => void;
}

export default function DaftarPelatihanSection({ activeTicket, onRegistrationSuccess }: DaftarPelatihanSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<User>();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) return;

    const parsedUser = JSON.parse(userData);

    api.get(`/authentication/${parsedUser.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      setUserData(res.data.data);
    })
    .catch((err) => {
      console.error("Gagal ambil data akun", err);
    });
  }, []);

  if (activeTicket?.invoice?.status !== 'settlement') {
    return (
      <div className="text-center mt-20">
        <h2 className="text-3xl font-bold mb-4">Daftar Pelatihan</h2>
        <p className="text-yellow-200 mb-4">Selesaikan pembayaran tiket pada tahap sebelumnya untuk dapat mendaftar pelatihan.</p>
        <Button
          onClick={() => router.push('/tiketku')}
          className="bg-[#F5F3EC] text-[#5C7B78] hover:bg-gray-200 font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
        >
          Beli Tiket
        </Button>
      </div>
    )
  }

  if (activeTicket.training_schedule_id === null) {
    return (
      <>
        <div className="text-center mt-20 animate-fade-in">
            <h2 className="text-3xl font-bold mb-4">Gass daftar pelatihan!</h2>
            <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#F5F3EC] text-[#5C7B78] hover:bg-gray-200 font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
            >
                Daftar Pelatihan
            </Button>
        </div>
        <DaftarPelatihanModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
                setIsModalOpen(false);
                onRegistrationSuccess();
            }}
            userTicketId={activeTicket.id}
        />
      </>
    )
  }

  const isApproved = activeTicket.approved_by_admin_at !== null;
  const schedule = activeTicket.training_schedule;
  const userDetails = activeTicket.user_ticket_detail;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const userName = userData?.name || 'Memuat...';
  const userNim = userData?.student_number || 'Memuat...';
  const userEmail = userData?.email || 'Memuat...';
  const userWhatsapp = userData?.mobile_number || 'Memuat...';

  return (
    <div className="mt-10 animate-fade-in space-y-8">
      <h2 className="text-3xl font-bold text-center">Ringkasan Pendaftaranmu</h2>
      
      <Card className="max-w-2xl mx-auto bg-white/90 text-[#3d5754] shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status Pendaftaran</span>
            <span className={`flex items-center gap-2 text-lg font-semibold ${isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
              {isApproved ? <CheckCircle2 size={24} /> : <Clock size={24} />}
              {isApproved ? 'Disetujui' : 'Menunggu Verifikasi'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-lg">
            {isApproved
              ? "Pendaftaranmu telah disetujui oleh admin. Silakan lanjutkan ke tahap berikutnya."
              : "Pendaftaranmu sedang dalam proses verifikasi oleh tim Jupalo. Mohon ditunggu ya."
            }
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="bg-white/90 text-[#3d5754] shadow-lg">
          <CardHeader>
            <CardTitle>Data Peserta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-gray-500 text-sm">Nama Lengkap</p>
              <p className="text-md">{userName}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500 text-sm">NIM</p>
              <p className="text-md">{userNim}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500 text-sm">Email</p>
              <p className="text-md">{userEmail}</p>
            </div>
             <div>
              <p className="font-semibold text-gray-500 text-sm">No. Whatsapp</p>
              <p className="text-md">+62 {userWhatsapp}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 text-[#3d5754] shadow-lg">
          <CardHeader>
            <CardTitle>Detail Pendaftaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-gray-500 text-sm">Judul Artikel</p>
              <p className="text-md">{userDetails?.article_title || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500 text-sm">Jadwal Pilihan</p>
              <p className="text-md">{formatDate(schedule?.started_at)} ({schedule?.location || 'N/A'})</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500 text-sm">Dokumen Terunggah</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <a href={userDetails?.payment_evidence_url || '#'} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">
                    Bukti Pembayaran
                  </a>
                </li>
                <li>
                  <a href={userDetails?.statement_letter_url || '#'} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">
                    Surat Pernyataan
                  </a>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}