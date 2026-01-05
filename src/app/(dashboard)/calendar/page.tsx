'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Header } from '@/components/layout/header'
import { CalendarView } from '@/components/features/calendar/calendar-view'
import { StandByPool } from '@/components/features/standby/standby-pool'
import { IdeasPool } from '@/components/features/ideas/ideas-pool'
import { DragOverlayCard } from '@/components/features/dnd/drag-overlay-card'
import { useMoveIdeaToStandBy, useMoveStandByToIdeas } from '@/hooks/use-marketing-items'
import { toast } from 'sonner'
import type { MarketingItem } from '@/types/database'

export default function CalendarPage() {
  const [activeItem, setActiveItem] = useState<MarketingItem | null>(null)
  const moveIdeaToStandBy = useMoveIdeaToStandBy()
  const moveStandByToIdeas = useMoveStandByToIdeas()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveItem(active.data.current?.item as MarketingItem)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over) return

    const sourceType = active.data.current?.type as string
    const targetType = over.id as string
    const item = active.data.current?.item as MarketingItem

    if (!item || sourceType === targetType) return

    try {
      // Ideas -> Stand By
      if (sourceType === 'ideas' && targetType === 'standby-drop') {
        await moveIdeaToStandBy.mutateAsync(item.id)
        toast.success('Fikir Stand By\'a taşındı')
      }
      // Stand By -> Ideas
      else if (sourceType === 'standby' && targetType === 'ideas-drop') {
        await moveStandByToIdeas.mutateAsync(item.id)
        toast.success('Stand By Fikirler Havuzuna taşındı')
      }
    } catch {
      toast.error('Taşıma başarısız oldu')
    }
  }, [moveIdeaToStandBy, moveStandByToIdeas])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        <Header title="Takvim" />
        <div className="flex-1 p-6 space-y-6">
          <CalendarView />
          <StandByPool />
          <IdeasPool />
        </div>
      </div>

      <DragOverlay
        className={undefined}
        style={undefined}
        adjustScale={undefined}
        transition={undefined}
      >
        {activeItem && <DragOverlayCard item={activeItem} />}
      </DragOverlay>
    </DndContext>
  )
}
