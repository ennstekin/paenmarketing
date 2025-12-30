'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/types/database'

type CreateUserInput = {
  email: string
  password: string
  full_name?: string
  role: UserRole
}

type UpdateUserInput = {
  id: string
  full_name?: string
  role?: UserRole
}

export function useUsers() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Profile[]
    },
  })
}

export function useCurrentUser() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data as Profile
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role } as never)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data as Profile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useToggleUserActive() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active: isActive } as never)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data as Profile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.full_name,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Kullanıcı oluşturulamadı')

      // Update profile with role (trigger will create the profile)
      // Wait a bit for the trigger to create the profile
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: input.role,
          full_name: input.full_name
        } as never)
        .eq('id', authData.user.id)

      if (updateError) throw updateError

      return authData.user
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateUserInput) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Profile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      // Note: This will only deactivate the user, not delete from auth
      // Full deletion requires admin API access
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false } as never)
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
