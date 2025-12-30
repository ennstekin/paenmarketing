'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ActivityLog, Profile } from '@/types/database'

export type ActivityLogWithUser = ActivityLog & {
  profiles: Pick<Profile, 'email' | 'full_name'> | null
}

export function useActivityLogs(limit = 50) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['activity-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profiles:user_id (email, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data as ActivityLogWithUser[]
    },
  })
}

export function useUserActivityLogs(userId: string, limit = 20) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['activity-logs', 'user', userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data as ActivityLog[]
    },
  })
}
