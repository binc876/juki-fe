'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const IDLE_LIMIT = 30 * 60 * 1000; // 30 Menit

export default function IdleTimer() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      // Jika modal sudah muncul, jangan reset
      if (showModal) return;

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Cek apakah user sedang login
        if (localStorage.getItem('token')) {
          handleIdle();
        }
      }, IDLE_LIMIT);
    };

    const handleIdle = () => {
      setShowModal(true);
      // Hapus token
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    };

    // Event listeners
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('click', resetTimer);

    // Init timer
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [showModal]);

  const handleLoginRedirect = () => {
    setShowModal(false);
    router.push('/'); // Asumsi homepage adalah login page atau landing page
  };

  return (
    <Dialog open={showModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sesi Berakhir</DialogTitle>
          <DialogDescription>
            Anda telah tidak aktif selama 30 menit. Demi keamanan, Anda telah dikeluarkan otomatis.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleLoginRedirect} className="bg-[#5C7B78] text-white">
            Login Kembali
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
