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
        email: 'bg-blue-500 text-white shadow-sm shadow-blue-500/25',
        sms: 'bg-green-500 text-white shadow-sm shadow-green-500/25',
        meta_ads: 'bg-purple-500 text-white shadow-sm shadow-purple-500/25',
        instagram: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/25',
        planned: 'bg-amber-100 text-amber-800 border border-amber-200',
        in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
        completed: 'bg-green-100 text-green-800 border border-green-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
