'use client'

import { useState } from 'react'
import {
  useUsers,
  useUpdateUserRole,
  useToggleUserActive,
  useCurrentUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/use-users'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Plus,
  Pencil,
  Trash2,
  Mail,
  AlertCircle,
} from 'lucide-react'
import type { Profile, UserRole } from '@/types/database'

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
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'viewer' as UserRole,
  })
  const [formError, setFormError] = useState('')

  const isAdmin = currentUser?.role === 'admin'

  const handleRoleChange = (userId: string, role: UserRole) => {
    updateRole.mutate({ userId, role })
  }

  const handleToggleActive = (userId: string, currentStatus: boolean) => {
    toggleActive.mutate({ userId, isActive: !currentStatus })
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'viewer',
    })
    setFormError('')
  }

  const handleAddUser = async () => {
    setFormError('')

    if (!formData.email || !formData.password) {
      setFormError('E-posta ve şifre zorunludur')
      return
    }

    if (formData.password.length < 6) {
      setFormError('Şifre en az 6 karakter olmalı')
      return
    }

    try {
      await createUser.mutateAsync({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name || undefined,
        role: formData.role,
      })
      setShowAddDialog(false)
      resetForm()
    } catch (error: any) {
      setFormError(error.message || 'Kullanıcı oluşturulurken hata oluştu')
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return

    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        full_name: formData.full_name || undefined,
        role: formData.role,
      })
      setEditingUser(null)
      resetForm()
    } catch (error: any) {
      setFormError(error.message || 'Kullanıcı güncellenirken hata oluştu')
    }
  }

  const openEditDialog = (user: Profile) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      role: user.role,
    })
    setFormError('')
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser.mutateAsync(userId)
      setDeleteConfirm(null)
    } catch (error: any) {
      alert(error.message || 'Kullanıcı silinirken hata oluştu')
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Kullanıcılar</h1>
          <p className="text-neutral-600 mt-1">Kullanıcıları ve izinlerini yönetin</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Kullanıcı Ekle
          </Button>
        )}
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
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {user.id !== currentUser?.id && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                              >
                                <Pencil className="h-4 w-4 text-neutral-600" />
                              </Button>
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm(user.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">
                E-posta <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  type="email"
                  placeholder="ornek@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">
                Şifre <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <p className="text-xs text-neutral-500">En az 6 karakter</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Ad Soyad</label>
              <Input
                type="text"
                placeholder="Ad Soyad"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Rol</label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editör</SelectItem>
                  <SelectItem value="viewer">Görüntüleyici</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
                İptal
              </Button>
              <Button onClick={handleAddUser} disabled={createUser.isPending}>
                {createUser.isPending ? 'Ekleniyor...' : 'Ekle'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">E-posta</label>
              <Input
                type="email"
                value={formData.email}
                disabled
                className="bg-neutral-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Ad Soyad</label>
              <Input
                type="text"
                placeholder="Ad Soyad"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Rol</label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editör</SelectItem>
                  <SelectItem value="viewer">Görüntüleyici</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => { setEditingUser(null); resetForm(); }}>
                İptal
              </Button>
              <Button onClick={handleEditUser} disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Sil</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-neutral-600">
              Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem kullanıcıyı pasif hale getirecektir.
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && handleDeleteUser(deleteConfirm)}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? 'Siliniyor...' : 'Sil'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
