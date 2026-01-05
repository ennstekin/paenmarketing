'use client'

import { Header } from '@/components/layout/header'
import { CalendarView } from '@/components/features/calendar/calendar-view'
import { StandByPool } from '@/components/features/standby/standby-pool'
import { IdeasPool } from '@/components/features/ideas/ideas-pool'

export default function CalendarPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Takvim" />
      <div className="flex-1 p-6 space-y-6">
        <CalendarView />
        <StandByPool />
        <IdeasPool />
      </div>
    </div>
  )
}
