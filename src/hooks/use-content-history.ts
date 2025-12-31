'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Json } from '@/types/database'

export interface ContentHistoryEntry {
  id: string
  marketing_item_id: string
  user_id: string | null
  action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'priority_changed'
  changes: Json
  created_at: string
  user?: Pick<Profile, 'id' | 'email' | 'full_name'> | null
}

/**
 * Get content history for a marketing item
 */
export function useContentHistory(marketingItemId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['content-history', marketingItemId],
    queryFn: async () => {
      if (!marketingItemId) return []

      const { data, error } = await supabase
        .from('content_history')
        .select(`
          *,
          user:profiles!user_id(id, email, full_name)
        `)
        .eq('marketing_item_id', marketingItemId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as ContentHistoryEntry[]
    },
    enabled: !!marketingItemId,
  })
}

/**
 * Get action label in Turkish
 */
export function getActionLabel(action: ContentHistoryEntry['action']): string {
  const labels: Record<ContentHistoryEntry['action'], string> = {
    created: 'Oluşturuldu',
    updated: 'Güncellendi',
    status_changed: 'Durum değişti',
    assigned: 'Atandı',
    priority_changed: 'Öncelik değişti',
  }
  return labels[action] || action
}

/**
 * Format changes for display
 */
export function formatChanges(changes: Json): string[] {
  if (!changes || typeof changes !== 'object') return []

  const formatted: string[] = []
  const changesObj = changes as Record<string, { old?: string; new?: string }>

  for (const [field, change] of Object.entries(changesObj)) {
    if (change && typeof change === 'object' && 'old' in change && 'new' in change) {
      formatted.push(`${field}: "${change.old || '-'}" → "${change.new || '-'}"`)
    }
  }

  return formatted
}
