'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Plus, Folder, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCampaigns, useCreateCampaign, type Campaign } from '@/hooks/use-campaigns'

interface CampaignSelectorProps {
  value?: string | null
  onChange: (campaignId: string | null) => void
  placeholder?: string
  className?: string
  allowCreate?: boolean
}

const campaignColors = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
]

export function CampaignSelector({
  value,
  onChange,
  placeholder = 'Kampanya seç...',
  className,
  allowCreate = true,
}: CampaignSelectorProps) {
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '', color: '#6366f1' })

  const { data: campaigns, isLoading } = useCampaigns()
  const createCampaign = useCreateCampaign()

  const selectedCampaign = campaigns?.find((c) => c.id === value)

  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim()) return

    const result = await createCampaign.mutateAsync({
      name: newCampaign.name,
      description: newCampaign.description || undefined,
      color: newCampaign.color,
    }) as Campaign

    onChange(result.id)
    setCreateOpen(false)
    setNewCampaign({ name: '', description: '', color: '#6366f1' })
    setOpen(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('justify-between h-11', className)}
          >
            {selectedCampaign ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedCampaign.color }}
                />
                <span className="truncate">{selectedCampaign.name}</span>
              </div>
            ) : (
              <span className="text-neutral-500">{placeholder}</span>
            )}
            <div className="flex items-center gap-1 ml-2">
              {value && (
                <X
                  className="h-4 w-4 text-neutral-400 hover:text-neutral-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(null)
                  }}
                />
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Kampanya ara..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Yükleniyor...' : 'Kampanya bulunamadı.'}
              </CommandEmpty>
              <CommandGroup>
                {campaigns?.map((campaign) => (
                  <CommandItem
                    key={campaign.id}
                    value={campaign.name}
                    onSelect={() => {
                      onChange(campaign.id === value ? null : campaign.id)
                      setOpen(false)
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: campaign.color }}
                    />
                    <span className="flex-1 truncate">{campaign.name}</span>
                    <Check
                      className={cn(
                        'ml-2 h-4 w-4',
                        value === campaign.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              {allowCreate && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false)
                        setCreateOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni kampanya oluştur
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Campaign Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kampanya Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kampanya Adı *</label>
              <Input
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                placeholder="Örn: Yaz Kampanyası 2025"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Textarea
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                placeholder="Kampanya hakkında kısa açıklama..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Renk</label>
              <div className="flex gap-2 flex-wrap">
                {campaignColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCampaign({ ...newCampaign, color })}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all',
                      newCampaign.color === color && 'ring-2 ring-offset-2 ring-neutral-400'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={!newCampaign.name.trim() || createCampaign.isPending}
            >
              {createCampaign.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface CampaignBadgeProps {
  campaign: Campaign
  size?: 'sm' | 'md'
  className?: string
}

export function CampaignBadge({ campaign, size = 'md', className }: CampaignBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${campaign.color}15`,
        color: campaign.color,
      }}
    >
      <Folder className="h-3 w-3" />
      {campaign.name}
    </span>
  )
}
