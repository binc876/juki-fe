/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Eye, EyeClosed } from 'lucide-react'
import { api } from '@/lib/api'
import BerhasilDaftar from './BerhasilDaftar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface RegistrasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegistrasiModal({ isOpen, onClose, onSwitchToLogin }: RegistrasiModalProps) {
  const [form, setForm] = useState({ name: '', student_number: '', mobile_number: '', email: '', password: '', password_confirmation: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await api.post('/users', form, {
        withCredentials: false,
        headers: {
          "Content-Type": "application/json",
        }
      })
      console.log('✅ Registrasi sukses:', res.data)
      // Simpan token dan data user di localStorage
      localStorage.setItem('token', res.data.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.data.user))
      setShowAlert(true)
    } catch (err: any) {
      console.log('❌ Registrasi gagal:', err)
      alert(err.response?.data?.message || 'Terjadi kesalahan saat registrasi')
    } finally {
      setLoading(false)
    }
  }

  if (showAlert) {
    return <BerhasilDaftar />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !m-0 !border-none !rounded-none !bg-[#D9C8B2] !overflow-auto !z-50 !translate-x-0 !translate-y-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Registrasi</DialogTitle>

        <div className="min-h-screen flex items-center justify-center py-4 sm:py-6 md:py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 w-full">
                {/* Header */}
                <div className="flex justify-between items-center text-[#5C7B78]">
                  <span className="font-bold text-2xl sm:text-3xl md:px-12">Juki.hub</span>
                  <button onClick={onClose} className="hover:text-[#D15651] transition">
                    <X className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"/>
                  </button>
                </div>

                {/* Konten */}
                <div className="flex flex-col md:flex-row rounded-xl overflow-hidden">
                  {/* Form */}
                  <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-12 text-[#5C7B78] flex flex-col justify-center gap-3 sm:gap-4 md:gap-5">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Selangkah lebih dekat menuju kelulusan.</h1>
                    <p className="-mt-1 sm:-mt-2 md:-mt-3 text-sm sm:text-base">Daftar sekarang dan ikuti pelatihan jurnal dengan lebih mudah!</p>

                    <form className="flex flex-col gap-3 sm:gap-4" onSubmit={handleSubmit}>
                      <input
                        type="text"
                        name='name'
                        placeholder="Nama Lengkap"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-transparent border border-[#5C7B78] text-[#5C7B78] placeholder-[#5C7B78] outline-none focus:ring-2 focus:ring-[#5C7B78] text-sm sm:text-base"
                      />
                      <input
                        type="text"
                        name="student_number"
                        placeholder="Nomor Induk Mahasiswa"
                        value={form.student_number}
                        onChange={(e) => setForm({ ...form, student_number: e.target.value })}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-transparent border border-[#5C7B78] text-[#5C7B78] placeholder-[#5C7B78] outline-none focus:ring-2 focus:ring-[#5C7B78] text-sm sm:text-base"
                      />
                      <div className="flex items-center border border-[#5C7B78] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#5C7B78]">
                        <span className="px-2 sm:px-3 text-sm sm:text-base">+62</span>
                        <input
                          type="text"
                          name="mobile_number"
                          placeholder="Nomor WhatsApp"
                          value={form.mobile_number}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "")
                            if (value.startsWith("0")) {
                              value = value.slice(1)
                            }
                            setForm({ ...form, mobile_number: value })
                          }}
                          className="flex-1 px-2 sm:px-3 py-2.5 sm:py-3 bg-transparent outline-none text-sm sm:text-base"
                        />
                      </div>

                      <input
                        type="email"
                        name='email'
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-transparent border border-[#5C7B78] text-[#5C7B78] placeholder-[#5C7B78] outline-none focus:ring-2 focus:ring-[#5C7B78] text-sm sm:text-base"
                      />
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name='password'
                          placeholder="Password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-xl bg-transparent border border-[#5C7B78] text-[#5C7B78] placeholder-[#5C7B78] outline-none focus:ring-2 focus:ring-[#5C7B78] text-sm sm:text-base"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C7B78] cursor-pointer"
                        >
                          {showPassword ? <EyeClosed className="w-4 h-4 sm:w-5 sm:h-5"/> : <Eye className="w-4 h-4 sm:w-5 sm:h-5"/>}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name='password_confirmation'
                          placeholder="Konfirmasi Password"
                          value={form.password_confirmation}
                          onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-xl bg-transparent border border-[#5C7B78] text-[#5C7B78] placeholder-[#5C7B78] outline-none focus:ring-2 focus:ring-[#5C7B78] text-sm sm:text-base"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C7B78] cursor-pointer"
                        >
                          {showPassword ? <EyeClosed className="w-4 h-4 sm:w-5 sm:h-5"/> : <Eye className="w-4 h-4 sm:w-5 sm:h-5"/>}
                        </button>
                      </div>
                      <button
                        type="submit"
                        className="bg-[#5C7B78] hover:bg-[#4e6a67] text-white font-semibold py-2.5 sm:py-3 rounded-xl shadow-md transition-all text-sm sm:text-base"
                      >
                        {loading ? 'Sedang Membuat Akun...' : 'Buat Akun'}
                      </button>
                    </form>

                    <p className="text-xs sm:text-sm mt-1 sm:mt-2">
                      Sudah punya akun?{' '}
                      <button onClick={onSwitchToLogin} className="font-semibold underline text-[#5C7B78] hover:text-[#EFE3D4] transition-colors">
                        Masuk lewat sini
                      </button>
                    </p>
                  </div>

                  {/* Gambar */}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}