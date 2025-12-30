'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  useUsers,
  useUpdateUserRole,
  useToggleUserActive,
  useCurrentUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/use-users'
import { useActivityLogs } from '@/hooks/use-activity-logs'
import { useQuery } from '@tanstack/react-query'
import {
  User,
  Users,
  Shield,
  Activity,
  UserCheck,
  UserX,
  Plus,
  Pencil,
  Trash2,
  Mail,
  AlertCircle,
  Check,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { Profile, UserRole, Permission } from '@/types/database'

const tabs = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'users', label: 'Kullanıcılar', icon: Users },
  { id: 'permissions', label: 'İzinler', icon: Shield },
  { id: 'logs', label: 'Loglar', icon: Activity },
]

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

const actionLabels: Record<string, string> = {
  create: 'Oluşturuldu',
  update: 'Güncellendi',
  delete: 'Silindi',
  login: 'Giriş Yaptı',
  logout: 'Çıkış Yaptı',
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-neutral-100 text-neutral-800',
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const { data: currentUser } = useCurrentUser()
  const isAdmin = currentUser?.role === 'admin'

  return (
    <div>
      <Header title="Ayarlar" />
      <div className="p-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-neutral-200 pb-4">
          {tabs.map((tab) => {
            // Hide admin-only tabs for non-admins
            if (['users', 'permissions', 'logs'].includes(tab.id) && !isAdmin) {
              return null
            }
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'users' && isAdmin && <UsersTab />}
        {activeTab === 'permissions' && isAdmin && <PermissionsTab />}
        {activeTab === 'logs' && isAdmin && <LogsTab />}
      </div>
    </div>
  )
}

// Profile Tab
function ProfileTab() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
        setFullName(user.user_metadata?.full_name || '')
      }
    }
    loadProfile()
  }, [supabase])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profil güncellendi' })
    }

    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profil Ayarları</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} disabled className="bg-neutral-50" />
              <p className="text-xs text-neutral-500">
                Email adresi değiştirilemez
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ad Soyad</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Adınız Soyadınız"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Users Tab
function UsersTab() {
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
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'viewer' as UserRole,
  })
  const [formError, setFormError] = useState('')

  const resetForm = () => {
    setFormData({ email: '', password: '', full_name: '', role: 'viewer' })
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

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-neutral-100 rounded-lg" />
  }

  const totalUsers = users?.length || 0
  const activeUsers = users?.filter((u) => u.is_active).length || 0
  const adminCount = users?.filter((u) => u.role === 'admin').length || 0

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Toplam</p>
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
              <p className="text-sm text-neutral-600">Aktif</p>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Kullanıcılar</CardTitle>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ekle
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-600">Kullanıcı</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-600">Rol</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-600">Durum</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-600">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-neutral-600">
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 text-sm">
                            {user.full_name || 'İsimsiz'}
                          </p>
                          <p className="text-xs text-neutral-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user.id !== currentUser?.id ? (
                        <Select
                          value={user.role}
                          onValueChange={(value) => updateRole.mutate({ userId: user.id, role: value as UserRole })}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editör</SelectItem>
                            <SelectItem value="viewer">Görüntüleyici</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'}>
                        {user.is_active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {user.id !== currentUser?.id && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => toggleActive.mutate({ userId: user.id, isActive: !user.is_active })}>
                              {user.is_active ? <UserX className="h-4 w-4 text-red-600" /> : <UserCheck className="h-4 w-4 text-green-600" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(user.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Şifre *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ad Soyad</label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editör</SelectItem>
                  <SelectItem value="viewer">Görüntüleyici</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>İptal</Button>
              <Button onClick={handleAddUser} disabled={createUser.isPending}>
                {createUser.isPending ? 'Ekleniyor...' : 'Ekle'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta</label>
              <Input value={formData.email} disabled className="bg-neutral-50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ad Soyad</label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editör</SelectItem>
                  <SelectItem value="viewer">Görüntüleyici</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditingUser(null)}>İptal</Button>
              <Button onClick={handleEditUser} disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Sil</DialogTitle>
          </DialogHeader>
          <p className="text-neutral-600">Bu kullanıcıyı pasif hale getirmek istediğinize emin misiniz?</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>İptal</Button>
            <Button variant="destructive" onClick={() => { deleteUser.mutate(deleteConfirm!); setDeleteConfirm(null); }}>
              Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Permissions Tab
function PermissionsTab() {
  const supabase = createClient()
  const { data: permissions, isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('role')
        .order('resource')
      if (error) throw error
      return data as Permission[]
    },
  })

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-neutral-100 rounded-lg" />
  }

  const resources = [...new Set(permissions?.map((p) => p.resource) || [])]
  const actions = ['create', 'read', 'update', 'delete']
  const resourceLabels: Record<string, string> = {
    marketing_items: 'Marketing Items',
    users: 'Kullanıcılar',
    logs: 'Loglar',
    settings: 'Ayarlar',
  }
  const actionLabelsLocal: Record<string, string> = {
    create: 'Oluştur',
    read: 'Görüntüle',
    update: 'Düzenle',
    delete: 'Sil',
  }

  return (
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
                actions.map((action, idx) => {
                  const adminPerm = permissions?.find((p) => p.role === 'admin' && p.resource === resource && p.action === action)
                  const editorPerm = permissions?.find((p) => p.role === 'editor' && p.resource === resource && p.action === action)
                  const viewerPerm = permissions?.find((p) => p.role === 'viewer' && p.resource === resource && p.action === action)
                  return (
                    <tr key={`${resource}-${action}`} className="border-b border-neutral-100">
                      <td className="py-3 px-4">{idx === 0 && <span className="font-medium">{resourceLabels[resource] || resource}</span>}</td>
                      <td className="py-3 px-4 text-neutral-600">{actionLabelsLocal[action]}</td>
                      <td className="py-3 px-4 text-center">{adminPerm?.allowed ? <Check className="h-5 w-5 text-green-600 mx-auto" /> : <X className="h-5 w-5 text-red-400 mx-auto" />}</td>
                      <td className="py-3 px-4 text-center">{editorPerm?.allowed ? <Check className="h-5 w-5 text-green-600 mx-auto" /> : <X className="h-5 w-5 text-red-400 mx-auto" />}</td>
                      <td className="py-3 px-4 text-center">{viewerPerm?.allowed ? <Check className="h-5 w-5 text-green-600 mx-auto" /> : <X className="h-5 w-5 text-red-400 mx-auto" />}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// Logs Tab
function LogsTab() {
  const { data: logs, isLoading } = useActivityLogs(50)
  const [filter, setFilter] = useState('all')

  const filteredLogs = logs?.filter((log) => filter === 'all' || log.action === filter)

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-neutral-100 rounded-lg" />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="create">Oluşturma</SelectItem>
            <SelectItem value="update">Güncelleme</SelectItem>
            <SelectItem value="delete">Silme</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredLogs && filteredLogs.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={actionColors[log.action] || 'bg-neutral-100'}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                      {log.entity_type && (
                        <span className="text-xs text-neutral-500">{log.entity_type}</span>
                      )}
                    </div>
                    {log.description && (
                      <p className="text-sm text-neutral-700 mt-1">{log.description}</p>
                    )}
                    <div className="text-xs text-neutral-500 mt-1">
                      {log.profiles && (log.profiles.full_name || log.profiles.email)} •{' '}
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: tr })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-neutral-500">
              <Activity className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              Henüz log yok
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
