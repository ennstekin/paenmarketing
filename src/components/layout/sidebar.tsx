'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Kanban,
  List,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'from-purple-500 to-purple-600' },
  { href: '/calendar', label: 'Takvim', icon: Calendar, color: 'from-blue-500 to-blue-600' },
  { href: '/kanban', label: 'Kanban', icon: Kanban, color: 'from-amber-500 to-amber-600' },
  { href: '/list', label: 'Liste', icon: List, color: 'from-green-500 to-green-600' },
  { href: '/settings', label: 'Ayarlar', icon: Settings, color: 'from-neutral-500 to-neutral-600' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-white shadow-lg border border-neutral-100 hover:shadow-xl transition-shadow"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-72 bg-white border-r border-neutral-100 transition-all duration-300 lg:translate-x-0 shadow-xl lg:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-neutral-900 tracking-tight">PAEN</span>
                <span className="block text-xs text-neutral-500 -mt-0.5">Marketing Platform</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            <p className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Menu
            </p>
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-neutral-900 to-neutral-800 text-white shadow-lg'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  )}
                >
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
                    isActive
                      ? 'bg-white/20'
                      : 'bg-neutral-100 group-hover:bg-neutral-200'
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {item.label}
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 mx-4 mb-4 rounded-xl bg-neutral-50">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              onClick={handleLogout}
            >
              <div className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                <LogOut className="h-4 w-4" />
              </div>
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
