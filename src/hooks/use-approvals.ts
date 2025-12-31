'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ApprovalRequest, Profile, ApprovalStatus } from '@/types/database'

export interface ApprovalRequestWithUsers extends ApprovalRequest {
  requester: Pick<Profile, 'id' | 'email' | 'full_name'> | null
  reviewer: Pick<Profile, 'id' | 'email' | 'full_name'> | null
}

/**
 * Get approval requests for a marketing item
 */
export function useApprovalRequests(marketingItemId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['approvals', marketingItemId],
    queryFn: async () => {
      if (!marketingItemId) return []

      const { data, error } = await supabase
        .from('approval_requests')
        .select(`
          *,
          requester:profiles!requester_id(id, email, full_name),
          reviewer:profiles!reviewer_id(id, email, full_name)
        `)
        .eq('marketing_item_id', marketingItemId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ApprovalRequestWithUsers[]
    },
    enabled: !!marketingItemId,
  })
}

/**
 * Get pending approval requests for the current user (as reviewer)
 */
export function usePendingApprovals() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []

      // Get user's role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const profileData = profile as { role: string } | null
      const userRole = profileData?.role

      // Build query based on role
      let query = supabase
        .from('approval_requests')
        .select(`
          *,
          requester:profiles!requester_id(id, email, full_name),
          marketing_item:marketing_items!marketing_item_id(id, title)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      // If not admin, only show requests assigned to this user
      if (userRole !== 'admin') {
        query = query.eq('reviewer_id', user.id)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
  })
}

/**
 * Create a new approval request
 */
export function useCreateApprovalRequest() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      marketingItemId,
      reviewerId,
    }: {
      marketingItemId: string
      reviewerId?: string
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('approval_requests')
        .insert({
          marketing_item_id: marketingItemId,
          requester_id: user.id,
          reviewer_id: reviewerId || null,
        } as never)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['approvals', variables.marketingItemId],
      })
      queryClient.invalidateQueries({ queryKey: ['approvals', 'pending'] })
    },
  })
}

/**
 * Respond to an approval request
 */
export function useRespondToApproval() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
      marketingItemId,
    }: {
      id: string
      status: ApprovalStatus
      notes?: string
      marketingItemId: string
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('approval_requests')
        .update({
          status,
          notes: notes || null,
          reviewer_id: user.id,
          reviewed_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['approvals', variables.marketingItemId],
      })
      queryClient.invalidateQueries({ queryKey: ['approvals', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
