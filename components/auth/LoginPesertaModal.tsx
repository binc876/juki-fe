/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Eye, EyeClosed } from 'lucide-react'
import Image from 'next/image'
import { api, getErrorMessage } from '@/lib/api'
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGeneralError('')

    const newErrors: Record<string, string> = {}
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    
    if (!emailRegex.test(form.email)) {
      newErrors.email = 'Format email tidak valid (contoh: user@domain.com)!'
    }
    if (!form.password) {
      newErrors.password = 'Password harus diisi!'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const res = await api.post('/auth/login', form)
      console.log('✅ Login sukses:', res.data)

      const { accessToken, refreshToken } = res.data
      
      // Simpan token di localStorage
      localStorage.setItem('token', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      // Decode token untuk cek role
      try {
        const base64Url = accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        const roles = payload.roles || [];

        if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
           router.push('/admin');
        } else {
           // Default User
           router.push('/beranda');
        }
      } catch (decodeError) {
        console.error('Gagal decode token:', decodeError);
        // Fallback jika gagal decode
        router.push('/beranda');
      }

      // Ambil data user setelah login (background process)
      try {
        const userRes = await api.get('/profiles/me')
        localStorage.setItem('user', JSON.stringify(userRes.data))
      } catch (userError) {
        console.error('Gagal mengambil data user:', userError)
      }

      onClose();
    } catch (err: any) {
      // Gunakan helper standar untuk pesan error
      setGeneralError(getErrorMessage(err));
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !m-0 !border-none !rounded-none !bg-[#A5ADA1] !overflow-y-auto !z-50 !translate-x-0 !translate-y-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Login Peserta</DialogTitle>

        {/* Main Content Wrapper */}
        <div className="min-h-full flex flex-col items-center justify-start md:justify-center p-4 sm:p-6 md:p-12">
          <div className="w-full max-w-6xl my-auto">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 sm:mb-8 px-4 md:px-12">
              <span className="font-bold text-3xl sm:text-4xl text-white">Juki.hub</span>
              <button
                onClick={onClose}
                className="text-white hover:text-[#D15651] transition-all duration-300 p-1"
              >
                <X className="w-10 h-10 stroke-2" />
              </button>
            </div>

            {/* Content Container */}
            <div className="w-full flex flex-col md:flex-row">
              {/* Left Side - Form */}
              <div className="w-full md:w-1/2 px-6 sm:px-10 md:px-16 py-10 flex flex-col justify-center text-white">
                <div className="max-w-md mx-auto md:mx-0 w-full space-y-6">
                  <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                      Selamat Datang Kembali di Juki.hub!
                    </h1>
                    <p className="text-white/80 text-base sm:text-lg">
                      Login dulu, baru bisa lanjut ikut pelatihan.
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                    <div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-transparent border text-white placeholder-white/60 outline-none focus:ring-2 transition-colors text-sm sm:text-base ${
                          errors.email 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-white focus:ring-white'
                        }`}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email}</p>}
                    </div>

                    <div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-xl bg-transparent border text-white placeholder-white/60 outline-none focus:ring-2 transition-colors text-sm sm:text-base ${
                            errors.password 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-white focus:ring-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EFE3D4] hover:text-white cursor-pointer transition-colors"
                        >
                          {showPassword ? <EyeClosed className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password}</p>}
                    </div>

                    {generalError && (
                      <p className='text-red-500 text-xs sm:text-sm font-semibold'>{generalError}</p>
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