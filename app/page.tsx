'use client'

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PublicNavbar from "@/components/dashboard/PublicNavbar";
import NavbarPeserta from "@/components/dashboard/NavbarPeserta";
import ListJadwalPelatihan from "@/components/dashboard/ListJadwalPelatihan";
import LoginPesertaModal from "@/components/auth/LoginPesertaModal";
import RegistrasiModal from "@/components/auth/RegistrasiModal";

export default function Home() {  
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegistrasiModal, setShowRegistrasiModal] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Defer state update to avoid synchronous render warning
    const token = localStorage.getItem('token')
    const timer = setTimeout(() => {
        setIsLoggedIn(!!token)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const handleSwitchToLogin = () => {
    setShowRegistrasiModal(false);
    setShowLoginModal(true);
  };

  const handleSwitchToRegistrasi = () => {
    setShowLoginModal(false);
    setShowRegistrasiModal(true);
  };

  return (
    <>
    {isLoggedIn ? (
      <NavbarPeserta />
    ) : (
      <PublicNavbar 
        onLoginClick={() => setShowLoginModal(true)} 
        onRegistrasiClick={() => setShowRegistrasiModal(true)} 
      />
    )}
    <main>
      <section id="beranda" className="relative h-[80vh] w-full">
        <Image
          src="/hero-dashboard.png" 
          alt="Hero Image"
          fill style={{ objectFit: 'cover' }}
          className="z-[-1]"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-center text-white px-4">
          <h1 className="text-3xl md:text-6xl font-bold mb-5">
            JUKI<br />Jurnal Karya Ilmiah.
          </h1>
          <p className="mb-8 max-w-xl text-lg md:leading-normal">
            Sistem administrasi pelatihan jurnal yang membantu mahasiswa dalam menyelesaikan jurnal karya ilmiah.
          </p>
          <Button onClick={() => setShowRegistrasiModal(true)} className="bg-[#5C7B78] font-semibold text-lg py-6 px-10 rounded-xl shadow-md">Daftar Sekarang</Button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto py-20 px-4 grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-4xl font-bold mb-4 text-[#5C7B78]">Tentang Juki.hub</h2>
          <p className="mb-8 max-w-xl text-lg md:leading-normal">
            <span className="font-bold text-[#5C7B78]">Juki.hub</span> adalah sistem informasi pelatihan jurnal berbasis web, yang dirancang khusus untuk membantu mahasiswa dalam mengurus pelatihan, mengumpulkan artikel, dan mendapatkan LOA sebagai syarat kelulusan.
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-xl text-gray-800 md:text-2xl font-bold">Cara Kerja.</p>
          <Card className="bg-[#5C7B78]">
            <CardHeader className="flex flex-row items-start gap-4 py-6">
              <Image
                src="/1-pencil.png"
                width={65}
                height={65}
                alt="Pensil pendaftaran"
                className="shrink-0"
              />
              <div>
                <CardTitle className="text-white text-base md:text-lg">Daftar pelatihan & pilih tanggal</CardTitle>
                <CardDescription className="text-white">
                  Setiap batch punya kuota terbatas, jadi pastikan kamu booking sebelum kehabisan!
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
          <Card className="bg-[#5C7B78]">
            <CardHeader className="flex flex-row items-start gap-4 py-6">
              <Image
                src="/2-lamp.png"
                width={65}
                height={65}
                alt="Lampu jurnal"
              />
              <div>
                <CardTitle className="text-white text-base md:text-lg">Upload artikel & ikut pelatihan</CardTitle>
                <CardDescription className="text-white">
                  Upload draft jurnalmu dan Tim JUKI akan bantu biar naskahmu makin siap publish.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
          <Card className="bg-[#5C7B78]">
            <CardHeader className="flex flex-row items-start gap-4 py-6">
              <Image
                src="/3-paper.png"
                width={65}
                height={65}
                alt="Kertas kebaikan"
              />
              <div>
                <CardTitle className="text-white text-base md:text-lg">Yeay Selamat!!</CardTitle>
                <CardDescription className="text-white">
                  Kamu sudah bisa buat jurnal karya ilmiah.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Jadwal Pelatihan */}
      <section id="jadwal-pelatihan" className="text-center">
        <div>
          <h2 className="text-3xl font-bold mb-3 text-[#5C7B78]">Jadwal Pelatihan.</h2>
        </div>
        <div className="bg-[#5C7B78] py-10">
          <div className="max-w-5xl mx-auto px-4 text-center text-white">
            <ListJadwalPelatihan onRegisterClick={() => setShowRegistrasiModal(true)} />
          </div>
        </div>
      </section>

      {/* Kontak Admin */}
      <section id="kontak-kami" className="py-16 px-4 text-center">
        <div className="max-w-xl mx-auto border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Ada Pertanyaan?</h2>
          <p>WhatsApp Admin: <span className="font-medium">081803821237</span></p>
          <p className="mb-2">Email: <span className="font-medium">jep@umm.ac.id</span></p>
          <p className="mb-4 text-sm">Jam Layanan: 08.00 - 16.00 WIB (Senin-Jumat)</p>
          <a
            href="https://wa.me/6281803821237?text=Halo%20Admin%2C%20saya%20ingin%20bertanya%20tentang%20pelatihan%20JUKI"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-[#5C7B78] text-white px-10">Chat Admin Sekarang</Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-100 text-center py-6 text-sm text-muted-foreground">
        © 2025 Juki.hub by Ruru Studio | All rights reserved
      </footer>
    </main>
    <LoginPesertaModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSwitchToRegistrasi={handleSwitchToRegistrasi} />
    <RegistrasiModal isOpen={showRegistrasiModal} onClose={() => setShowRegistrasiModal(false)} onSwitchToLogin={handleSwitchToLogin} />
    </> 
  );
}
