'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ChannelIcon } from '@/components/features/marketing-item/channel-icon'
import { formatDate, channelLabels } from '@/lib/utils'
import type { MarketingItem, ChannelType } from '@/types/database'

interface KanbanCardProps {
  item: MarketingItem
  onEdit: (item: MarketingItem) => void
  onDelete: (id: string) => void
}

export function KanbanCard({ item, onEdit, onDelete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-1 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div
            className="cursor-pointer"
            onClick={() => onEdit(item)}
          >
            <div className="flex items-center gap-2 mb-2">
              <ChannelIcon channel={item.channel} />
              <Badge variant={item.channel as ChannelType} className="text-xs">
                {channelLabels[item.channel]}
              </Badge>
            </div>
            <h4 className="font-medium text-neutral-900 line-clamp-2">
              {item.title}
            </h4>
            {item.description && (
              <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
                {item.description}
              </p>
            )}
            {item.scheduled_date && (
              <p className="mt-2 text-xs text-neutral-400">
                {formatDate(item.scheduled_date)}
                {item.scheduled_time && ` - ${item.scheduled_time.slice(0, 5)}`}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(item.id)
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
