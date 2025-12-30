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
import type { MarketingItem } from '@/types/database'

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
      <div className="h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900" />
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
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
          eventContent={(arg) => (
            <div className="p-1 text-xs overflow-hidden">
              <div className="font-medium truncate">{arg.event.title}</div>
            </div>
          )}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {Object.entries(channelLabels).map(([channel, label]) => (
          <div key={channel} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: channelColors[channel] }}
            />
            <span className="text-sm text-neutral-600">{label}</span>
          </div>
        ))}
      </div>

      <ItemFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        item={selectedItem}
      />
    </>
  )
}
