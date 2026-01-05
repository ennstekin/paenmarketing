'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useCreateStandByItem, useUpdateMarketingItem, useDeleteStandByItem } from '@/hooks/use-marketing-items'
import { useChannels } from '@/hooks/use-channels'
import { useUsers } from '@/hooks/use-users'
import { PrioritySelect } from '@/components/features/priority/priority-badge'
import { ContentTypeSelect } from '@/components/features/content-type/content-type-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Trash2,
  Loader2,
  Link,
  AlertCircle,
  Flag,
  Target,
  User,
  X,
  Clock,
} from 'lucide-react'
import type { MarketingItem, ChannelType, Priority, ContentType } from '@/types/database'

const formSchema = z.object({
  title: z.string().min(1, 'Baslik gerekli'),
  description: z.string().optional(),
  channels: z.array(z.string()).optional(),
  url: z.string().url('Gecerli bir URL girin').optional().or(z.literal('')),
  notes: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  content_type: z.enum(['post', 'story', 'reel', 'article', 'newsletter', 'ad']).nullable().optional(),
  assigned_to: z.string().nullable().optional(),
})

type FormData = z.infer<typeof formSchema>

interface StandByFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: MarketingItem | null
}

export function StandByFormDialog({ open, onOpenChange, item }: StandByFormDialogProps) {
  const createItem = useCreateStandByItem()
  const updateItem = useUpdateMarketingItem()
  const deleteItem = useDeleteStandByItem()
  const { data: channels, isLoading: channelsLoading } = useChannels()
  const { data: users } = useUsers()

  const [activeTab, setActiveTab] = useState<'details' | 'settings'>('details')
  const isEditing = !!item

  const handleDelete = async () => {
    if (!item) return
    if (confirm('Bu icerigi silmek istediginize emin misiniz?')) {
      await deleteItem.mutateAsync(item.id)
      onOpenChange(false)
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      channels: [],
      url: '',
      notes: '',
      priority: 'normal',
      content_type: null,
      assigned_to: null,
    },
  })

  const watchedChannels = watch('channels')
  const selectedChannels = channels?.filter(c => watchedChannels?.includes(c.name)) || []

  const toggleChannel = (channelName: string) => {
    const current = watchedChannels || []
    if (current.includes(channelName)) {
      setValue('channels', current.filter(c => c !== channelName))
    } else {
      setValue('channels', [...current, channelName])
    }
  }

  useEffect(() => {
    if (!open) return

    if (item) {
      const itemChannels = (item as MarketingItem & { channels?: string[] }).channels ||
        (item.channel ? [item.channel] : [])
      reset({
        title: item.title,
        description: item.description || '',
        channels: itemChannels,
        url: (item as MarketingItem & { url?: string }).url || '',
        notes: item.notes || '',
        priority: item.priority || 'normal',
        content_type: item.content_type || null,
        assigned_to: item.assigned_to || null,
      })
    } else {
      reset({
        title: '',
        description: '',
        channels: [],
        url: '',
        notes: '',
        priority: 'normal',
        content_type: null,
        assigned_to: null,
      })
    }
    setActiveTab('details')
  }, [item, reset, open])

  const onSubmit = async (data: FormData) => {
    if (isEditing && item) {
      await updateItem.mutateAsync({
        id: item.id,
        title: data.title,
        description: data.description || null,
        channels: (data.channels || []) as ChannelType[],
        channel: (data.channels?.[0] as ChannelType) || undefined,
        url: data.url || null,
        notes: data.notes || null,
        priority: data.priority as Priority,
        content_type: data.content_type as ContentType | null,
        assigned_to: data.assigned_to || null,
        is_standby: true,
        is_idea: false,
      })
    } else {
      await createItem.mutateAsync({
        title: data.title,
        description: data.description || null,
        channels: (data.channels || []) as ChannelType[],
        channel: (data.channels?.[0] as ChannelType) || undefined,
        url: data.url || null,
        notes: data.notes || null,
        priority: data.priority as Priority,
        content_type: data.content_type as ContentType | null,
        assigned_to: data.assigned_to || null,
      })
    }

    onOpenChange(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              {isEditing ? 'Stand By Duzenle' : 'Yeni Stand By'}
            </DialogTitle>
            {selectedChannels.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {selectedChannels.map(channel => (
                  <Badge
                    key={channel.name}
                    variant="channel"
                    color={channel.color}
                    className="text-xs"
                  >
                    {channel.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 p-1 bg-neutral-100 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'details'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Detaylar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'settings'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Ayarlar
            </button>
          </div>
        </DialogHeader>

        {/* Content - Single Form */}
        <form id="standby-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5">
          {/* Details Tab */}
          <div className={activeTab === 'details' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Main Content */}
              <div className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Baslik *</label>
                  <Input
                    {...register('title')}
                    placeholder="Icerik basligini girin..."
                    className="h-12 text-base"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Aciklama</label>
                  <Textarea
                    {...register('description')}
                    placeholder="Icerik aciklamasi..."
                    className="min-h-[140px] resize-none"
                  />
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <Link className="h-4 w-4 text-neutral-400" />
                    Referans URL / Link
                  </label>
                  <Input
                    {...register('url')}
                    placeholder="https://..."
                    className="h-11"
                  />
                  {errors.url && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.url.message}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Notlar</label>
                  <Textarea
                    {...register('notes')}
                    placeholder="Ek notlar..."
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </div>

              {/* Right Column - Channels */}
              <div className="space-y-5">
                {/* Channels - Multi Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Kanallar (Opsiyonel)</label>
                  {channelsLoading ? (
                    <div className="flex items-center gap-2 h-11 px-3 border rounded-lg bg-neutral-50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-neutral-500">Yukleniyor...</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white min-h-[44px]">
                      {channels?.map((channel) => {
                        const isSelected = watchedChannels?.includes(channel.name)
                        return (
                          <button
                            key={channel.name}
                            type="button"
                            onClick={() => toggleChannel(channel.name)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'text-white shadow-sm'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                            style={isSelected ? { backgroundColor: channel.color } : {}}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white/50' : ''}`}
                              style={!isSelected ? { backgroundColor: channel.color } : {}}
                            />
                            {channel.label}
                            {isSelected && <X className="h-3 w-3 ml-0.5" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                    <Clock className="h-4 w-4" />
                    Stand By
                  </div>
                  <p className="text-xs text-blue-600">
                    Bu icerik, takvime eklenene kadar Stand By listesinde bekleyecektir.
                    Hazir oldugunda takvime tasiyabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Tab */}
          <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Priority, Content Type */}
              <div className="space-y-5">
                {/* Priority */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <Flag className="h-4 w-4 text-neutral-400" />
                    Oncelik
                  </label>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <PrioritySelect
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>

                {/* Content Type */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <Target className="h-4 w-4 text-neutral-400" />
                    Icerik Tipi
                  </label>
                  <Controller
                    name="content_type"
                    control={control}
                    render={({ field }) => (
                      <ContentTypeSelect
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>

                {/* Assigned To */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-neutral-400" />
                    Sorumlu Kisi
                  </label>
                  <Controller
                    name="assigned_to"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || 'unassigned'}
                        onValueChange={(v) => field.onChange(v === 'unassigned' ? null : v)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Kisi sec..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Atanmamis</SelectItem>
                          {users?.filter(u => u.is_active !== false).map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={user.avatar_url || undefined} />
                                  <AvatarFallback className="text-[10px]">
                                    {user.full_name?.[0] || user.email?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{user.full_name || user.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* Right Column - Tips */}
              <div className="space-y-5">
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-3">
                  <div className="text-sm font-medium text-neutral-700">Stand By Ipuclari</div>
                  <ul className="text-xs text-neutral-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      Hazir olan ama henuz planlanmamis icerikleri buraya ekleyin.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      Kanal ve oncelik bilgilerini ekleyerek duzenli tutun.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      Hazir oldugunda tek tikla takvime tasiyin.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-neutral-50 flex items-center justify-between">
          <div>
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteItem.isPending}
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteItem.isPending ? 'Siliniyor...' : 'Sil'}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Iptal
            </Button>
            <Button
              type="submit"
              form="standby-form"
              disabled={createItem.isPending || updateItem.isPending}
            >
              {createItem.isPending || updateItem.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : isEditing ? (
                'Guncelle'
              ) : (
                'Stand By Ekle'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
