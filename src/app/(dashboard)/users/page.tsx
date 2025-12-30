'use client'

import { useState } from 'react'
import { useUsers, useUpdateUserRole, useToggleUserActive, useCurrentUser } from '@/hooks/use-users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, Shield, UserCheck, UserX } from 'lucide-react'
import type { UserRole } from '@/types/database'

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  editor: 'Editör',
  viewer: 'Görüntüleyici',
}

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800',
  editor: 'bg-blue-100 text-blue-800',
  viewer: 'bg-neutral-100 text-neutral-800',
}

export default function UsersPage() {
  const { data: users, isLoading } = useUsers()
  const { data: currentUser } = useCurrentUser()
  const updateRole = useUpdateUserRole()
  const toggleActive = useToggleUserActive()

  const isAdmin = currentUser?.role === 'admin'

  const handleRoleChange = (userId: string, role: UserRole) => {
    updateRole.mutate({ userId, role })
  }

  const handleToggleActive = (userId: string, currentStatus: boolean) => {
    toggleActive.mutate({ userId, isActive: !currentStatus })
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-48" />
          <div className="h-64 bg-neutral-200 rounded" />
        </div>
      </div>
    )
  }

  const totalUsers = users?.length || 0
  const activeUsers = users?.filter((u) => u.is_active).length || 0
  const adminCount = users?.filter((u) => u.role === 'admin').length || 0

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Kullanıcılar</h1>
        <p className="text-neutral-600 mt-1">Kullanıcıları ve izinlerini yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Toplam Kullanıcı</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Aktif Kullanıcı</p>
              <p className="text-2xl font-bold">{activeUsers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Admin</p>
              <p className="text-2xl font-bold">{adminCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tüm Kullanıcılar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-600">Kullanıcı</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-600">Rol</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-600">Durum</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-600">Son Giriş</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-600">Kayıt Tarihi</th>
                  {isAdmin && (
                    <th className="text-right py-3 px-4 font-medium text-neutral-600">İşlemler</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-neutral-600">
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">
                            {user.full_name || 'İsimsiz'}
                          </p>
                          <p className="text-sm text-neutral-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {isAdmin && user.id !== currentUser?.id ? (
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editör</SelectItem>
                            <SelectItem value="viewer">Görüntüleyici</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-neutral-100 text-neutral-800'
                        }
                      >
                        {user.is_active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString('tr-TR')
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600">
                      {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                          >
                            {user.is_active ? (
                              <UserX className="h-4 w-4 text-red-600" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
