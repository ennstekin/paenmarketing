'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ItemFormDialog } from '@/components/features/marketing-item/item-form-dialog'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const [userName, setUserName] = useState<string>('')
  const [showItemForm, setShowItemForm] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || '')
      }
    }
    getUser()
  }, [supabase])

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-neutral-900 lg:ml-0 ml-12 tracking-tight">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <Button variant="ghost" size="icon" className="hidden sm:flex h-10 w-10 rounded-xl hover:bg-neutral-100">
              <Search className="h-5 w-5 text-neutral-500" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-neutral-100">
              <Bell className="h-5 w-5 text-neutral-500" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
            </Button>

            {/* Add New Button */}
            <Button
              onClick={() => setShowItemForm(true)}
              className="gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 hover:from-neutral-800 hover:to-neutral-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Yeni İçerik</span>
            </Button>

            {/* User Avatar */}
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-neutral-200">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center shadow-md">
                <span className="text-sm font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-neutral-900">{userName.split('@')[0]}</p>
                <p className="text-xs text-neutral-500">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <ItemFormDialog open={showItemForm} onOpenChange={setShowItemForm} />
    </>
  )
}
