'use client'

import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventDropArg } from '@fullcalendar/core'
import { useMarketingItems, useUpdateMarketingItem } from '@/hooks/use-marketing-items'
import { channelColors, channelLabels } from '@/lib/utils'
import { ItemFormDialog } from '@/components/features/marketing-item/item-form-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Mail, MessageSquare, Megaphone, Instagram } from 'lucide-react'
import type { MarketingItem, ChannelType } from '@/types/database'

const channelIcons: Record<ChannelType, React.ReactNode> = {
  email: <Mail className="h-3 w-3" />,
  sms: <MessageSquare className="h-3 w-3" />,
  meta_ads: <Megaphone className="h-3 w-3" />,
  instagram: <Instagram className="h-3 w-3" />,
}

export function CalendarView() {
  const { data: items, isLoading } = useMarketingItems()
  const updateItem = useUpdateMarketingItem()
  const [selectedItem, setSelectedItem] = useState<MarketingItem | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const events = items?.map((item) => ({
    id: item.id,
    title: item.title,
    start: item.scheduled_date
      ? item.scheduled_time
        ? `${item.scheduled_date}T${item.scheduled_time}`
        : item.scheduled_date
      : undefined,
    allDay: !item.scheduled_time,
    backgroundColor: channelColors[item.channel],
    borderColor: channelColors[item.channel],
    extendedProps: {
      item,
      channel: item.channel,
    },
  })).filter((event) => event.start) || []

  const handleEventClick = (info: EventClickArg) => {
    const item = info.event.extendedProps.item as MarketingItem
    setSelectedItem(item)
    setShowDialog(true)
  }

  const handleEventDrop = async (info: EventDropArg) => {
    if (!info.event.start) {
      info.revert()
      return
    }

    const newDate = info.event.start.toISOString().split('T')[0]

    try {
      await updateItem.mutateAsync({
        id: info.event.id,
        scheduled_date: newDate,
      })
    } catch {
      info.revert()
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
            {Object.entries(channelLabels).map(([channel, label]) => (
              <div key={channel} className="flex items-center gap-2">
                <Badge
                  variant={channel as ChannelType}
                  className="flex items-center gap-1.5 px-2.5 py-1"
                >
                  {channelIcons[channel as ChannelType]}
                  {label}
                </Badge>
              </div>
            ))}
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
            buttonText={{
              today: 'Bugün',
              month: 'Ay',
              week: 'Hafta',
            }}
            events={events}
            eventClick={handleEventClick}
            editable={true}
            eventDrop={handleEventDrop}
            height="auto"
            dayMaxEvents={3}
            moreLinkText={(num) => `+${num} daha`}
            eventContent={(arg) => {
              const channel = arg.event.extendedProps.channel as ChannelType
              return (
                <div className="flex items-center gap-1.5 p-1 text-xs overflow-hidden w-full">
                  <span className="flex-shrink-0 opacity-90">
                    {channelIcons[channel]}
                  </span>
                  <span className="font-medium truncate">{arg.event.title}</span>
                </div>
              )
            }}
          />
        </CardContent>
      </Card>

      <ItemFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        item={selectedItem}
      />
    </div>
  )
}
