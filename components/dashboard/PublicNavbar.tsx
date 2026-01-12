'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

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
      {open && (
        <div className={`md:hidden px-3 sm:px-4 pb-3 sm:pb-4 ${scrolled ? "bg-white" : "bg-[#ffffff95] backdrop-blur-sm"}`}>
          <ul className="space-y-2 text-sm font-medium text-slate-700">
            <li>
              {isLoggedIn ? (
                 <Link href="/beranda" onClick={() => setOpen(false)}>
                    <Button 
                      className="w-full mt-2 bg-[#5C7B78] text-white hover:bg-[#4a6361] text-sm" 
                    >
                      Dashboard
                    </Button>
                 </Link>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 text-[#5C7B78] border-[#5C7B78] hover:bg-[#5C7B78] hover:text-white text-sm" 
                    onClick={() => {
                      setOpen(false);
                      onLoginClick();
                    }}
                  >
                    Masuk
                  </Button>
                  <Button 
                    className="w-full mt-2 bg-[#5C7B78] text-white hover:bg-[#4a6361] text-sm" 
                    onClick={() => {
                      setOpen(false);
                      onRegistrasiClick();
                    }}
                  >
                    Daftar
                  </Button>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}