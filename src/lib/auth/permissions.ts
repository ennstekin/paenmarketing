// Permission utilities for frontend authorization checks

export type UserRole = 'admin' | 'editor' | 'viewer'

export type Resource = 'marketing_items' | 'users' | 'settings' | 'channels' | 'tags' | 'logs'

export type Action = 'create' | 'read' | 'update' | 'delete'

// Permission matrix
const permissionMatrix: Record<UserRole, Record<Resource, Action[]>> = {
  admin: {
    marketing_items: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update'],
    channels: ['create', 'read', 'update', 'delete'],
    tags: ['create', 'read', 'update', 'delete'],
    logs: ['read'],
  },
  editor: {
    marketing_items: ['create', 'read', 'update'],
    users: ['read'],
    settings: ['read'],
    channels: ['read'],
    tags: ['create', 'read', 'update'],
    logs: [],
  },
  viewer: {
    marketing_items: ['read'],
    users: [],
    settings: ['read'],
    channels: ['read'],
    tags: ['read'],
    logs: [],
  },
}

/**
 * Check if a user role has permission for a specific action on a resource
 */
export function hasPermission(
  role: UserRole | undefined | null,
  resource: Resource,
  action: Action
): boolean {
  if (!role) return false
  const resourcePermissions = permissionMatrix[role]?.[resource]
  return resourcePermissions?.includes(action) ?? false
}

/**
 * Check if user can edit an item (owner or admin/editor)
 */
export function canEditItem(
  userRole: UserRole | undefined | null,
  userId: string | undefined | null,
  itemOwnerId: string | undefined | null
): boolean {
  if (!userRole || !userId) return false

  // Admin and editor can edit any item
  if (userRole === 'admin' || userRole === 'editor') return true

  // Owner can edit their own item
  return userId === itemOwnerId
}

/**
 * Check if user can delete an item (only admin)
 */
export function canDeleteItem(role: UserRole | undefined | null): boolean {
  return role === 'admin'
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === 'admin'
}

/**
 * Check if user is admin or editor
 */
export function isAdminOrEditor(role: UserRole | undefined | null): boolean {
  return role === 'admin' || role === 'editor'
}

/**
 * Get all allowed actions for a resource and role
 */
export function getAllowedActions(
  role: UserRole | undefined | null,
  resource: Resource
): Action[] {
  if (!role) return []
  return permissionMatrix[role]?.[resource] ?? []
}
