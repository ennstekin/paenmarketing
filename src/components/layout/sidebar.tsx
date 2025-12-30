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
  Users,
  Shield,
  Activity,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Takvim', icon: Calendar },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/list', label: 'Liste', icon: List },
  { href: '/users', label: 'Kullanıcılar', icon: Users },
  { href: '/permissions', label: 'İzinler', icon: Shield },
  { href: '/logs', label: 'Loglar', icon: Activity },
  { href: '/settings', label: 'Ayarlar', icon: Settings },
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
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-neutral-200 transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-neutral-200">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-neutral-900">PAEN</span>
              <span className="text-sm text-neutral-500">Marketing</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-neutral-200">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-neutral-600 hover:text-neutral-900"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
