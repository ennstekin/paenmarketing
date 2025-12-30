'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanCard } from './kanban-card'
import { statusColors } from '@/lib/utils'
import type { MarketingItem, ItemStatus } from '@/types/database'

interface KanbanColumnProps {
  id: ItemStatus
  title: string
  items: MarketingItem[]
  onEditItem: (item: MarketingItem) => void
  onDeleteItem: (id: string) => void
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
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: statusColors[id] }}
        />
        <h3 className="font-semibold text-neutral-900">{title}</h3>
        <span className="ml-auto text-sm text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-3 transition-colors ${
          isOver ? 'bg-neutral-200' : 'bg-neutral-100'
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
              <div className="flex items-center justify-center h-[200px] text-neutral-400 text-sm">
                İçerik yok
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
