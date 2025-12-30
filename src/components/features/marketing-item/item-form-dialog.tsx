'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useCreateMarketingItem, useUpdateMarketingItem, useDeleteMarketingItem } from '@/hooks/use-marketing-items'
import { useChannels } from '@/hooks/use-channels'
import { Trash2 } from 'lucide-react'
import type { MarketingItem, ChannelType, ItemStatus } from '@/types/database'
import { statusLabels } from '@/lib/utils'

const formSchema = z.object({
  title: z.string().min(1, 'Başlık gerekli'),
  description: z.string().optional(),
  channel: z.string().min(1, 'Kanal seçin'),
  status: z.enum(['planned', 'in_progress', 'completed']),
  scheduled_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface ItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: MarketingItem | null
}

export function ItemFormDialog({ open, onOpenChange, item }: ItemFormDialogProps) {
  const createItem = useCreateMarketingItem()
  const updateItem = useUpdateMarketingItem()
  const deleteItem = useDeleteMarketingItem()
  const { data: channels } = useChannels()
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
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      channel: '',
      status: 'planned',
      scheduled_date: '',
      scheduled_time: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        description: item.description || '',
        channel: item.channel,
        status: item.status,
        scheduled_date: item.scheduled_date || '',
        scheduled_time: item.scheduled_time || '',
        notes: item.notes || '',
      })
    } else {
      reset({
        title: '',
        description: '',
        channel: channels?.[0]?.name || '',
        status: 'planned',
        scheduled_date: '',
        scheduled_time: '',
        notes: '',
      })
    }
  }, [item, reset, channels])

  const onSubmit = async (data: FormData) => {
    const payload = {
      title: data.title,
      description: data.description || null,
      channel: data.channel as ChannelType,
      status: data.status as ItemStatus,
      scheduled_date: data.scheduled_date || null,
      scheduled_time: data.scheduled_time || null,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'İçeriği Düzenle' : 'Yeni İçerik Ekle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Başlık *</label>
            <Input {...register('title')} placeholder="İçerik başlığı" />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Açıklama</label>
            <Textarea {...register('description')} placeholder="İçerik açıklaması" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kanal *</label>
              <Controller
                name="channel"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kanal seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels?.map((channel) => (
                        <SelectItem key={channel.name} value={channel.name}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: channel.color }}
                            />
                            {channel.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tarih</label>
              <Input type="date" {...register('scheduled_date')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Saat</label>
              <Input type="time" {...register('scheduled_time')} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notlar</label>
            <Textarea {...register('notes')} placeholder="Ek notlar" />
          </div>

          <DialogFooter className="pt-4 flex justify-between">
            <div>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteItem.isPending}
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
                disabled={createItem.isPending || updateItem.isPending}
              >
                {createItem.isPending || updateItem.isPending
                  ? 'Kaydediliyor...'
                  : isEditing
                  ? 'Güncelle'
                  : 'Ekle'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
