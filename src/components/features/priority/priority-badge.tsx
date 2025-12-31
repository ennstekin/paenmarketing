'use client'

import { cn } from '@/lib/utils'
import type { Priority } from '@/types/database'
import { AlertTriangle, ArrowDown, ArrowUp, Minus } from 'lucide-react'

const priorityConfig: Record<Priority, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: typeof ArrowUp
}> = {
  low: {
    label: 'Düşük',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    icon: ArrowDown,
  },
  normal: {
    label: 'Normal',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Minus,
  },
  high: {
    label: 'Yüksek',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: ArrowUp,
  },
  urgent: {
    label: 'Acil',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertTriangle,
  },
}

interface PriorityBadgeProps {
  priority: Priority
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showLabel?: boolean
  className?: string
}

export function PriorityBadge({
  priority,
  size = 'md',
  showIcon = true,
  showLabel = true,
  className,
}: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-2.5 py-1.5 gap-2',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md border',
        config.color,
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {showLabel && config.label}
    </span>
  )
}

interface PrioritySelectProps {
  value: Priority
  onChange: (priority: Priority) => void
  className?: string
}

export function PrioritySelect({ value, onChange, className }: PrioritySelectProps) {
  const priorities: Priority[] = ['low', 'normal', 'high', 'urgent']

  return (
    <div className={cn('flex gap-1.5 flex-wrap', className)}>
      {priorities.map((priority) => {
        const config = priorityConfig[priority]
        const Icon = config.icon
        const isSelected = value === priority

        return (
          <button
            key={priority}
            type="button"
            onClick={() => onChange(priority)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
              isSelected
                ? `${config.bgColor} ${config.borderColor} ${config.color} ring-2 ring-offset-1`
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            )}
            style={isSelected ? { '--tw-ring-color': config.borderColor.replace('border-', '') } as React.CSSProperties : {}}
          >
            <Icon className="h-4 w-4" />
            {config.label}
          </button>
        )
      })}
    </div>
  )
}

export function getPriorityLabel(priority: Priority): string {
  return priorityConfig[priority]?.label || priority
}

export { priorityConfig }
