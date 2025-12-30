import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  color?: 'default' | 'blue' | 'green' | 'amber' | 'purple'
}

const colorStyles = {
  default: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-600',
    accent: 'from-neutral-500/10 to-neutral-500/5',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    accent: 'from-blue-500/10 to-blue-500/5',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    accent: 'from-green-500/10 to-green-500/5',
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-600',
    accent: 'from-amber-500/10 to-amber-500/5',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    accent: 'from-purple-500/10 to-purple-500/5',
  },
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  color = 'default',
}: StatsCardProps) {
  const styles = colorStyles[color]

  return (
    <Card className={cn('relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300', className)}>
      {/* Background Gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', styles.accent)} />

      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
              {title}
            </p>
            <p className="text-4xl font-bold text-neutral-900 tracking-tight">
              {value}
            </p>
            {description && (
              <p className="text-sm text-neutral-500">{description}</p>
            )}
            {trend && (
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
                  trend.isPositive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.isPositive ? '+' : ''}{trend.value}%
              </div>
            )}
          </div>
          <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center', styles.bg, styles.text)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
