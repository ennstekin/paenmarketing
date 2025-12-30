'use client'

import { useState } from 'react'
import { useActivityLogs } from '@/hooks/use-activity-logs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  User,
  FileText,
  Settings,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4 text-green-600" />,
  update: <Pencil className="h-4 w-4 text-blue-600" />,
  delete: <Trash2 className="h-4 w-4 text-red-600" />,
  login: <LogIn className="h-4 w-4 text-purple-600" />,
  logout: <LogOut className="h-4 w-4 text-neutral-600" />,
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

const entityIcons: Record<string, React.ReactNode> = {
  marketing_item: <FileText className="h-4 w-4" />,
  profile: <User className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
}

export default function LogsPage() {
  const [filter, setFilter] = useState<string>('all')
  const { data: logs, isLoading } = useActivityLogs(100)

  const filteredLogs = logs?.filter((log) => {
    if (filter === 'all') return true
    return log.action === filter
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

  const todayLogs = logs?.filter((log) => {
    const logDate = new Date(log.created_at)
    const today = new Date()
    return logDate.toDateString() === today.toDateString()
  }).length || 0

  const createLogs = logs?.filter((log) => log.action === 'create').length || 0
  const updateLogs = logs?.filter((log) => log.action === 'update').length || 0
  const deleteLogs = logs?.filter((log) => log.action === 'delete').length || 0

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Aktivite Logları</h1>
          <p className="text-neutral-600 mt-1">Sistemdeki tüm aktiviteleri görüntüleyin</p>
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="create">Oluşturma</SelectItem>
            <SelectItem value="update">Güncelleme</SelectItem>
            <SelectItem value="delete">Silme</SelectItem>
            <SelectItem value="login">Giriş</SelectItem>
            <SelectItem value="logout">Çıkış</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Bugün</p>
              <p className="text-2xl font-bold">{todayLogs}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Oluşturma</p>
              <p className="text-2xl font-bold">{createLogs}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Pencil className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Güncelleme</p>
              <p className="text-2xl font-bold">{updateLogs}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Silme</p>
              <p className="text-2xl font-bold">{deleteLogs}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs && filteredLogs.length > 0 ? (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  {/* Icon */}
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    {actionIcons[log.action] || <Activity className="h-4 w-4" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={actionColors[log.action] || 'bg-neutral-100 text-neutral-800'}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                      {log.entity_type && (
                        <span className="text-sm text-neutral-500 flex items-center gap-1">
                          {entityIcons[log.entity_type]}
                          {log.entity_type === 'marketing_item' ? 'Marketing Item' : log.entity_type}
                        </span>
                      )}
                    </div>

                    {log.description && (
                      <p className="mt-1 text-sm text-neutral-700">{log.description}</p>
                    )}

                    <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                      {log.profiles && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.profiles.full_name || log.profiles.email}
                        </span>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-neutral-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('tr-TR')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
              <p>Henüz aktivite kaydı yok</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
