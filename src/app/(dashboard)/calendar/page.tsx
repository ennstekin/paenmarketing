'use client'

import { Header } from '@/components/layout/header'
import { CalendarView } from '@/components/features/calendar/calendar-view'

export default function CalendarPage() {
  return (
    <div>
      <Header title="Takvim" />
      <div className="p-6">
        <CalendarView />
      </div>
    </div>
  )
}
