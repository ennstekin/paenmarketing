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
import { useCreateIdea, useUpdateMarketingItem, useDeleteIdea } from '@/hooks/use-marketing-items'
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
  Lightbulb,
} from 'lucide-react'
import type { MarketingItem, ChannelType, Priority, ContentType } from '@/types/database'

const formSchema = z.object({
  title: z.string().min(1, 'Başlık gerekli'),
  description: z.string().optional(),
  channels: z.array(z.string()).optional(),
  url: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
  notes: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  content_type: z.enum(['post', 'story', 'reel', 'article', 'newsletter', 'ad']).nullable().optional(),
  assigned_to: z.string().nullable().optional(),
})

type FormData = z.infer<typeof formSchema>

interface IdeaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  idea?: MarketingItem | null
}

export function IdeaFormDialog({ open, onOpenChange, idea }: IdeaFormDialogProps) {
  const createIdea = useCreateIdea()
  const updateIdea = useUpdateMarketingItem()
  const deleteIdea = useDeleteIdea()
  const { data: channels, isLoading: channelsLoading } = useChannels()
  const { data: users } = useUsers()

  const [activeTab, setActiveTab] = useState<'details' | 'settings'>('details')
  const isEditing = !!idea

  const handleDelete = async () => {
    if (!idea) return
    if (confirm('Bu fikri silmek istediğinize emin misiniz?')) {
      await deleteIdea.mutateAsync(idea.id)
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

    if (idea) {
      const ideaChannels = (idea as MarketingItem & { channels?: string[] }).channels ||
        (idea.channel ? [idea.channel] : [])
      reset({
        title: idea.title,
        description: idea.description || '',
        channels: ideaChannels,
        url: (idea as MarketingItem & { url?: string }).url || '',
        notes: idea.notes || '',
        priority: idea.priority || 'normal',
        content_type: idea.content_type || null,
        assigned_to: idea.assigned_to || null,
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
  }, [idea, reset, open])

  const onSubmit = async (data: FormData) => {
    if (isEditing && idea) {
      await updateIdea.mutateAsync({
        id: idea.id,
        title: data.title,
        description: data.description || null,
        channels: (data.channels || []) as ChannelType[],
        channel: (data.channels?.[0] as ChannelType) || undefined,
        url: data.url || null,
        notes: data.notes || null,
        priority: data.priority as Priority,
        content_type: data.content_type as ContentType | null,
        assigned_to: data.assigned_to || null,
        is_idea: true,
      })
    } else {
      await createIdea.mutateAsync({
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
              <Lightbulb className="h-5 w-5 text-amber-500" />
              {isEditing ? 'Fikri Düzenle' : 'Yeni Fikir'}
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
        <form id="idea-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5">
          {/* Details Tab */}
          <div className={activeTab === 'details' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Main Content */}
              <div className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Başlık *</label>
                  <Input
                    {...register('title')}
                    placeholder="Fikir başlığını girin..."
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
                  <label className="text-sm font-medium text-neutral-700">Açıklama</label>
                  <Textarea
                    {...register('description')}
                    placeholder="Fikir açıklaması..."
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
                    placeholder="Ek notlar, ilham kaynakları..."
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
                      <span className="text-sm text-neutral-500">Yükleniyor...</span>
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
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-700 mb-2">
                    <Lightbulb className="h-4 w-4" />
                    Fikirler Havuzu
                  </div>
                  <p className="text-xs text-amber-600">
                    Bu fikir, takvime eklenene kadar fikirler havuzunda bekleyecektir.
                    İstediğiniz zaman takvime taşıyabilirsiniz.
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
                    Öncelik
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
                    İçerik Tipi
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
                    Sorumlu Kişi
                  </label>
                  <Controller
                    name="assigned_to"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ''}
                        onValueChange={(v) => field.onChange(v || null)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Kişi seç...">
                            {field.value && users?.find(u => u.id === field.value) && (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={users.find(u => u.id === field.value)?.avatar_url || undefined} />
                                  <AvatarFallback className="text-[10px]">
                                    {users.find(u => u.id === field.value)?.full_name?.[0] || users.find(u => u.id === field.value)?.email?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{users.find(u => u.id === field.value)?.full_name || users.find(u => u.id === field.value)?.email}</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Atanmamış</SelectItem>
                          {users?.filter(u => u.is_active).map((user) => (
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
                  <div className="text-sm font-medium text-neutral-700">Fikir İpuçları</div>
                  <ul className="text-xs text-neutral-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      Fikirlerinizi detaylı açıklayın, böylece daha sonra kolayca hatırlarsınız.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      Referans linkleri ekleyerek ilham kaynaklarınızı kaydedin.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      Kanal seçimi yaparak fikrin hangi platformda uygulanacağını belirleyin.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      Öncelik belirleyerek önemli fikirleri ön plana çıkarın.
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
                disabled={deleteIdea.isPending}
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteIdea.isPending ? 'Siliniyor...' : 'Sil'}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button
              type="submit"
              form="idea-form"
              disabled={createIdea.isPending || updateIdea.isPending}
            >
              {createIdea.isPending || updateIdea.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : isEditing ? (
                'Güncelle'
              ) : (
                'Fikir Ekle'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
