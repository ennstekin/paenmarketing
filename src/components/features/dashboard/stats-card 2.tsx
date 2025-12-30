import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-neutral-900">
              {value}
            </p>
            {description && (
              <p className="mt-1 text-sm text-neutral-500">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'mt-1 text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '+' : '-'}{trend.value}%
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
