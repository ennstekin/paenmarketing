'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { MarketingItem, ChannelType, ItemStatus, Priority, ContentType, Json } from '@/types/database'

type CreateItemInput = {
  title: string
  description?: string | null
  channel: ChannelType
  channels?: ChannelType[]
  status?: ItemStatus
  scheduled_date?: string | null
  scheduled_time?: string | null
  notes?: string | null
  target_audience?: string | null
  budget?: number | null
  priority?: Priority
  content_type?: ContentType | null
  deadline?: string | null
  campaign_id?: string | null
  checklist?: Json
  assigned_to?: string | null
  assigned_by?: string | null
  is_idea?: boolean
}

type CreateIdeaInput = {
  title: string
  description?: string | null
  channel?: ChannelType
  channels?: ChannelType[]
  notes?: string | null
  url?: string | null
  priority?: Priority
  content_type?: ContentType | null
  assigned_to?: string | null
}

type UpdateItemInput = {
  id: string
  title?: string
  description?: string | null
  channel?: ChannelType
  channels?: ChannelType[]
  status?: ItemStatus
  scheduled_date?: string | null
  scheduled_time?: string | null
  notes?: string | null
  url?: string | null
  target_audience?: string | null
  budget?: number | null
  priority?: Priority
  content_type?: ContentType | null
  deadline?: string | null
  campaign_id?: string | null
  checklist?: Json
  assigned_to?: string | null
  assigned_by?: string | null
  is_idea?: boolean
  is_standby?: boolean
}

export function useMarketingItems() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['marketing-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_items')
        .select('*, item_tags(tag_id, tags(*))')
        .or('is_idea.is.null,is_idea.eq.false')
        .order('scheduled_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform to include tags array
      type ItemWithTags = MarketingItem & {
        item_tags?: { tag_id: string; tags: { id: string; user_id: string; name: string; color: string; created_at: string } }[]
      }

      return (data as ItemWithTags[]).map(item => ({
        ...item,
        tags: item.item_tags?.map(it => it.tags) || [],
        item_tags: undefined, // Remove the raw join data
      })) as MarketingItem[]
    },
  })
}

export function useMarketingItemsByStatus(status: ItemStatus) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['marketing-items', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_items')
        .select('*')
        .eq('status', status)
        .order('scheduled_date', { ascending: true })

      if (error) throw error
      return data as MarketingItem[]
    },
  })
}

export function useMarketingItemsByChannel(channel: ChannelType) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['marketing-items', 'channel', channel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_items')
        .select('*')
        .eq('channel', channel)
        .order('scheduled_date', { ascending: true })

      if (error) throw error
      return data as MarketingItem[]
    },
  })
}

export function useCreateMarketingItem() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (item: CreateItemInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('marketing_items')
        .insert({
          ...item,
          user_id: user.id,
        } as never)
        .select()
        .single()

      if (error) throw error
      return data as MarketingItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-items'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useUpdateMarketingItem() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateItemInput) => {
      const { data, error } = await supabase
        .from('marketing_items')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MarketingItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-items'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useDeleteMarketingItem() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_items')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-items'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_items')
        .select('channel, status, scheduled_date')
        .or('is_idea.is.null,is_idea.eq.false')
        .or('is_standby.is.null,is_standby.eq.false')

      if (error) throw error

      const items = data as Pick<MarketingItem, 'channel' | 'status' | 'scheduled_date'>[]

      const byChannel = items.reduce((acc, item) => {
        acc[item.channel] = (acc[item.channel] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const byStatus = items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const total = items.length
      const completed = byStatus.completed || 0
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const upcoming = items.filter((item) => {
        if (!item.scheduled_date) return false
        const date = new Date(item.scheduled_date)
        return date >= today && item.status !== 'completed'
      }).length

      return {
        total,
        byChannel,
        byStatus,
        completionRate,
        upcoming,
      }
    },
  })
}

// Ideas Pool hooks
export function useIdeas() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['ideas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_items')
        .select('*')
        .eq('is_idea', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as MarketingItem[]
    },
  })
}

export function useCreateIdea() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateIdeaInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('marketing_items')
        .insert({
          title: input.title,
          description: input.description || null,
          notes: input.notes || null,
          url: input.url || null,
          priority: input.priority || 'normal',
          content_type: input.content_type || null,
          assigned_to: input.assigned_to || null,
          user_id: user.id,
          is_idea: true,
          channel: input.channel || 'other',
          channels: input.channels || [],
          status: 'planned',
        } as never)
        .select()
        .single()

      if (error) throw error
      return data as MarketingItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
    },
  })
}

export function useMoveIdeaToCalendar() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, scheduled_date, scheduled_time }: {
      id: string
      scheduled_date: string
      scheduled_time?: string
    }) => {
      const { data, error } = await supabase
        .from('marketing_items')
        .update({
          is_idea: false,
          scheduled_date,
          scheduled_time: scheduled_time || null,
          status: 'planned'
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MarketingItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-items'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useDeleteIdea() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_items')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
    },
  })
}

// Stand By hooks
export function useStandByItems() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['standby-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_items')
        .select('*')
        .eq('is_standby', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as MarketingItem[]
    },
  })
}

type CreateStandByInput = {
  title: string
  description?: string | null
  channel?: ChannelType
  channels?: ChannelType[]
  notes?: string | null
  url?: string | null
  priority?: Priority
  content_type?: ContentType | null
  assigned_to?: string | null
}

export function useCreateStandByItem() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateStandByInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('marketing_items')
        .insert({
          title: input.title,
          description: input.description || null,
          notes: input.notes || null,
          url: input.url || null,
          priority: input.priority || 'normal',
          content_type: input.content_type || null,
          assigned_to: input.assigned_to || null,
          user_id: user.id,
          is_standby: true,
          is_idea: false,
          channel: input.channel || 'other',
          channels: input.channels || [],
          status: 'planned',
        } as never)
        .select()
        .single()

      if (error) throw error
      return data as MarketingItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standby-items'] })
    },
  })
}

export function useMoveStandByToCalendar() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, scheduled_date, scheduled_time }: {
      id: string
      scheduled_date: string
      scheduled_time?: string
    }) => {
      const { data, error } = await supabase
        .from('marketing_items')
        .update({
          is_standby: false,
          scheduled_date,
          scheduled_time: scheduled_time || null,
          status: 'planned'
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MarketingItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standby-items'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-items'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useDeleteStandByItem() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_items')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standby-items'] })
    },
  })
}

// Move Idea to Stand By
export function useMoveIdeaToStandBy() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('marketing_items')
        .update({
          is_idea: false,
          is_standby: true,
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MarketingItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      queryClient.invalidateQueries({ queryKey: ['standby-items'] })
    },
  })
}

// Move Stand By to Ideas
export function useMoveStandByToIdeas() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('marketing_items')
        .update({
          is_idea: true,
          is_standby: false,
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MarketingItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      queryClient.invalidateQueries({ queryKey: ['standby-items'] })
    },
  })
}

// Move Calendar item to Stand By
export function useMoveCalendarToStandBy() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('marketing_items')
        .update({
          is_standby: true,
          scheduled_date: null,
          scheduled_time: null,
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MarketingItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-items'] })
      queryClient.invalidateQueries({ queryKey: ['standby-items'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
