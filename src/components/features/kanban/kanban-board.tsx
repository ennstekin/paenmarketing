'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { ItemFormDialog } from '@/components/features/marketing-item/item-form-dialog'
import {
  useMarketingItems,
  useUpdateMarketingItem,
  useDeleteMarketingItem,
} from '@/hooks/use-marketing-items'
import { statusLabels } from '@/lib/utils'
import type { MarketingItem, ItemStatus } from '@/types/database'

const columns: { id: ItemStatus; title: string }[] = [
  { id: 'planned', title: statusLabels.planned },
  { id: 'in_progress', title: statusLabels.in_progress },
  { id: 'completed', title: statusLabels.completed },
]

export function KanbanBoard() {
  const { data: items, isLoading } = useMarketingItems()
  const updateItem = useUpdateMarketingItem()
  const deleteItem = useDeleteMarketingItem()
  const [activeItem, setActiveItem] = useState<MarketingItem | null>(null)
  const [editingItem, setEditingItem] = useState<MarketingItem | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const getItemsByStatus = (status: ItemStatus) => {
    return items?.filter((item) => item.status === status) || []
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const item = items?.find((i) => i.id === active.id)
    if (item) {
      setActiveItem(item)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeItem = items?.find((i) => i.id === activeId)
    if (!activeItem) return

    // Check if dropped on a column
    const isColumn = columns.some((col) => col.id === overId)
    if (isColumn) {
      const newStatus = overId as ItemStatus
      if (activeItem.status !== newStatus) {
        await updateItem.mutateAsync({
          id: activeId,
          status: newStatus,
        })
      }
    } else {
      // Dropped on another card - find the target card's column
      const targetItem = items?.find((i) => i.id === overId)
      if (targetItem && activeItem.status !== targetItem.status) {
        await updateItem.mutateAsync({
          id: activeId,
          status: targetItem.status,
        })
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: handle drag over for visual feedback
  }

  const handleEditItem = (item: MarketingItem) => {
    setEditingItem(item)
    setShowDialog(true)
  }

  const handleDeleteItem = async (id: string) => {
    if (confirm('Bu içeriği silmek istediğinize emin misiniz?')) {
      await deleteItem.mutateAsync(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.id} className="w-80 min-w-[320px]">
            <div className="h-6 bg-neutral-200 rounded w-24 mb-4 animate-pulse" />
            <div className="bg-neutral-100 rounded-xl p-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-neutral-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              items={getItemsByStatus(column.id)}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem && (
            <div className="rotate-3">
              <KanbanCard
                item={activeItem}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <ItemFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        item={editingItem}
      />
    </>
  )
}
