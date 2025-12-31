'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Calendar, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useChannelHelpers } from '@/hooks/use-channels'
import { formatDate } from '@/lib/utils'
import { PriorityBadge } from '@/components/features/priority/priority-badge'
import { DeadlineIndicator } from '@/components/features/deadline/deadline-indicator'
import { ChecklistPreview, type ChecklistItem } from '@/components/features/checklist/checklist-editor'
import type { MarketingItem } from '@/types/database'

interface KanbanCardProps {
  item: MarketingItem
  onEdit: (item: MarketingItem) => void
  onDelete: (id: string) => void
}

export function KanbanCard({ item, onEdit, onDelete }: KanbanCardProps) {
  const { getChannelLabel, getChannelColor } = useChannelHelpers()

  // Support both old single channel and new multiple channels
  const itemChannels = (item as MarketingItem & { channels?: string[] }).channels ||
    (item.channel ? [item.channel] : [])

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

  // Use first channel color for the indicator
  const primaryChannelColor = itemChannels.length > 0 ? getChannelColor(itemChannels[0]) : '#6b7280'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative bg-white rounded-xl border border-neutral-100 p-4 pl-5 shadow-sm hover:shadow-lg hover:border-neutral-200 transition-all duration-200 group overflow-hidden"
    >
      <div className="flex items-start gap-3">
        <button
          className="mt-0.5 cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div
            className="cursor-pointer"
            onClick={() => onEdit(item)}
          >
            {/* Channel Badges & Priority */}
            <div className="mb-3 flex flex-wrap gap-1.5 items-center">
              {itemChannels.map((channelName) => (
                <Badge
                  key={channelName}
                  variant="channel"
                  color={getChannelColor(channelName)}
                  className="text-xs font-medium"
                >
                  {getChannelLabel(channelName)}
                </Badge>
              ))}
              {item.priority && item.priority !== 'normal' && (
                <PriorityBadge priority={item.priority} size="sm" showLabel={false} />
              )}
            </div>

            {/* Title */}
            <h4 className="font-semibold text-neutral-900 line-clamp-2 leading-snug">
              {item.title}
            </h4>

            {/* Description */}
            {item.description && (
              <p className="mt-2 text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}

            {/* Date/Time & Deadline */}
            {(item.scheduled_date || item.deadline || (item.checklist && Array.isArray(item.checklist) && item.checklist.length > 0)) && (
              <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-3 text-xs text-neutral-400 flex-wrap">
                {item.scheduled_date && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(item.scheduled_date)}
                  </span>
                )}
                {item.scheduled_time && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {item.scheduled_time.slice(0, 5)}
                  </span>
                )}
                {item.deadline && (
                  <DeadlineIndicator
                    deadline={item.deadline}
                    status={item.status}
                    size="sm"
                  />
                )}
                {item.checklist && Array.isArray(item.checklist) && item.checklist.length > 0 && (
                  <ChecklistPreview items={item.checklist as unknown as ChecklistItem[]} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(item.id)
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Channel Color Indicator - shows gradient if multiple channels */}
      <div
        className="absolute left-0 top-4 bottom-4 w-1 rounded-full opacity-60"
        style={{
          background: itemChannels.length > 1
            ? `linear-gradient(to bottom, ${itemChannels.map(c => getChannelColor(c)).join(', ')})`
            : primaryChannelColor
        }}
      />
    </div>
  )
}
