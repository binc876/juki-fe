'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PublicNavbarProps {
  onLoginClick: () => void;
  onRegistrasiClick: () => void;
}

export default function PublicNavbar({ onLoginClick, onRegistrasiClick }: PublicNavbarProps) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Detect auth status
  useEffect(() => {
    const token = localStorage.getItem('token')
    const timer = setTimeout(() => {
        setIsLoggedIn(!!token)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`w-full fixed top-0 left-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow pt-0" : "bg-transparent pt-4 sm:pt-6 md:pt-8"
      }`}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        {/* Logo */}
        <Link 
          href="/" 
          className={`text-xl sm:text-2xl font-bold transition-colors ${
            scrolled ? "text-[#5C7B78]" : "text-white"
          }`}
        >
          Juki.hub
        </Link>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center space-x-2">
          {isLoggedIn ? (
             <Link href="/beranda">
                <Button 
                  className="bg-[#5C7B78] text-white hover:bg-[#4a6361] text-xs lg:text-sm px-3 lg:px-4 py-1.5 lg:py-2" 
                >
                  Dashboard
                </Button>
             </Link>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="text-[#5C7B78] border-[#5C7B78] hover:bg-[#5C7B78] hover:text-white text-xs lg:text-sm px-3 lg:px-4 py-1.5 lg:py-2" 
                onClick={onLoginClick}
              >
                Masuk
              </Button>
              <Button 
                className="bg-[#5C7B78] text-white hover:bg-[#4a6361] text-xs lg:text-sm px-3 lg:px-4 py-1.5 lg:py-2" 
                onClick={onRegistrasiClick}
              >
                Daftar
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu icon */}
        <button 
          className={`md:hidden transition-colors ${
            scrolled ? "text-[#5C7B78]" : "text-white"
          }`} 
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      <div 
        className={cn(
          "md:hidden fixed inset-x-0 top-[0] z-[-1] transition-all duration-500 ease-in-out transform origin-top",
          open 
            ? "translate-y-0 opacity-100 visible" 
            : "-translate-y-full opacity-0 invisible"
        )}
      >
        <div className={cn(
          "pt-20 pb-8 px-6 shadow-2xl rounded-b-3xl border-t border-gray-100/10",
          scrolled ? "bg-white" : "bg-white/95 backdrop-blur-md"
        )}>
          <ul className="space-y-4">
            <li>
              <Link 
                href="#beranda" 
                onClick={() => setOpen(false)}
                className="block py-3 text-lg font-semibold text-[#5C7B78] border-b border-gray-100 hover:translate-x-2 transition-transform"
              >
                Beranda
              </Link>
            </li>
            <li>
              <Link 
                href="#jadwal-pelatihan" 
                onClick={() => setOpen(false)}
                className="block py-3 text-lg font-semibold text-[#5C7B78] border-b border-gray-100 hover:translate-x-2 transition-transform"
              >
                Jadwal Pelatihan
              </Link>
            </li>
            <li>
              <Link 
                href="#kontak-kami" 
                onClick={() => setOpen(false)}
                className="block py-3 text-lg font-semibold text-[#5C7B78] border-b border-gray-100 hover:translate-x-2 transition-transform"
              >
                Kontak Kami
              </Link>
            </li>
            
            <li className="pt-4 flex flex-col gap-3">
              {isLoggedIn ? (
                 <Link href="/beranda" onClick={() => setOpen(false)}>
                    <Button 
                      className="w-full bg-[#5C7B78] text-white hover:bg-[#4a6361] py-6 text-base font-bold rounded-2xl shadow-lg shadow-[#5C7B78]/20" 
                    >
                      Buka Dashboard
                    </Button>
                 </Link>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full py-6 text-base font-bold text-[#5C7B78] border-2 border-[#5C7B78] rounded-2xl hover:bg-[#5C7B78]/5 transition-all" 
                    onClick={() => {
                      setOpen(false);
                      onLoginClick();
                    }}
                  >
                    Masuk ke Akun
                  </Button>
                  <Button 
                    className="w-full py-6 text-base font-bold bg-[#5C7B78] text-white hover:bg-[#4a6361] rounded-2xl shadow-lg shadow-[#5C7B78]/20 transition-all active:scale-[0.98]" 
                    onClick={() => {
                      setOpen(false);
                      onRegistrasiClick();
                    }}
                  >
                    Daftar Sekarang
                  </Button>
                </>
              )}
            </li>
          </ul>
        </div>
      </div>
    </header>
  )
}