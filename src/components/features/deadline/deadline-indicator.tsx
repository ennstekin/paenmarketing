'use client'

import { cn } from '@/lib/utils'
import { Clock, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react'
import { format, differenceInDays, isPast, isToday, isTomorrow, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

interface DeadlineIndicatorProps {
  deadline: string | null | undefined
  status?: 'planned' | 'in_progress' | 'completed'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

type DeadlineState = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'normal' | 'completed'

function getDeadlineState(deadline: string, status?: string): DeadlineState {
  if (status === 'completed') return 'completed'

  const deadlineDate = parseISO(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (isPast(deadlineDate) && !isToday(deadlineDate)) return 'overdue'
  if (isToday(deadlineDate)) return 'today'
  if (isTomorrow(deadlineDate)) return 'tomorrow'

  const daysUntil = differenceInDays(deadlineDate, today)
  if (daysUntil <= 3) return 'soon'

  return 'normal'
}

const stateConfig: Record<DeadlineState, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: typeof Clock
}> = {
  overdue: {
    label: 'Gecikmiş',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertTriangle,
  },
  today: {
    label: 'Bugün',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: Clock,
  },
  tomorrow: {
    label: 'Yarın',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Clock,
  },
  soon: {
    label: 'Yaklaşıyor',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: Calendar,
  },
  normal: {
    label: '',
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-50',
    borderColor: 'border-neutral-200',
    icon: Calendar,
  },
  completed: {
    label: 'Tamamlandı',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle2,
  },
}

export function DeadlineIndicator({
  deadline,
  status,
  size = 'md',
  showIcon = true,
  className,
}: DeadlineIndicatorProps) {
  if (!deadline) return null

  const state = getDeadlineState(deadline, status)
  const config = stateConfig[state]
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

  const formattedDate = format(parseISO(deadline), 'd MMM', { locale: tr })

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
      <span>
        {config.label ? `${config.label} - ` : ''}
        {formattedDate}
      </span>
    </span>
  )
}

interface DeadlineTextProps {
  deadline: string | null | undefined
  status?: 'planned' | 'in_progress' | 'completed'
  className?: string
}

export function DeadlineText({ deadline, status, className }: DeadlineTextProps) {
  if (!deadline) return null

  const state = getDeadlineState(deadline, status)
  const config = stateConfig[state]
  const deadlineDate = parseISO(deadline)
  const today = new Date()
  const daysUntil = differenceInDays(deadlineDate, today)

  let text = ''
  if (state === 'overdue') {
    text = `${Math.abs(daysUntil)} gün gecikmiş`
  } else if (state === 'today') {
    text = 'Bugün son gün'
  } else if (state === 'tomorrow') {
    text = 'Yarın son gün'
  } else if (daysUntil > 0) {
    text = `${daysUntil} gün kaldı`
  }

  return (
    <span className={cn('text-sm', config.color, className)}>
      {text}
    </span>
  )
}

export function getDeadlineLabel(deadline: string, status?: string): string {
  const state = getDeadlineState(deadline, status)
  const config = stateConfig[state]
  const formattedDate = format(parseISO(deadline), 'd MMMM yyyy', { locale: tr })

  if (config.label) {
    return `${config.label} - ${formattedDate}`
  }
  return formattedDate
}
