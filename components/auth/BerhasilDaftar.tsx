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

export default function BerhasilDaftar() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  const [isOpen] = useState(true)

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    const redirectTimeout = setTimeout(() => {
      router.push('/tiketku')
    }, 5000)

    return () => {
      clearInterval(countdownInterval)
      clearTimeout(redirectTimeout)
    }
  }, [router])

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="text-green-600 text-xl">Registrasi Berhasil!</DialogTitle>
          <DialogDescription className="text-base mt-2">
            🎉 Selamat datang di <strong>Jupalo</strong>!<br />
            Kamu akan diarahkan ke halaman <strong>Tiketku</strong> dalam {countdown} detik.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
