import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-neutral-900 text-white shadow-sm',
        secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
        outline: 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50',
        destructive: 'bg-red-100 text-red-700 hover:bg-red-200',
        planned: 'bg-amber-100 text-amber-800 border border-amber-200',
        in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
        completed: 'bg-green-100 text-green-800 border border-green-200',
        channel: 'text-white shadow-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  color?: string
}

function Badge({ className, variant, color, style, ...props }: BadgeProps) {
  const mergedStyle = color
    ? { ...style, backgroundColor: color, boxShadow: `0 1px 2px 0 ${color}40` }
    : style

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={mergedStyle}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
