'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Comment, Profile } from '@/types/database'

export interface CommentWithUser extends Comment {
  user: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'> | null
  replies?: CommentWithUser[]
}

/**
 * Get all comments for a marketing item
 */
export function useComments(marketingItemId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['comments', marketingItemId],
    queryFn: async () => {
      if (!marketingItemId) return []

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles!user_id(id, email, full_name, avatar_url)
        `)
        .eq('marketing_item_id', marketingItemId)
        .is('parent_id', null)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Get replies for each comment
      const commentsWithReplies: CommentWithUser[] = []
      const commentList = (data || []) as Array<{ id: string; [key: string]: unknown }>
      for (const comment of commentList) {
        const { data: replies } = await supabase
          .from('comments')
          .select(`
            *,
            user:profiles!user_id(id, email, full_name, avatar_url)
          `)
          .eq('parent_id', comment.id)
          .order('created_at', { ascending: true })

        commentsWithReplies.push({
          ...comment,
          replies: replies || [],
        } as unknown as CommentWithUser)
      }

      return commentsWithReplies
    },
    enabled: !!marketingItemId,
  })
}

/**
 * Get comment count for a marketing item
 */
export function useCommentCount(marketingItemId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['comments', 'count', marketingItemId],
    queryFn: async () => {
      if (!marketingItemId) return 0

      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('marketing_item_id', marketingItemId)

      if (error) throw error
      return count || 0
    },
    enabled: !!marketingItemId,
  })
}

/**
 * Create a new comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      marketingItemId,
      content,
      parentId,
      mentions,
    }: {
      marketingItemId: string
      content: string
      parentId?: string
      mentions?: string[]
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('comments')
        .insert({
          marketing_item_id: marketingItemId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
          mentions: mentions || [],
        } as never)
        .select(`
          *,
          user:profiles!user_id(id, email, full_name, avatar_url)
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.marketingItemId],
      })
      queryClient.invalidateQueries({
        queryKey: ['comments', 'count', variables.marketingItemId],
      })
    },
  })
}

/**
 * Update a comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      content,
      marketingItemId,
    }: {
      id: string
      content: string
      marketingItemId: string
    }) => {
      const { data, error } = await supabase
        .from('comments')
        .update({
          content,
          is_edited: true,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.marketingItemId],
      })
    },
  })
}

/**
 * Delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      marketingItemId,
    }: {
      id: string
      marketingItemId: string
    }) => {
      const { error } = await supabase.from('comments').delete().eq('id', id as never)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.marketingItemId],
      })
      queryClient.invalidateQueries({
        queryKey: ['comments', 'count', variables.marketingItemId],
      })
    },
  })
}
