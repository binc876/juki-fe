"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X, LayoutDashboard } from "lucide-react"
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"

export default function NavbarPeserta() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)

    // Check Role from Token
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        const roles = payload.roles || [];
        if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
          setIsAdmin(true)
        }
      } catch (e) {
        console.error('Error decoding token', e)
      }
    }

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { name: "Beranda", href: "/beranda" },
    ...(isAdmin 
      ? [{ name: "Admin Panel", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> }] 
      : [{ name: "Pelatihanku", href: "/pelatihanku" }]
    ),
  ]

  return (
    <header
      className={`w-full fixed top-0 left-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow pt-0" : "bg-transparent pt-4 sm:pt-6 md:pt-8"
      }`}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/beranda"
          className={`text-xl sm:text-2xl font-bold transition-colors ${
            scrolled ? "text-[#5C7B78]" : "text-white"
          }`}
        >
          JUKI.
        </Link>

        {/* Desktop Nav */}
        <nav
          className={`hidden lg:flex items-center space-x-4 xl:space-x-6 text-sm xl:text-base font-medium transition-colors ${
            scrolled ? "text-stone-700" : "text-white"
          }`}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "hover:text-[#5C7B78] transition-colors whitespace-nowrap flex items-center gap-2",
                pathname === item.href && 'text-[#5C7B78] font-bold'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Avatar / Admin Action - Desktop & Mobile */}
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Link href="/admin" className="hidden lg:block">
               <button className={cn(
                 "px-5 py-2 rounded-full font-bold text-sm transition-all",
                 scrolled 
                  ? "bg-[#5C7B78] text-white hover:bg-[#4a6361]" 
                  : "bg-white text-[#5C7B78] hover:bg-opacity-90"
               )}>
                 Dashboard Admin
               </button>
            </Link>
          ) : (
            <Link href="/akun" className="hidden lg:block">
              <div className="flex items-center space-x-2">
                <Image 
                  src="/account-pic.jpg"
                  alt="User"
                  width={36}
                  height={36}
                  className="rounded-full border-2 border-white hover:border-[#5C7B78] transition-colors"
                />
              </div>
            </Link>
          )}

          {/* Mobile menu icon */}
          <button 
            className={`lg:hidden transition-colors ${
              scrolled ? "text-[#5C7B78]" : "text-white"
            }`}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div
          className={`lg:hidden px-3 sm:px-4 pb-3 sm:pb-4 ${
            scrolled ? "bg-white" : "bg-[#ffffff95] backdrop-blur-sm"
          }`}
        >
          <ul className="space-y-1 text-sm font-medium text-slate-700">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block py-2.5 px-2 rounded-lg hover:bg-[#5C7B78]/10 hover:text-[#5C7B78] transition-colors",
                    pathname === item.href && 'bg-[#5C7B78]/10 text-[#5C7B78] font-bold'
                  )}
                >
                  {item.name}
                </Link>
              </li>
            ))}
            {!isAdmin && (
              <li className="pt-2 border-t border-gray-200">
                <Link 
                  href="/akun" 
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-[#5C7B78]/10 transition-colors"
                >
                  <Image 
                    src="/account-pic.jpg"
                    alt="User"
                    width={32}
                    height={32}
                    className="rounded-full border-2 border-[#5C7B78]"
                  />
                  <span className="font-medium text-slate-700">Akun Saya</span>
                </Link>
              </li>
            )}
            {isAdmin && (
              <li className="pt-2 border-t border-gray-200">
                <Link 
                  href="/admin" 
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-lg bg-[#5C7B78]/10 text-[#5C7B78] font-bold"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard Admin</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}