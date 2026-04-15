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

  useEffect(() => {
    if (countdown <= 0) {
      if (onSwitchToLogin) {
        onSwitchToLogin()
      } else {
        router.push('/')
      }
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown, onSwitchToLogin, router])

  return (
    <Dialog open={true} onOpenChange={() => onSwitchToLogin?.()}>
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
