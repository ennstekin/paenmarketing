'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  MessageSquare,
  UserPlus,
  AlertCircle,
  Clock,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/hooks/use-notifications'
import { useRealtimeNotifications } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import type { NotificationType } from '@/types/database'

const notificationIcons: Record<NotificationType, typeof Bell> = {
  mention: MessageSquare,
  comment: MessageSquare,
  assignment: UserPlus,
  approval_request: AlertCircle,
  approval_response: Check,
  deadline: Clock,
  status_change: AlertCircle,
}

const notificationColors: Record<NotificationType, string> = {
  mention: 'bg-blue-100 text-blue-600',
  comment: 'bg-green-100 text-green-600',
  assignment: 'bg-purple-100 text-purple-600',
  approval_request: 'bg-orange-100 text-orange-600',
  approval_response: 'bg-emerald-100 text-emerald-600',
  deadline: 'bg-red-100 text-red-600',
  status_change: 'bg-amber-100 text-amber-600',
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const { data: notifications, isLoading } = useNotifications()
  const { data: unreadCount } = useUnreadNotificationCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotification = useDeleteNotification()

  // Real-time updates
  useRealtimeNotifications()

  const handleMarkRead = async (id: string) => {
    await markRead.mutateAsync(id)
  }

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync()
  }

  const handleDelete = async (id: string) => {
    await deleteNotification.mutateAsync(id)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold">Bildirimler</h4>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Tümünü Okundu İşaretle
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-neutral-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    <div className="h-3 bg-neutral-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications?.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Bildirim yok</p>
            </div>
          ) : (
            <div>
              {notifications?.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell
                const colorClass = notificationColors[notification.type] || 'bg-neutral-100 text-neutral-600'

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex gap-3 p-4 border-b hover:bg-neutral-50 transition-colors cursor-pointer',
                      !notification.is_read && 'bg-blue-50/50'
                    )}
                    onClick={() => {
                      if (!notification.is_read) {
                        handleMarkRead(notification.id)
                      }
                      if (notification.link) {
                        window.location.href = notification.link
                        setOpen(false)
                      }
                    }}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                        colorClass
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-neutral-900">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-neutral-500 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-neutral-400 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-start gap-1">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkRead(notification.id)
                          }}
                          className="p-1 text-neutral-400 hover:text-green-600"
                          title="Okundu işaretle"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notification.id)
                        }}
                        className="p-1 text-neutral-400 hover:text-red-600"
                        title="Sil"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
