'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/types/database'

export interface Campaign {
  id: string
  user_id: string | null
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: 'draft' | 'active' | 'completed' | 'archived'
  color: string
  created_at: string
  updated_at: string
}

export interface CampaignWithStats extends Campaign {
  item_count: number
  completed_count: number
}

/**
 * Get all campaigns
 */
export function useCampaigns() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Campaign[]
    },
  })
}

/**
 * Get campaigns with item stats
 */
export function useCampaignsWithStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['campaigns', 'with-stats'],
    queryFn: async () => {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get item counts for each campaign
      const campaignsWithStats: CampaignWithStats[] = []
      const campaignList = (campaigns || []) as Campaign[]
      for (const campaign of campaignList) {
        const { count: itemCount } = await supabase
          .from('marketing_items')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)

        const { count: completedCount } = await supabase
          .from('marketing_items')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('status', 'completed')

        campaignsWithStats.push({
          ...campaign,
          item_count: itemCount || 0,
          completed_count: completedCount || 0,
        })
      }

      return campaignsWithStats
    },
  })
}

/**
 * Get a single campaign
 */
export function useCampaign(id: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['campaigns', id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Campaign
    },
    enabled: !!id,
  })
}

/**
 * Create a new campaign
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: {
      name: string
      description?: string
      start_date?: string
      end_date?: string
      status?: Campaign['status']
      color?: string
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description || null,
          start_date: input.start_date || null,
          end_date: input.end_date || null,
          status: input.status || 'active',
          color: input.color || '#6366f1',
        } as never)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

/**
 * Update a campaign
 */
export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string
      name?: string
      description?: string | null
      start_date?: string | null
      end_date?: string | null
      status?: Campaign['status']
      color?: string
    }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.id] })
    },
  })
}

/**
 * Delete a campaign
 */
export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaigns').delete().eq('id', id as never)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}
