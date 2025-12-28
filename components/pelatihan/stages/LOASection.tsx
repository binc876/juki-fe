'use client'

import { UserTicket } from "@/lib/types"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

interface LOASectionProps {
  activeTicket: UserTicket | null;
}

export default function LOASection({ activeTicket }: LOASectionProps) {
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserName(user?.name || user?.nama_lengkap || 'Peserta')
  }, [])

  if (!activeTicket || !activeTicket.user_ticket_detail) {
    return (
      <div className="text-center mt-20 animate-fade-in-up space-y-4">
        <p className="text-white/80">Data pelatihan tidak ditemukan.</p>
      </div>
    );
  }

  const handleDownloadLoa = async () => {
    if (!activeTicket) return;
    setLoading(true);
    try {
      const response = await api.get(`/user-tickets/${activeTicket.id}/generate-loa`, {
        responseType: 'blob', // Important for file downloads
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `LOA_${userName}.pdf`; // Generic fallback filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(`/filename="(.+)"/`);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Gagal mengunduh LOA:", error);
      alert("Gagal mengunduh LOA. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const detail = activeTicket.user_ticket_detail;
  const isLoaAvailable = detail.loa_path !== null;

  // State 1: LOA is not available yet
  if (!isLoaAvailable) {
    return (
      <div className="text-center mt-20 animate-fade-in-up space-y-4">
        <div className="relative w-32 h-32 mx-auto">
          <Image src="/centang-gelap.png" alt="Checkmark" layout="fill" objectFit="contain" />
        </div>
        <h2 className="text-3xl font-bold text-white">Artikelmu sudah dinyatakan valid oleh tim Jupalo.</h2>
        <p className="text-white/80">Kamu tinggal menunggu penerbitan LOA.</p>
      </div>
    );
  }

  // State 2: LOA is available for download
  return (
    <div className="text-center mt-20 animate-fade-in-up space-y-6">
      <div className="relative w-32 h-32 mx-auto">
        <Image src="/centang-gelap.png" alt="Checkmark" layout="fill" objectFit="contain" />
      </div>
      <h2 className="text-3xl font-bold text-white">LOA Kamu Telah Terbit!</h2>
      <p className="text-white/80 max-w-2xl mx-auto">
        Selamat! Kamu telah menyelesaikan seluruh rangkaian pelatihan dan dinyatakan lolos. LOA (Letter of Acceptance) untuk keperluan syarat kelulusanmu sudah tersedia dan bisa kamu unduh kapan saja.
      </p>

      <Button
        onClick={handleDownloadLoa}
        disabled={loading}
        className="bg-[#5C7B78] hover:bg-[#4a6664] text-white font-bold py-3 px-8 rounded-lg text-lg"
      >
        {loading ? 'Mengunduh...' : 'Unduh LOA'}
      </Button>
    </div>
  );
}