'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileCheck, 
  CheckCircle, 
  FileText, 
  ShieldCheck, 
  MessageSquare,
  Menu,
  X
} from 'lucide-react'

interface SidebarProps {
  activeMenu: string
  onMenuChange: (menu: string) => void
}

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Manajemen Peserta', icon: Users },
  { name: 'Jadwal Pelatihan', icon: Calendar },
  { name: 'Review Artikel', icon: FileCheck },
  { name: 'Verifikasi', icon: CheckCircle },
  { name: 'LOA', icon: FileText },
  { name: 'Bebas Tanggungan', icon: ShieldCheck },
  { name: 'Feedback', icon: MessageSquare },
  { name: 'Keluar', icon: LogOut },
]


export default function SidebarAdmin({ activeMenu, onMenuChange }: SidebarProps) {
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserName(user?.name || user?.nama_lengkap || 'Admin')
    setUserRole(user?.role || 'Administrator')
  }, [])

  const handleMenuClick = (menu: string) => {
    onMenuChange(menu)
    setIsOpen(false) // Close mobile menu after selection
  }

  return (
    <>
      {/* Mobile Menu Button - Fixed at top with proper z-index */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[white] border-b border-gray-200 z-50 flex items-center px-4 shadow-sm">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#5C7B78] text-white p-2.5 rounded-lg shadow-md hover:bg-[#4e6a67] transition-colors active:scale-95"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="ml-4 flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200">
            <Image 
              src="/account-pic.jpg" 
              alt="Admin" 
              width={40} 
              height={40} 
              className="object-cover w-full h-full" 
            />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#4E6151]">{userName}</h2>
            <p className="text-xs text-[#4E6151]/70">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 mt-16"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative
          top-16 lg:top-0
          left-0
          z-40
          w-72 lg:w-64 xl:w-72
          bg-[#9BA297] text-[#4E6151]
          h-[calc(100vh-4rem)] lg:h-screen
          py-4 sm:py-6 px-3 sm:px-4
          lg:rounded-r-xl shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
        `}
      >
        {/* Header - Hidden on mobile (shown in top bar) */}
        <div className="hidden lg:flex flex-col items-center mb-6 lg:mb-8 xl:mb-10">
          <div className="relative w-20 h-20 xl:w-24 xl:h-24 rounded-full overflow-hidden mb-3 ring-4 ring-white shadow-md">
            <Image 
              src="/account-pic.jpg" 
              alt="Admin" 
              width={96} 
              height={96} 
              className="object-cover w-full h-full" 
            />
          </div>
          <h2 className="text-base xl:text-lg font-bold text-center text-[#4E6151]">
            {userName}
          </h2>
          <p className="text-xs xl:text-sm text-[#4E6151]/70 font-medium mt-1">
            {userRole}
          </p>
        </div>

        {/* Divider - Hidden on mobile */}
        <div className="hidden lg:block border-t border-[#4E6151]/20 mb-4 lg:mb-6" />

        {/* Menu List */}
        <nav className="space-y-1 sm:space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = activeMenu === item.name
            const isLogout = item.name === 'Keluar'

            return (
              <button
                key={index}
                onClick={() => handleMenuClick(item.name)}
                className={`
                  w-full px-3 sm:px-4 py-2.5 sm:py-3
                  rounded-md transition-all font-medium text-sm sm:text-base
                  flex items-center gap-2 sm:gap-3
                  ${
                    isLogout
                      ? `
                        justify-center
                        border border-red-500
                        text-red-600
                        hover:bg-red-600 hover:text-white
                        mt-4
                      `
                      : isActive
                      ? 'bg-[#ECEDDA] text-[#5C7B78] shadow-md scale-[1.02]'
                      : 'hover:bg-red text-[#4E6151] hover:shadow-sm'
                  }
                `}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
            )
          })}
        </nav>


        {/* Footer Info */}
        {/* <div className="hidden xl:block mt-8 pt-6 border-t border-[#4E6151]/20">
          <div className="bg-white/50 rounded-lg p-3 text-center">
            <p className="text-xs text-[#4E6151]/70 font-medium">
              Jupalo Admin Panel
            </p>
            <p className="text-xs text-[#4E6151]/50 mt-1">
              v1.0.0
            </p>
          </div>
        </div> */}
      </aside>
    </>
  )
}