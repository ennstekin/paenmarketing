'use client'

import type { MarketingItem } from '@/types/database'

interface DragOverlayCardProps {
  item: MarketingItem
}

export function DragOverlayCard({ item }: DragOverlayCardProps) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-xl border-2 border-primary/50 w-64 opacity-90">
      <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
      {item.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {item.description}
        </p>
      )}
    </div>
  )
}
