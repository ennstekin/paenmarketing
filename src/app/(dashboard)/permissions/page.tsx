'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Check, X } from 'lucide-react'
import type { Permission, UserRole } from '@/types/database'

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  editor: 'Editör',
  viewer: 'Görüntüleyici',
}

const roleDescriptions: Record<UserRole, string> = {
  admin: 'Tam yetkili. Tüm işlemleri yapabilir.',
  editor: 'İçerik oluşturabilir ve düzenleyebilir.',
  viewer: 'Sadece görüntüleme yetkisi.',
}

const resourceLabels: Record<string, string> = {
  marketing_items: 'Marketing Items',
  users: 'Kullanıcılar',
  logs: 'Loglar',
  settings: 'Ayarlar',
}

const actionLabels: Record<string, string> = {
  create: 'Oluştur',
  read: 'Görüntüle',
  update: 'Düzenle',
  delete: 'Sil',
}

export default function PermissionsPage() {
  const supabase = createClient()

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('role')
        .order('resource')
        .order('action')

      if (error) throw error
      return data as Permission[]
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-48" />
          <div className="h-96 bg-neutral-200 rounded" />
        </div>
      </div>
    )
  }

  // Group permissions by role
  const permissionsByRole = permissions?.reduce(
    (acc, perm) => {
      if (!acc[perm.role]) {
        acc[perm.role] = []
      }
      acc[perm.role].push(perm)
      return acc
    },
    {} as Record<UserRole, Permission[]>
  )

  // Get unique resources
  const resources = [...new Set(permissions?.map((p) => p.resource) || [])]
  const actions = ['create', 'read', 'update', 'delete']

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">İzinler</h1>
        <p className="text-neutral-600 mt-1">Rol bazlı izin matrisini görüntüleyin</p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['admin', 'editor', 'viewer'] as UserRole[]).map((role) => (
          <Card key={role}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`p-2 rounded-lg ${
                    role === 'admin'
                      ? 'bg-red-100'
                      : role === 'editor'
                        ? 'bg-blue-100'
                        : 'bg-neutral-100'
                  }`}
                >
                  <Shield
                    className={`h-5 w-5 ${
                      role === 'admin'
                        ? 'text-red-600'
                        : role === 'editor'
                          ? 'text-blue-600'
                          : 'text-neutral-600'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{roleLabels[role]}</h3>
                  <p className="text-sm text-neutral-500">{roleDescriptions[role]}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>İzin Matrisi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-600">Kaynak</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-600">İşlem</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-600">Admin</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-600">Editör</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-600">Görüntüleyici</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((resource) =>
                  actions.map((action, actionIndex) => {
                    const adminPerm = permissions?.find(
                      (p) => p.role === 'admin' && p.resource === resource && p.action === action
                    )
                    const editorPerm = permissions?.find(
                      (p) => p.role === 'editor' && p.resource === resource && p.action === action
                    )
                    const viewerPerm = permissions?.find(
                      (p) => p.role === 'viewer' && p.resource === resource && p.action === action
                    )

                    return (
                      <tr
                        key={`${resource}-${action}`}
                        className="border-b border-neutral-100 hover:bg-neutral-50"
                      >
                        <td className="py-3 px-4">
                          {actionIndex === 0 && (
                            <span className="font-medium">{resourceLabels[resource] || resource}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-600">
                          {actionLabels[action] || action}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {adminPerm?.allowed ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {editorPerm?.allowed ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {viewerPerm?.allowed ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>İzin Verildi</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-600" />
              <span>İzin Yok</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
