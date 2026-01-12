/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Eye, EyeClosed } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import BerhasilDaftar from './BerhasilDaftar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface RegistrasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegistrasiModal({ isOpen, onClose, onSwitchToLogin }: RegistrasiModalProps) {
  const [form, setForm] = useState({ 
    name: '', 
    student_number: '', 
    mobile_number: '', 
    email: '', 
    password: '', 
    password_confirmation: '',
    birthPlace: '',
    birthDate: '',
    gender: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [loading, setLoading] = useState(false)

  const [generalError, setGeneralError] = useState('')

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) newErrors.name = 'Nama lengkap harus diisi!'
    
    if (form.student_number.length < 5) newErrors.student_number = 'NIM tidak valid (min. 5 karakter)!'
    
    if (form.mobile_number.length < 9) newErrors.mobile_number = 'Nomor WhatsApp tidak valid (min. 9 angka)!'
    
    if (!form.birthPlace.trim()) newErrors.birthPlace = 'Tempat lahir harus diisi!'

    if (!form.birthDate) newErrors.birthDate = 'Tanggal lahir harus diisi!'

    if (!form.gender) newErrors.gender = 'Jenis kelamin harus dipilih!'

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) newErrors.email = 'Format email tidak valid!'
    
    // Validasi Password Kompleks
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
    if (!form.password) {
       newErrors.password = 'Password harus diisi!'
    } else if (!passwordRegex.test(form.password)) {
       newErrors.password = 'Password harus mengandung huruf besar, kecil, angka, dan simbol!'
    }
    
    if (form.password !== form.password_confirmation) newErrors.password_confirmation = 'Password tidak cocok!'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')

    if (!validate()) return

    setLoading(true)

    try {
      const payload = {
        fullName: form.name,
        nim: form.student_number,
        phone: `0${form.mobile_number}`,
        email: form.email,
        password: form.password,
        birthPlace: form.birthPlace,
        birthDate: new Date(form.birthDate).toISOString(), // Ensure ISO string
        gender: form.gender
      }

      const res = await api.post('/auth/register', payload, {
        withCredentials: false,
        headers: {
          "Content-Type": "application/json",
        }
      })
      console.log('✅ Registrasi sukses:', res.data)
      
      // Backend sekarang hanya mengembalikan message sukses, user harus login manual.
      setShowAlert(true)
    } catch (err: any) {
      console.log('❌ Registrasi gagal:', err)
      setGeneralError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (showAlert) {
    return <BerhasilDaftar onSwitchToLogin={onSwitchToLogin} />;
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
                      <div>
                        <input
                          type="text"
                          name='name'
                          placeholder="Nama Lengkap"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-transparent border text-[#5C7B78] placeholder-[#5C7B78] outline-none focus:ring-2 text-sm sm:text-base ${
                            errors.name 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-[#5C7B78] focus:ring-[#5C7B78]'
                          }`}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>

                      <div>
                        <input
                          type="text"
                          name="student_number"
                          placeholder="Nomor Induk Mahasiswa"
                          value={form.student_number}
                          onChange={(e) => setForm({ ...form, student_number: e.target.value })}
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-transparent border text-[#5C7B78] placeholder-[#5C7B78] outline-none focus:ring-2 text-sm sm:text-base ${
                            errors.student_number 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-[#5C7B78] focus:ring-[#5C7B78]'
                          }`}
                        />
                         {errors.student_number && <p className="text-red-500 text-xs mt-1">{errors.student_number}</p>}
                      </div>

                      <div>
                        <div className={`flex items-center border rounded-xl overflow-hidden focus-within:ring-2 ${
                            errors.mobile_number 
                              ? 'border-red-500 focus-within:ring-red-500' 
                              : 'border-[#5C7B78] focus-within:ring-[#5C7B78]'
                          }`}>
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
                        {errors.mobile_number && <p className="text-red-500 text-xs mt-1">{errors.mobile_number}</p>}
                      </div>

                      {/* Baris Tempat & Tanggal Lahir */}
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="w-full sm:w-1/2">
                          <input
                            type="text"
                            name="birthPlace"
                            placeholder="Tempat Lahir"
                            value={form.birthPlace}
                            onChange={(e) => setForm({ ...form, birthPlace: e.target.value })}
                            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-transparent border text-[#5C7B78] placeholder-[#5C7B78] outline-none focus:ring-2 text-sm sm:text-base ${
                              errors.birthPlace
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-[#5C7B78] focus:ring-[#5C7B78]'
                            }`}
                          />
                          {errors.birthPlace && <p className="text-red-500 text-xs mt-1">{errors.birthPlace}</p>}
                        </div>
                        
                        <div className="w-full sm:w-1/2 relative">
                          <input
                            type={form.birthDate ? "date" : "text"}
                            name="birthDate"
                            placeholder="Tanggal Lahir"
                            onFocus={(e) => (e.target.type = "date")}
                            onBlur={(e) => {
                              if (!e.target.value) e.target.type = "text";
                            }}
                            value={form.birthDate}
                            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-transparent border text-[#5C7B78] placeholder-[#5C7B78] outline-none focus:ring-2 text-sm sm:text-base ${
                              errors.birthDate
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-[#5C7B78] focus:ring-[#5C7B78]'
                            }`}
                          />
                          {/* Icon Kalender (Optional Visual Cue) */}
                          {!form.birthDate && (
                             <div className="absolute right-4 top-3 pointer-events-none text-[#5C7B78]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                             </div>
                          )}
                          {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
                        </div>
                      </div>

                      {/* Dropdown Gender */}
                      <div>
                        <select
                          name="gender"
                          value={form.gender}
                          onChange={(e) => setForm({ ...form, gender: e.target.value })}
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-transparent border text-[#5C7B78] outline-none focus:ring-2 text-sm sm:text-base ${
                            errors.gender
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-[#5C7B78] focus:ring-[#5C7B78]'
                          }`}
                        >
                          <option value="" disabled className="text-gray-400">Pilih Jenis Kelamin</option>
                          <option value="MALE" className="text-gray-800">Laki-laki</option>
                          <option value="FEMALE" className="text-gray-800">Perempuan</option>
                        </select>
                         {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                      </div>

                      <div>
                        <input
                          type="email"
                          name='email'
                          placeholder="Email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-transparent border text-[#5C7B78] placeholder-[#5C7B78] outline-none focus:ring-2 text-sm sm:text-base ${
                            errors.email 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-[#5C7B78] focus:ring-[#5C7B78]'
                          }`}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name='password'
                            placeholder="Password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-xl bg-transparent border text-[#5C7B78] placeholder-[#5C7B78] outline-none focus:ring-2 text-sm sm:text-base ${
                              errors.password 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-[#5C7B78] focus:ring-[#5C7B78]'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C7B78] cursor-pointer"
                          >
                            {showPassword ? <EyeClosed className="w-4 h-4 sm:w-5 sm:h-5"/> : <Eye className="w-4 h-4 sm:w-5 sm:h-5"/>}
                          </button>
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                      </div>

                      <div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name='password_confirmation'
                            placeholder="Konfirmasi Password"
                            value={form.password_confirmation}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm({ ...form, password_confirmation: val });
                              // Real-time validation
                              if (val !== form.password) {
                                setErrors(prev => ({ ...prev, password_confirmation: 'Password tidak cocok!' }));
                              } else {
                                setErrors(prev => {
                                  const newErr = { ...prev };
                                  delete newErr.password_confirmation;
                                  return newErr;
                                });
                              }
                            }}
                            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-xl bg-transparent border text-[#5C7B78] placeholder-[#5C7B78] outline-none focus:ring-2 text-sm sm:text-base ${
                              errors.password_confirmation 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-[#5C7B78] focus:ring-[#5C7B78]'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C7B78] cursor-pointer"
                          >
                            {showPassword ? <EyeClosed className="w-4 h-4 sm:w-5 sm:h-5"/> : <Eye className="w-4 h-4 sm:w-5 sm:h-5"/>}
                          </button>
                        </div>
                        {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
                      </div>
                      
                      {generalError && (
                        <div className="p-3 rounded-lg bg-red-100 border border-red-200 text-red-700 text-sm">
                          {generalError}
                        </div>
                      )}

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