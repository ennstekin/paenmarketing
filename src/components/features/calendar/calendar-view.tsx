'use client'

import { useState, useMemo, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { EventClickArg, EventDropArg, DayCellMountArg, EventDragStopArg } from '@fullcalendar/core'
import { useMarketingItems, useUpdateMarketingItem, useMoveCalendarToStandBy } from '@/hooks/use-marketing-items'
import { toast } from 'sonner'
import { useChannels } from '@/hooks/use-channels'
import { useUsers } from '@/hooks/use-users'
import { ItemFormDialog } from '@/components/features/marketing-item/item-form-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CalendarDays, Mail, MessageSquare, Megaphone, Instagram, Send, Radio, Tv, Globe, Phone } from 'lucide-react'
import type { MarketingItem } from '@/types/database'

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  'mail': Mail,
  'message-square': MessageSquare,
  'megaphone': Megaphone,
  'instagram': Instagram,
  'send': Send,
  'radio': Radio,
  'tv': Tv,
  'globe': Globe,
  'phone': Phone,
}

export function CalendarView() {
  const { data: items, isLoading } = useMarketingItems()
  const { data: channels } = useChannels()
  const { data: users } = useUsers()
  const updateItem = useUpdateMarketingItem()
  const moveToStandBy = useMoveCalendarToStandBy()
  const [selectedItem, setSelectedItem] = useState<MarketingItem | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Create user lookup map
  const userMap = useMemo(() => {
    return users?.reduce((acc, u) => {
      acc[u.id] = u
      return acc
    }, {} as Record<string, typeof users[0]>) || {}
  }, [users])

  // Create channel lookup map
  const channelMap = useMemo(() => {
    return channels?.reduce((acc, c) => {
      acc[c.name] = c
      return acc
    }, {} as Record<string, typeof channels[0]>) || {}
  }, [channels])

  const getChannelColor = (channelName: string) => {
    return channelMap[channelName]?.color || '#6b7280'
  }

  const getChannelIcon = (channelName: string) => {
    const channel = channelMap[channelName]
    const IconComponent = iconComponents[channel?.icon || 'mail'] || Mail
    return <IconComponent className="h-3 w-3" />
  }

  const events = useMemo(() => {
    if (!items || !channels || channels.length === 0) return []

    return items
      .filter((item) => item.scheduled_date)
      .map((item) => {
        // Support both old single channel and new multiple channels
        const itemChannels = (item as MarketingItem & { channels?: string[] }).channels ||
          (item.channel ? [item.channel] : [])

        const startDate = item.scheduled_time
          ? `${item.scheduled_date}T${item.scheduled_time}`
          : item.scheduled_date

        // Get colors for all channels
        const channelColors = itemChannels.map(c => channelMap[c]?.color || '#6b7280')
        const primaryColor = channelColors[0] || '#6b7280'

        return {
          id: item.id,
          title: item.title,
          start: startDate!,
          allDay: !item.scheduled_time,
          backgroundColor: '#262626',
          borderColor: '#262626',
          textColor: '#ffffff',
          extendedProps: {
            item,
            channels: itemChannels,
            channelColors,
          },
        }
      })
  }, [items, channels, channelMap])

  const handleEventClick = (info: EventClickArg) => {
    const item = info.event.extendedProps.item as MarketingItem
    setSelectedItem(item)
    setShowDialog(true)
  }

  const openFormWithDate = useCallback((dateStr: string) => {
    setSelectedDate(dateStr)
    setSelectedItem(null)
    setShowDialog(true)
  }, [])

  const handleDateClick = (info: DateClickArg) => {
    // Format date in local timezone
    const date = info.date
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`
    openFormWithDate(formattedDate)
  }

  const handleDayCellDidMount = useCallback((arg: DayCellMountArg) => {
    const dayTop = arg.el.querySelector('.fc-daygrid-day-top')
    if (!dayTop) return

    // Create the + button
    const btn = document.createElement('button')
    btn.className = 'add-content-btn w-5 h-5 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-opacity z-10'
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-600"><path d="M5 12h14"/><path d="M12 5v14"/></svg>'
    btn.style.position = 'absolute'
    btn.style.left = '4px'
    btn.style.top = '4px'

    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const date = arg.date
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`
      openFormWithDate(formattedDate)
    })

    // Make dayTop relative for absolute positioning
    ;(dayTop as HTMLElement).style.position = 'relative'
    dayTop.appendChild(btn)
  }, [openFormWithDate])

  const handleEventDrop = async (info: EventDropArg) => {
    if (!info.event.start) {
      info.revert()
      return
    }

    // Format date in local timezone (YYYY-MM-DD)
    const date = info.event.start
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const newDate = `${year}-${month}-${day}`

    // Extract original item id
    const item = info.event.extendedProps.item as MarketingItem
    const itemId = item.id

    try {
      await updateItem.mutateAsync({
        id: itemId,
        scheduled_date: newDate,
      })
    } catch {
      info.revert()
    }
  }

  const handleEventDragStop = async (info: EventDragStopArg) => {
    // Check if dropped on Stand By area
    const standByElement = document.querySelector('[data-droppable="standby"]')
    if (!standByElement) return

    const rect = standByElement.getBoundingClientRect()
    const { clientX, clientY } = info.jsEvent as MouseEvent

    // Check if drop position is within Stand By area
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      const item = info.event.extendedProps.item as MarketingItem
      try {
        await moveToStandBy.mutateAsync(item.id)
        toast.success('İçerik Stand By\'a taşındı')
      } catch {
        toast.error('Taşıma başarısız oldu')
      }
    }
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="h-[600px] flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-neutral-900" />
              <CalendarDays className="absolute inset-0 m-auto h-5 w-5 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500">Takvim yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend Card */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-sm font-medium text-neutral-700">Kanallar:</span>
            {channels?.map((channel) => {
              const IconComponent = iconComponents[channel.icon] || Mail
              return (
                <div key={channel.name} className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-xs font-medium"
                    style={{ backgroundColor: channel.color }}
                  >
                    <IconComponent className="h-3 w-3" />
                    {channel.label}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek',
            }}
            locale="tr"
            firstDay={1}
            buttonText={{
              today: 'Bugün',
              month: 'Ay',
              week: 'Hafta',
            }}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            editable={true}
            eventDrop={handleEventDrop}
            eventDragStop={handleEventDragStop}
            dragRevertDuration={0}
            dayCellDidMount={handleDayCellDidMount}
            height="auto"
            dayMaxEvents={3}
            moreLinkText={(num) => `+${num} daha`}
            eventContent={(arg) => {
              const itemChannels = arg.event.extendedProps.channels as string[]
              const channelColors = arg.event.extendedProps.channelColors as string[]
              const item = arg.event.extendedProps.item as MarketingItem
              const assignedUser = item.assigned_to ? userMap[item.assigned_to] : null

              return (
                <div className="flex flex-col gap-1 p-1.5 text-xs overflow-hidden w-full">
                  {/* Title + Assigned User */}
                  <div className="flex items-center gap-1.5">
                    {assignedUser && (
                      <Avatar className="h-4 w-4 flex-shrink-0 ring-1 ring-white/30">
                        <AvatarImage src={assignedUser.avatar_url || undefined} />
                        <AvatarFallback className="text-[8px] bg-white/20 text-white">
                          {assignedUser.full_name?.[0] || assignedUser.email?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="font-medium truncate text-white">
                      {arg.event.title}
                    </span>
                  </div>
                  {/* Channel Tags + Status */}
                  <div className="flex flex-wrap gap-1">
                    {itemChannels.map((channelName, i) => (
                      <span
                        key={channelName}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          backgroundColor: channelColors[i],
                          color: '#ffffff',
                        }}
                      >
                        {channelMap[channelName]?.label || channelName}
                      </span>
                    ))}
                    {item.status === 'completed' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500 text-white">
                        Yayınlandı
                      </span>
                    )}
                    {item.status === 'in_progress' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500 text-white">
                        Devam Ediyor
                      </span>
                    )}
                  </div>
                </div>
              )
            }}
          />
        </CardContent>
      </Card>

      <ItemFormDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) {
            setSelectedDate(null)
          }
        }}
        item={selectedItem}
        defaultDate={selectedDate}
      />
    </div>
  )
}
