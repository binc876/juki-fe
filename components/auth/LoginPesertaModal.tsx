/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Eye, EyeClosed } from 'lucide-react'
import Image from 'next/image'
import { api } from '@/lib/api'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface LoginPesertaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegistrasi: () => void;
}

export default function LoginPesertaModal({ isOpen, onClose, onSwitchToRegistrasi }: LoginPesertaModalProps) {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await api.post('/authentication', form, {
        withCredentials: false,
        headers: {
          "Content-Type": "application/json",
        }
      })
      console.log('✅ Login sukses:', res.data)

      // Simpan token dan data user di localStorage
      localStorage.setItem('token', res.data.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.data.user))

      router.push('/beranda')
      onClose();
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Email atau password salah!')
      } else {
        setError('Terjadi kesalahan. Coba lagi nanti.')
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !m-0 !border-none !rounded-none !bg-[#A5ADA1] !overflow-hidden !z-50 !translate-x-0 !translate-y-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Login Peserta</DialogTitle>

        {/* Full screen overlay */}
        <div className="absolute inset-0 w-full h-full overflow-y-auto">
          {/* Main Content - Centered Card */}
          <div className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">

            {/* Header di luar container */}
            <div className="w-full max-w-6xl flex justify-between items-start mb-3 sm:mb-4 px-2 sm:px-4 md:ml-16">
              <span className="font-bold text-2xl sm:text-3xl md:text-4xl text-white">Juki.hub</span>
              <button
                onClick={onClose}
                className="text-gray-300 hover:text-white transition-colors p-1"
              >
                <X className="w-8 h-8 sm:w-10 sm:h-10 md:w-15 md:h-15 stroke-2" />
              </button>
            </div>

            {/* Container utama tanpa rounded dan shadow */}
            <div className="overflow-hidden max-w-6xl w-full flex flex-col md:flex-row relative">

              {/* Left Side - Form */}
              <div className="w-full md:w-1/2 bg-[#A5ADA1] px-6 sm:px-10 md:px-16 py-8 md:py-0 flex flex-col justify-center text-white relative">
                <div className="max-w-md mx-auto md:mx-0 w-full">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 leading-tight">
                    Selamat Datang Kembali di Juki.hub!
                  </h1>
                  <p className="text-white/90 mb-4 sm:mb-6 text-sm sm:text-base">
                    Login dulu, baru bisa lanjut ikut pelatihan.
                  </p>

                  <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                    <div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-transparent border border-white text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white transition-colors text-sm sm:text-base"
                        required
                      />
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-xl bg-transparent border border-white text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white transition-colors text-sm sm:text-base"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EFE3D4] hover:text-white cursor-pointer transition-colors"
                      >
                        {showPassword ? <EyeClosed className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>

                    {error && (
                      <p className='text-red-500 text-xs sm:text-sm'>{error}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-[#5C7B78] hover:bg-[#4e6a67] text-white font-semibold py-2.5 sm:py-3 rounded-xl shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                    >
                      Masuk
                    </button>
                  </form>

                  <p className="text-xs sm:text-sm mt-3 sm:mt-4 text-white/90 text-left">
                    Belum punya akun?{' '}
                    <button
                      onClick={onSwitchToRegistrasi}
                      className="font-semibold underline text-white hover:text-[#5C7B78] transition-colors"
                    >
                      Daftar dulu kuy!
                    </button>
                  </p>
                </div>
              </div>

              {/* Right Side - Image */}
              <div className="hidden md:block w-1/2">
                <Image
                  src="/hero-dashboard.png"
                  alt="Gedung"
                  width={800}
                  height={800}
                  className="object-cover w-full h-full rounded-4xl"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}