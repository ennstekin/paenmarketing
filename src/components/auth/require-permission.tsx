'use client'

import { type ReactNode } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import type { Resource, Action } from '@/lib/auth/permissions'

interface RequirePermissionProps {
  resource: Resource
  action: Action
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function RequirePermission({
  resource,
  action,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const { can, isLoading } = usePermissions()

  if (isLoading) {
    return null
  }

  if (!can(resource, action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface RequireAdminProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Component that only renders for admin users
 */
export function RequireAdmin({ children, fallback = null }: RequireAdminProps) {
  const { isAdmin, isLoading } = usePermissions()

  if (isLoading) {
    return null
  }

  if (!isAdmin) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface RequireEditorProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Component that renders for admin or editor users
 */
export function RequireEditor({ children, fallback = null }: RequireEditorProps) {
  const { isAdminOrEditor, isLoading } = usePermissions()

  if (isLoading) {
    return null
  }

  if (!isAdminOrEditor) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
