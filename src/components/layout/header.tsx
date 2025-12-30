'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'
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
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-neutral-900 lg:ml-0 ml-12">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setShowItemForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Yeni İçerik</span>
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
                <span className="text-sm font-medium text-neutral-600">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-neutral-600">{userName}</span>
            </div>
          </div>
        </div>
      </header>

      <ItemFormDialog open={showItemForm} onOpenChange={setShowItemForm} />
    </>
  )
}
