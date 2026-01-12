'use client' // 🚨 ini WAJIB agar useRouter() bisa dipakai!

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface BerhasilDaftarProps {
  onSwitchToLogin?: () => void;
}

export default function BerhasilDaftar({ onSwitchToLogin }: BerhasilDaftarProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  const [isOpen] = useState(true)

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    const redirectTimeout = setTimeout(() => {
      if (onSwitchToLogin) {
        onSwitchToLogin()
      } else {
        // Fallback if no handler provided
        router.push('/')
      }
    }, 5000)

    return () => {
      clearInterval(countdownInterval)
      clearTimeout(redirectTimeout)
    }
  }, [router, onSwitchToLogin])

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="text-green-600 text-xl">Registrasi Berhasil!</DialogTitle>
          <DialogDescription className="text-base mt-2">
            🎉 Akunmu berhasil dibuat.<br />
            Kamu akan diarahkan ke halaman <strong>Login</strong> dalam {countdown} detik.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
