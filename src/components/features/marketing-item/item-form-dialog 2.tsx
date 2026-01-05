'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { useCreateMarketingItem, useUpdateMarketingItem, useDeleteMarketingItem } from '@/hooks/use-marketing-items'
import { useChannels } from '@/hooks/use-channels'
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '@/hooks/use-attachments'
import { PriorityBadge, PrioritySelect } from '@/components/features/priority/priority-badge'
import { CampaignSelector } from '@/components/features/campaigns/campaign-selector'
import { ChecklistEditor, ChecklistPreview, type ChecklistItem } from '@/components/features/checklist/checklist-editor'
import { ContentTypeSelect, ContentTypeBadge } from '@/components/features/content-type/content-type-badge'
import { DeadlineIndicator } from '@/components/features/deadline/deadline-indicator'
import {
  Trash2,
  Loader2,
  Upload,
  Link,
  Calendar,
  Clock,
  FileText,
  Image,
  File,
  X,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Flag,
  Target,
  ListChecks,
  Folder,
} from 'lucide-react'
import type { MarketingItem, ChannelType, ItemStatus, Priority, ContentType } from '@/types/database'
import { statusLabels } from '@/lib/utils'

const formSchema = z.object({
  title: z.string().min(1, 'Başlık gerekli'),
  description: z.string().optional(),
  channels: z.array(z.string()).min(1, 'En az bir kanal seçin'),
  status: z.enum(['planned', 'in_progress', 'completed']),
  scheduled_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  url: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
  notes: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  content_type: z.enum(['post', 'story', 'reel', 'article', 'newsletter', 'ad']).nullable().optional(),
  deadline: z.string().optional(),
  campaign_id: z.string().nullable().optional(),
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
  })).optional(),
})

type FormData = z.infer<typeof formSchema>

interface ItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: MarketingItem | null
  defaultDate?: string | null
}

const statusColors = {
  planned: 'bg-amber-100 text-amber-800 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
}

const statusIcons = {
  planned: Clock,
  in_progress: Loader2,
  completed: CheckCircle2,
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return File
  if (fileType.startsWith('image/')) return Image
  if (fileType === 'application/pdf') return FileText
  return File
}

export function ItemFormDialog({ open, onOpenChange, item, defaultDate }: ItemFormDialogProps) {
  const createItem = useCreateMarketingItem()
  const updateItem = useUpdateMarketingItem()
  const deleteItem = useDeleteMarketingItem()
  const { data: channels, isLoading: channelsLoading } = useChannels()
  const { data: attachments } = useAttachments(item?.id)
  const uploadAttachment = useUploadAttachment()
  const deleteAttachment = useDeleteAttachment()

  const [activeTab, setActiveTab] = useState<'details' | 'settings' | 'media'>('details')
  const [isDragging, setIsDragging] = useState(false)
  const isEditing = !!item

  const handleDelete = async () => {
    if (!item) return
    if (confirm('Bu içeriği silmek istediğinize emin misiniz?')) {
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
      status: 'planned',
      scheduled_date: '',
      scheduled_time: '',
      url: '',
      notes: '',
      priority: 'normal',
      content_type: null,
      deadline: '',
      campaign_id: null,
      checklist: [],
    },
  })

  const watchedChannels = watch('channels')
  const watchedStatus = watch('status')
  const watchedPriority = watch('priority')
  const watchedContentType = watch('content_type')
  const watchedChecklist = watch('checklist') || []
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
      // Support both old single channel and new multiple channels
      const itemChannels = (item as MarketingItem & { channels?: string[] }).channels ||
        (item.channel ? [item.channel] : [])
      reset({
        title: item.title,
        description: item.description || '',
        channels: itemChannels,
        status: item.status,
        scheduled_date: item.scheduled_date || '',
        scheduled_time: item.scheduled_time || '',
        url: (item as MarketingItem & { url?: string }).url || '',
        notes: item.notes || '',
      })
    } else if (channels && channels.length > 0) {
      reset({
        title: '',
        description: '',
        channels: [],
        status: 'planned',
        scheduled_date: defaultDate || '',
        scheduled_time: '',
        url: '',
        notes: '',
      })
    }
    setActiveTab('details')
  }, [item, reset, channels, open, defaultDate])

  const onSubmit = async (data: FormData) => {
    const payload = {
      title: data.title,
      description: data.description || null,
      channels: data.channels as ChannelType[],
      channel: data.channels[0] as ChannelType, // Keep first channel for backwards compatibility
      status: data.status as ItemStatus,
      scheduled_date: data.scheduled_date || null,
      scheduled_time: data.scheduled_time || null,
      url: data.url || null,
      notes: data.notes || null,
    }

    if (isEditing && item) {
      await updateItem.mutateAsync({ id: item.id, ...payload })
    } else {
      await createItem.mutateAsync(payload)
    }

    onOpenChange(false)
    reset()
  }

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (!item?.id) return

    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      await uploadAttachment.mutateAsync({ file, marketingItemId: item.id })
    }
  }, [item?.id, uploadAttachment])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!item?.id || !e.target.files) return

    const files = Array.from(e.target.files)
    for (const file of files) {
      await uploadAttachment.mutateAsync({ file, marketingItemId: item.id })
    }
    e.target.value = ''
  }

  const handleDeleteAttachment = async (attachmentId: string, url: string) => {
    if (!item?.id) return
    await deleteAttachment.mutateAsync({ id: attachmentId, url, marketingItemId: item.id })
  }

  const StatusIcon = statusIcons[watchedStatus] || statusIcons.planned

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {isEditing ? 'İçeriği Düzenle' : 'Yeni İçerik'}
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
          {isEditing && (
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
                onClick={() => setActiveTab('media')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'media'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Medya ({attachments?.length || 0})
              </button>
            </div>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'details' ? (
            <form id="item-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Main Content */}
                <div className="space-y-5">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">Başlık *</label>
                    <Input
                      {...register('title')}
                      placeholder="İçerik başlığını girin..."
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
                      placeholder="İçerik açıklaması..."
                      className="min-h-[140px] resize-none"
                    />
                  </div>

                  {/* URL */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                      <Link className="h-4 w-4 text-neutral-400" />
                      URL / Link
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
                      placeholder="Ek notlar, hatırlatmalar..."
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                {/* Right Column - Settings & Schedule */}
                <div className="space-y-5">
                  {/* Channels - Multi Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">Kanallar *</label>
                    {channelsLoading ? (
                      <div className="flex items-center gap-2 h-11 px-3 border rounded-lg bg-neutral-50">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-neutral-500">Yükleniyor...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
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
                        {errors.channels && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.channels.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">Durum</label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Durum seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([value, label]) => {
                              const Icon = statusIcons[value as keyof typeof statusIcons]
                              return (
                                <SelectItem key={value} value={value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {label}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Schedule Box */}
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                      <Calendar className="h-4 w-4" />
                      Zamanlama
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-500">Tarih</label>
                        <Input type="date" {...register('scheduled_date')} className="h-10" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-500">Saat</label>
                        <Input type="time" {...register('scheduled_time')} className="h-10" />
                      </div>
                    </div>
                  </div>

                  {/* Quick file upload for new items */}
                  {!isEditing && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                        <Upload className="h-4 w-4" />
                        Dosya Ekle
                      </div>
                      <p className="text-xs text-blue-600">
                        İçeriği kaydettikten sonra Medya sekmesinden dosya yükleyebilirsiniz.
                      </p>
                    </div>
                  )}

                  {/* Status Preview */}
                  <div className="p-4 bg-gradient-to-br from-neutral-50 to-white rounded-xl border space-y-3">
                    <div className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Önizleme</div>
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {watchedStatus && (
                        <Badge className={`text-xs border ${statusColors[watchedStatus] || ''}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[watchedStatus] || ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* Media Tab */
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="p-4 bg-neutral-100 rounded-full">
                    <Upload className="h-6 w-6 text-neutral-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">
                      Dosya yüklemek için tıklayın veya sürükleyin
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Resim, PDF, Word desteklenir (Max 10MB)
                    </p>
                  </div>
                </label>
              </div>

              {/* Uploading indicator */}
              {uploadAttachment.isPending && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-700">Yükleniyor...</span>
                </div>
              )}

              {/* Attachments List */}
              {attachments && attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-neutral-700">Yüklenen Dosyalar</p>
                  <div className="grid gap-2">
                    {attachments.map((attachment) => {
                      const FileIcon = getFileIcon(attachment.file_type)
                      const isImage = attachment.file_type?.startsWith('image/')

                      return (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg group hover:bg-neutral-100 transition-colors"
                        >
                          {isImage ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border">
                              <FileIcon className="h-6 w-6 text-neutral-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {attachment.file_size && formatFileSize(attachment.file_size)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(attachment.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAttachment(attachment.id, attachment.url)}
                              disabled={deleteAttachment.isPending}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {(!attachments || attachments.length === 0) && !uploadAttachment.isPending && (
                <div className="text-center py-8 text-neutral-400">
                  <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Henüz dosya yüklenmemiş</p>
                </div>
              )}
            </div>
          )}
        </div>

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
              İptal
            </Button>
            <Button
              type="submit"
              form="item-form"
              disabled={createItem.isPending || updateItem.isPending}
            >
              {createItem.isPending || updateItem.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : isEditing ? (
                'Güncelle'
              ) : (
                'Ekle'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
