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
    
    // NIM: Harus angka, min 5
    if (!/^\d+$/.test(form.student_number)) {
      newErrors.student_number = 'NIM hanya boleh berisi angka!'
    } else if (form.student_number.length < 5) {
      newErrors.student_number = 'NIM tidak valid (min. 5 karakter)!'
    }
    
    // WhatsApp: Sudah difilter saat input, cek panjang
    if (form.mobile_number.length < 9) {
      newErrors.mobile_number = 'Nomor WhatsApp tidak valid (min. 9 angka)!'
    } else if (form.mobile_number.length > 13) { // 13 + 62 = 15 total
      newErrors.mobile_number = 'Nomor WhatsApp terlalu panjang (max 15 angka total)!'
    }
    
    if (!form.birthPlace.trim()) newErrors.birthPlace = 'Tempat lahir harus diisi!'

    if (!form.birthDate) {
      newErrors.birthDate = 'Tanggal lahir harus diisi!'
    } else {
      const selectedDate = new Date(form.birthDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset waktu untuk perbandingan murni tanggal

      if (isNaN(selectedDate.getTime())) {
        newErrors.birthDate = 'Tanggal lahir tidak valid!'
      } else if (selectedDate > today) {
        newErrors.birthDate = 'Tanggal lahir tidak boleh di masa depan!'
      }
    }

    if (!form.gender) newErrors.gender = 'Jenis kelamin harus dipilih!'

    // Email: Alphanumeric + @ + .
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    if (!emailRegex.test(form.email)) newErrors.email = 'Format email tidak valid (contoh: user@domain.com)!'

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
        birthDate: new Date(form.birthDate).toISOString(),
        gender: form.gender
      }

      const res = await api.post('/auth/register', payload)
      console.log('✅ Registrasi sukses:', res.data)

      setShowAlert(true)
    } catch (err: any) {
      console.log('❌ Registrasi gagal:', err)
      setGeneralError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
    }

    if (showAlert && isOpen) {
    return <BerhasilDaftar onSwitchToLogin={onSwitchToLogin} />;
    }

    if (!isOpen) return null;

    // Today's date in YYYY-MM-DD format for input max attribute
    const todayStr = new Date().toISOString().split('T')[0];

    return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !m-0 !border-none !rounded-none !bg-[#D9C8B2] !overflow-y-auto !z-50 !translate-x-0 !translate-y-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Registrasi</DialogTitle>

        <div className="min-h-full flex flex-col items-center justify-start py-8 sm:py-12 px-4 sm:px-6 md:px-12">
            <div className="w-full max-w-6xl">
                {/* Header */}
                <div className="w-full flex justify-between items-center mb-8 px-4 md:px-12">
                  <span className="font-bold text-3xl sm:text-4xl text-[#5C7B78]">Juki.hub</span>
                  <button 
                    onClick={onClose} 
                    className="text-[#5C7B78] hover:text-[#D15651] transition-all duration-300 p-1"
                  >
                    <X className="w-10 h-10 stroke-2" />
                  </button>
                </div>

                {/* Konten */}
                <div className="w-full flex flex-col md:flex-row items-center md:items-stretch">
                  {/* Form */}
                  <div className="w-full md:w-1/2 px-6 sm:px-10 md:px-16 py-6 text-[#5C7B78] flex flex-col justify-center gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">Selangkah lebih dekat menuju kelulusan.</h1>
                      <p className="text-sm sm:text-base opacity-90">Daftar sekarang dan ikuti pelatihan jurnal dengan lebih mudah!</p>
                    </div>

                    <form className="flex flex-col gap-4 sm:gap-5" onSubmit={handleSubmit}>
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
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ""); // Hanya angka
                            setForm({ ...form, student_number: value });
                          }}
                          maxLength={20}
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
                              // Limit to 13 digits (+62 at front makes it 15)
                              if (value.length <= 13) {
                                setForm({ ...form, mobile_number: value })
                              }
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
                            type="date"
                            name="birthDate"
                            max={todayStr}
                            value={form.birthDate}
                            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-transparent border text-[#5C7B78] placeholder-[#5C7B78] outline-none focus:ring-2 text-sm sm:text-base ${
                              errors.birthDate
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-[#5C7B78] focus:ring-[#5C7B78]'
                            }`}
                          />
                          {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
                        </div>
                      </div>                      {/* Dropdown Gender */}
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