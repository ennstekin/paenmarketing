'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChannelIcon } from '@/components/features/marketing-item/channel-icon'
import { useMarketingItems } from '@/hooks/use-marketing-items'
import { formatDate, channelLabels } from '@/lib/utils'
import type { ChannelType } from '@/types/database'

export function UpcomingItems() {
  const { data: items, isLoading } = useMarketingItems()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingItems = items
    ?.filter((item) => {
      if (!item.scheduled_date) return false
      const date = new Date(item.scheduled_date)
      return date >= today && item.status !== 'completed'
    })
    .slice(0, 5)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yaklaşan İçerikler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
                <div className="h-8 w-8 rounded bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yaklaşan İçerikler</CardTitle>
      </CardHeader>
      <CardContent>
        {!upcomingItems || upcomingItems.length === 0 ? (
          <p className="text-center text-neutral-500 py-8">
            Yaklaşan içerik yok
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <ChannelIcon channel={item.channel} className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {item.scheduled_date && formatDate(item.scheduled_date)}
                    {item.scheduled_time && ` - ${item.scheduled_time.slice(0, 5)}`}
                  </p>
                </div>
                <Badge variant={item.channel as ChannelType}>
                  {channelLabels[item.channel]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
