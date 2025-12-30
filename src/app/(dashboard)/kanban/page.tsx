'use client'

import { Header } from '@/components/layout/header'
import { KanbanBoard } from '@/components/features/kanban/kanban-board'

export default function KanbanPage() {
  return (
    <div>
      <Header title="Kanban" />
      <div className="p-6">
        <KanbanBoard />
      </div>
    </div>
  )
}
