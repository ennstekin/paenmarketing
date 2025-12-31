'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, X, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ItemFormDialog } from '@/components/features/marketing-item/item-form-dialog'
import { NotificationCenter } from '@/components/features/notifications/notification-center'
import { useMarketingItems } from '@/hooks/use-marketing-items'
import type { MarketingItem } from '@/types/database'
import { formatDate } from '@/lib/utils'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const [userName, setUserName] = useState<string>('')
  const [showItemForm, setShowItemForm] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<MarketingItem | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { data: items } = useMarketingItems()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || '')
      }
    }
    getUser()
  }, [supabase])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter items based on search query
  const filteredItems = items?.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) || []

  // Get upcoming items (scheduled in next 7 days)
  const today = new Date()
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingItems = items?.filter(item => {
    if (!item.scheduled_date) return false
    const itemDate = new Date(item.scheduled_date)
    return itemDate >= today && itemDate <= nextWeek && item.status !== 'completed'
  }).sort((a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime()).slice(0, 5) || []

  const handleItemClick = (item: MarketingItem) => {
    setSelectedItem(item)
    setShowItemForm(true)
    setShowSearch(false)
  }

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
            {/* Search Button & Dropdown */}
            <div className="relative" ref={searchRef}>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex h-10 w-10 rounded-xl hover:bg-neutral-100"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-5 w-5 text-neutral-500" />
              </Button>

              {showSearch && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden">
                  <div className="p-3 border-b border-neutral-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        placeholder="İçerik ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-9 h-10"
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <X className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {searchQuery ? (
                      filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className="w-full px-4 py-3 text-left hover:bg-neutral-50 border-b border-neutral-50 last:border-0"
                          >
                            <p className="font-medium text-sm text-neutral-900 truncate">{item.title}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {item.scheduled_date ? formatDate(item.scheduled_date) : 'Tarih belirlenmemiş'}
                            </p>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-neutral-500">
                          Sonuç bulunamadı
                        </div>
                      )
                    ) : (
                      <div className="p-4 text-center text-sm text-neutral-400">
                        Aramak için yazmaya başlayın
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <NotificationCenter />

            {/* Add New Button */}
            <Button
              onClick={() => { setShowItemForm(true); setSelectedItem(null); }}
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

      <ItemFormDialog open={showItemForm} onOpenChange={setShowItemForm} item={selectedItem} />
    </>
  )
}
