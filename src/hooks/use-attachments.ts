'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Attachment } from '@/types/database'

export function useAttachments(marketingItemId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['attachments', marketingItemId],
    queryFn: async () => {
      if (!marketingItemId) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('attachments')
        .select('*')
        .eq('marketing_item_id', marketingItemId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Attachment[]
    },
    enabled: !!marketingItemId,
  })
}

export function useUploadAttachment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      file,
      marketingItemId
    }: {
      file: File
      marketingItemId: string
    }) => {
      // Generate unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${marketingItemId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName)

      // Create attachment record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('attachments')
        .insert({
          marketing_item_id: marketingItemId,
          name: file.name,
          url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single()

      if (error) throw error
      return data as Attachment
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', variables.marketingItemId] })
    },
  })
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, url, marketingItemId }: { id: string; url: string; marketingItemId: string }) => {
      // Extract file path from URL
      const urlParts = url.split('/attachments/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage.from('attachments').remove([filePath])
      }

      // Delete record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('attachments')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', variables.marketingItemId] })
    },
  })
}
