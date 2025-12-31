'use client'

import { useMemo } from 'react'
import { useCurrentUser } from './use-users'
import {
  hasPermission,
  canEditItem,
  canDeleteItem,
  isAdmin,
  isAdminOrEditor,
  getAllowedActions,
  type Resource,
  type Action,
  type UserRole,
} from '@/lib/auth/permissions'

/**
 * Hook to check permissions for the current user
 */
export function usePermissions() {
  const { data: currentUser, isLoading } = useCurrentUser()

  const role = currentUser?.role as UserRole | undefined

  return useMemo(
    () => ({
      isLoading,
      role,
      isAdmin: isAdmin(role),
      isAdminOrEditor: isAdminOrEditor(role),

      /**
       * Check if user has permission for action on resource
       */
      can: (resource: Resource, action: Action) => hasPermission(role, resource, action),

      /**
       * Check if user can edit a specific item
       */
      canEdit: (itemOwnerId: string | undefined | null) =>
        canEditItem(role, currentUser?.id, itemOwnerId),

      /**
       * Check if user can delete items
       */
      canDelete: canDeleteItem(role),

      /**
       * Get all allowed actions for a resource
       */
      getAllowed: (resource: Resource) => getAllowedActions(role, resource),
    }),
    [role, currentUser?.id, isLoading]
  )
}

/**
 * Hook to check a specific permission
 */
export function usePermission(resource: Resource, action: Action) {
  const { data: currentUser, isLoading } = useCurrentUser()
  const role = currentUser?.role as UserRole | undefined

  return {
    isLoading,
    allowed: hasPermission(role, resource, action),
  }
}

/**
 * Hook to check if user can edit a specific item
 */
export function useCanEdit(itemOwnerId: string | undefined | null) {
  const { data: currentUser, isLoading } = useCurrentUser()
  const role = currentUser?.role as UserRole | undefined

  return {
    isLoading,
    canEdit: canEditItem(role, currentUser?.id, itemOwnerId),
  }
}
