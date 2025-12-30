'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanCard } from './kanban-card'
import { statusColors } from '@/lib/utils'
import { Clock, Loader2, CheckCircle2, Inbox } from 'lucide-react'
import type { MarketingItem, ItemStatus } from '@/types/database'

interface KanbanColumnProps {
  id: ItemStatus
  title: string
  items: MarketingItem[]
  onEditItem: (item: MarketingItem) => void
  onDeleteItem: (id: string) => void
}

const statusIcons: Record<ItemStatus, React.ReactNode> = {
  planned: <Clock className="h-4 w-4" />,
  in_progress: <Loader2 className="h-4 w-4" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
}

export function KanbanColumn({
  id,
  title,
  items,
  onEditItem,
  onDeleteItem,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex flex-col w-80 min-w-[320px]">
      {/* Column Header */}
      <div
        className="flex items-center gap-3 mb-4 px-1"
        style={{ color: statusColors[id] }}
      >
        <div
          className="p-1.5 rounded-lg"
          style={{ backgroundColor: `${statusColors[id]}15` }}
        >
          {statusIcons[id]}
        </div>
        <h3 className="font-semibold text-neutral-900">{title}</h3>
        <span
          className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: statusColors[id] }}
        >
          {items.length}
        </span>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-2xl p-3 transition-all duration-200 border-2 border-dashed ${
          isOver
            ? 'bg-neutral-100 border-neutral-300 scale-[1.02]'
            : 'bg-neutral-50/50 border-transparent'
        }`}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 min-h-[200px]">
            {items.map((item) => (
              <KanbanCard
                key={item.id}
                item={item}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[200px] text-neutral-400">
                <Inbox className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">İçerik yok</p>
                <p className="text-xs mt-1">Buraya sürükle bırak</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
