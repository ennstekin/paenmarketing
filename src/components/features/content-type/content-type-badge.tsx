'use client'

import { cn } from '@/lib/utils'
import type { ContentType } from '@/types/database'
import {
  FileText,
  Instagram,
  Film,
  Newspaper,
  Mail,
  Megaphone,
} from 'lucide-react'

const contentTypeConfig: Record<ContentType, {
  label: string
  icon: typeof FileText
  color: string
  bgColor: string
}> = {
  post: {
    label: 'Post',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  story: {
    label: 'Story',
    icon: Instagram,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  reel: {
    label: 'Reel',
    icon: Film,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  article: {
    label: 'Makale',
    icon: Newspaper,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  newsletter: {
    label: 'Newsletter',
    icon: Mail,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  ad: {
    label: 'Reklam',
    icon: Megaphone,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
}

interface ContentTypeBadgeProps {
  contentType: ContentType
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

export function ContentTypeBadge({
  contentType,
  size = 'md',
  showIcon = true,
  className,
}: ContentTypeBadgeProps) {
  const config = contentTypeConfig[contentType]
  if (!config) return null

  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md',
        config.color,
        config.bgColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  )
}

interface ContentTypeSelectProps {
  value: ContentType | null | undefined
  onChange: (contentType: ContentType | null) => void
  className?: string
}

export function ContentTypeSelect({ value, onChange, className }: ContentTypeSelectProps) {
  const contentTypes: ContentType[] = ['post', 'story', 'reel', 'article', 'newsletter', 'ad']

  return (
    <div className={cn('flex gap-1.5 flex-wrap', className)}>
      {contentTypes.map((type) => {
        const config = contentTypeConfig[type]
        const Icon = config.icon
        const isSelected = value === type

        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(isSelected ? null : type)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
              isSelected
                ? `${config.bgColor} ${config.color} border-current`
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            )}
          >
            <Icon className="h-4 w-4" />
            {config.label}
          </button>
        )
      })}
    </div>
  )
}

export function getContentTypeLabel(contentType: ContentType): string {
  return contentTypeConfig[contentType]?.label || contentType
}

export { contentTypeConfig }
