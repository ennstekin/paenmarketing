'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tag } from '@/types/database'

// Get all tags
export function useTags() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data as Tag[]
    },
  })
}

// Get tags for a specific marketing item
export function useItemTags(marketingItemId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['item-tags', marketingItemId],
    queryFn: async () => {
      if (!marketingItemId) return []

      const { data, error } = await supabase
        .from('item_tags')
        .select('tag_id, tags(*)')
        .eq('marketing_item_id', marketingItemId)

      if (error) throw error

      // Extract tags from the join result
      return (data as { tag_id: string; tags: Tag }[]).map(item => item.tags)
    },
    enabled: !!marketingItemId,
  })
}

// Create a new tag
export function useCreateTag() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('tags')
        .insert({
          name,
          color,
          user_id: user.id,
        } as never)
        .select()
        .single()

      if (error) throw error
      return data as Tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

// Update a tag
export function useUpdateTag() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name?: string; color?: string }) => {
      const updates: { name?: string; color?: string } = {}
      if (name !== undefined) updates.name = name
      if (color !== undefined) updates.color = color

      const { data, error } = await supabase
        .from('tags')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['item-tags'] })
    },
  })
}

// Delete a tag
export function useDeleteTag() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['item-tags'] })
    },
  })
}

// Add tags to a marketing item
export function useAddItemTags() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ marketingItemId, tagIds }: { marketingItemId: string; tagIds: string[] }) => {
      // First, remove existing tags
      await supabase
        .from('item_tags')
        .delete()
        .eq('marketing_item_id', marketingItemId)

      // Then add new tags
      if (tagIds.length > 0) {
        const { error } = await supabase
          .from('item_tags')
          .insert(
            tagIds.map(tagId => ({
              marketing_item_id: marketingItemId,
              tag_id: tagId,
            })) as never
          )

        if (error) throw error
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['item-tags', variables.marketingItemId] })
      queryClient.invalidateQueries({ queryKey: ['marketing-items'] })
    },
  })
}

// Remove a tag from a marketing item
export function useRemoveItemTag() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ marketingItemId, tagId }: { marketingItemId: string; tagId: string }) => {
      const { error } = await supabase
        .from('item_tags')
        .delete()
        .eq('marketing_item_id', marketingItemId)
        .eq('tag_id', tagId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['item-tags', variables.marketingItemId] })
      queryClient.invalidateQueries({ queryKey: ['marketing-items'] })
    },
  })
}
