/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, Eye, EyeClosed } from 'lucide-react'
import Image from 'next/image'
import { api } from '@/lib/api'

export default function LoginAdmin() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')



  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')

  try {
    const res = await api.post('/authentication', form, {
      headers: { "Content-Type": "application/json" }
    })

    if (res.data.status === 200) {
      const user = res.data.data.user
      const token = res.data.data.token

      // simpan ke localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      // cek role user
      const isAdmin = user.roles?.some((r: any) => r.name === 'admin' || r.pivot.role_id === 1)
      if (!isAdmin) {
        setError('Akses ditolak! Bukan admin.')
        return
      }

      router.push('/admin/dashboard')
    } else {
      setError(res.data.message || 'Login gagal')
    }
  } catch (err: any) {
    if (err.response?.status === 401) {
      setError('Email atau password salah!')
    } else {
      setError('Terjadi kesalahan. Coba lagi nanti.')
    }
  }
}


  return (
    <>
    <main className="min-h-screen flex items-center justify-center bg-[#A5ADA1] px-4 py-8">
      <div className='max-w-5xl mx-auto space-y-8'>
      {/* Header bar */}
        <div className="flex justify-between items-center text-white">
          <span className="font-bold text-3xl md:px-12">Jupalo.</span>
          <Link href="/">
            <X className="w-8 h-8 hover:text-[#D15651] transition"/>
          </Link>
        </div>
      <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-xl overflow-hidden relative">
        {/* Form Login */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center gap-6 bg-[#A5ADA1] text-white">
          <h1 className="text-4xl sm:text-3xl md:text-4xl font-bold">Selamat Datang Kembali di Jupalo!</h1>
          <p className="text-m sm:text-base text-white/90 -mt-4">Hai Admin, login dulu yuk!</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-4 py-3 rounded-xl bg-transparent border border-white text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 pr-10 rounded-xl bg-transparent border border-white text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white"
              />
              {error && <p className='text-red-500 text-sm'>{error}</p>}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EFE3D4] cursor-pointer"
              >
                {showPassword ? <EyeClosed/> : <Eye/>}
              </button>
            </div>
            <button
              type="submit"
              className="bg-[#5C7B78] hover:bg-[#4e6a67] text-white font-semibold py-3 rounded-xl shadow-md transition-all"
            >
              Masuk
            </button>
          </form>

        </div>
        {/* Gambar Kanan */}
        <div className="hidden md:block w-1/2">
          <Image
            src="/hero-dashboard.png"
            alt="Gedung"
            width={800}
            height={800}
            className="object-cover w-full h-full rounded-l-xl"
          />
        </div>
      </div>
      </div>
    </main>
    </>
  )
}
