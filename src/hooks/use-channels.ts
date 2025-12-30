'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Channel, Database } from '@/types/database'

type ChannelInsert = Database['public']['Tables']['channels']['Insert']

export function useChannels() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('channels')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as Channel[]
    },
  })
}

export function useAllChannels() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['channels', 'all'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('channels')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as Channel[]
    },
  })
}

export function useCreateChannel() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (channel: ChannelInsert) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('channels')
        .insert(channel)
        .select()
        .single()

      if (error) throw error
      return data as Channel
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useUpdateChannel() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Channel> & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('channels')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Channel
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useDeleteChannel() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('channels')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

// Helper hook to get channel data by name
export function useChannelHelpers() {
  const { data: channels } = useChannels()

  const getChannelLabel = (name: string) => {
    return channels?.find(c => c.name === name)?.label || name
  }

  const getChannelColor = (name: string) => {
    return channels?.find(c => c.name === name)?.color || '#6b7280'
  }

  const getChannelIcon = (name: string) => {
    return channels?.find(c => c.name === name)?.icon || 'mail'
  }

  const channelLabels = channels?.reduce((acc, c) => ({ ...acc, [c.name]: c.label }), {} as Record<string, string>) || {}
  const channelColors = channels?.reduce((acc, c) => ({ ...acc, [c.name]: c.color }), {} as Record<string, string>) || {}

  return { channels, getChannelLabel, getChannelColor, getChannelIcon, channelLabels, channelColors }
}
