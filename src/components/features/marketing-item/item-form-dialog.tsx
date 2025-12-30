'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateMarketingItem, useUpdateMarketingItem } from '@/hooks/use-marketing-items'
import type { MarketingItem, ChannelType, ItemStatus } from '@/types/database'
import { channelLabels, statusLabels } from '@/lib/utils'

const formSchema = z.object({
  title: z.string().min(1, 'Başlık gerekli'),
  description: z.string().optional(),
  channel: z.enum(['email', 'sms', 'meta_ads', 'instagram']),
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
  const isEditing = !!item

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      channel: 'instagram',
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
        channel: 'instagram',
        status: 'planned',
        scheduled_date: '',
        scheduled_time: '',
        notes: '',
      })
    }
  }, [item, reset])

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
              <Select {...register('channel')}>
                {Object.entries(channelLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select {...register('status')}>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
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

          <DialogFooter className="pt-4">
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
