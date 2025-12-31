'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from './use-users'

/**
 * Subscribe to real-time comments for a marketing item
 */
export function useRealtimeComments(marketingItemId: string | undefined) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    if (!marketingItemId) return

    const channel = supabase
      .channel(`comments:${marketingItemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `marketing_item_id=eq.${marketingItemId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['comments', marketingItemId],
          })
          queryClient.invalidateQueries({
            queryKey: ['comments', 'count', marketingItemId],
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [marketingItemId, queryClient, supabase])
}

/**
 * Subscribe to real-time notifications for the current user
 */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { data: currentUser } = useCurrentUser()

  useEffect(() => {
    if (!currentUser?.id) return

    const channel = supabase
      .channel(`notifications:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          // Could also trigger a toast notification here
          console.log('New notification:', payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id, queryClient, supabase])
}

/**
 * Subscribe to real-time marketing item updates
 */
export function useRealtimeMarketingItems() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('marketing_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketing_items',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['marketing-items'] })
          queryClient.invalidateQueries({ queryKey: ['stats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, supabase])
}

/**
 * Subscribe to real-time approval request updates
 */
export function useRealtimeApprovals(marketingItemId?: string) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    const filter = marketingItemId
      ? `marketing_item_id=eq.${marketingItemId}`
      : undefined

    const channel = supabase
      .channel(
        marketingItemId ? `approvals:${marketingItemId}` : 'approvals:all'
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approval_requests',
          filter,
        },
        () => {
          if (marketingItemId) {
            queryClient.invalidateQueries({
              queryKey: ['approvals', marketingItemId],
            })
          }
          queryClient.invalidateQueries({ queryKey: ['approvals', 'pending'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [marketingItemId, queryClient, supabase])
}
