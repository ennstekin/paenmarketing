'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Channel, Database } from '@/types/database'

type ChannelInsert = Database['public']['Tables']['channels']['Insert']

// Default channels when database is empty
const DEFAULT_CHANNELS: Channel[] = [
  { id: 'default-email', name: 'email', label: 'E-posta', color: '#3b82f6', icon: 'mail', is_active: true, sort_order: 0, created_at: '', updated_at: '' },
  { id: 'default-sms', name: 'sms', label: 'SMS', color: '#22c55e', icon: 'message-square', is_active: true, sort_order: 1, created_at: '', updated_at: '' },
  { id: 'default-meta', name: 'meta_ads', label: 'Meta Ads', color: '#8b5cf6', icon: 'megaphone', is_active: true, sort_order: 2, created_at: '', updated_at: '' },
  { id: 'default-instagram', name: 'instagram', label: 'Instagram', color: '#ec4899', icon: 'instagram', is_active: true, sort_order: 3, created_at: '', updated_at: '' },
]

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
      // Return default channels if database is empty
      if (!data || data.length === 0) {
        return DEFAULT_CHANNELS
      }
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
      // Return default channels if database is empty
      if (!data || data.length === 0) {
        return DEFAULT_CHANNELS
      }
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
  const { data: channels, isLoading } = useChannels()

  // Create lookup maps for quick access
  const channelMap = channels?.reduce((acc, c) => {
    acc[c.name] = c
    return acc
  }, {} as Record<string, Channel>) || {}

  const getChannelLabel = (name: string) => {
    return channelMap[name]?.label || name
  }

  const getChannelColor = (name: string) => {
    return channelMap[name]?.color || '#6b7280'
  }

  const getChannelIcon = (name: string) => {
    return channelMap[name]?.icon || 'mail'
  }

  const channelLabels = channels?.reduce((acc, c) => ({ ...acc, [c.name]: c.label }), {} as Record<string, string>) || {}
  const channelColors = channels?.reduce((acc, c) => ({ ...acc, [c.name]: c.color }), {} as Record<string, string>) || {}

  return { channels, isLoading, getChannelLabel, getChannelColor, getChannelIcon, channelLabels, channelColors }
}
