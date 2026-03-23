'use client'

import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, Bell, LogOut, Loader2, Menu, X, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLanguage } from '@/lib/LanguageContext'
import LanguageSwitcher from '@/components/dashboard/LanguageSwitcher'
import LanguageModal from '@/components/dashboard/LanguageModal'

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { name: t.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { name: t.products, href: '/dashboard/products', icon: Package },
    { name: t.sales, href: '/dashboard/sales', icon: ShoppingCart },
    { name: t.distributors, href: '/dashboard/distributors', icon: Users },
    { name: t.profile, href: '/dashboard/profile', icon: User },
    { name: t.alerts, href: '/dashboard/settings', icon: Bell },
    { name: t.settings, href: '/dashboard/settings', icon: Settings },
  ]

  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch {
      window.location.href = '/login'
    }
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.06]">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <ShieldIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white block leading-tight">StockGuard</span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide">{t.appName !== 'StockGuard' ? t.appName : 'स्टॉक गार्ड'}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-3">{t.menu}</p>
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href + item.name + index}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-400 font-semibold'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isActive 
                  ? 'bg-orange-500 shadow-md shadow-orange-500/30' 
                  : 'bg-white/[0.04] group-hover:bg-white/[0.08]'
              }`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <span className="text-sm leading-tight">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse-soft" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Language Switcher */}
      <div className="px-3 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-2">🌐 Language</p>
        <LanguageSwitcher />
      </div>

      {/* Shop Info */}
      <div className="px-3 pb-3">
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/10 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <span className="text-xs">🏪</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white leading-tight">{t.shopInfo}</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">{t.whatsappActive}</p>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50"
        >
          {logoutLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span className="text-sm">{t.signOut}</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Language Modal */}
      <LanguageModal />

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-lg"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 min-h-screen bg-[#1a1a2e] flex flex-col animate-slide-in-left">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 bg-[#1a1a2e] min-h-screen fixed left-0 top-0 flex-col z-40">
        {sidebarContent}
      </div>
    </>
  )
}

function ShieldIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-3 5.99-5.11a2 2 0 0 1 2.72-.81C15 1.5 17 3 19 4a1 1 0 0 1 1 1z" />
    </svg>
  )
}
