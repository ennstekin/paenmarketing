'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useMarketingItems } from '@/hooks/use-marketing-items'
import { formatDate, channelLabels, channelColors } from '@/lib/utils'
import { CalendarClock, Calendar, Clock, ArrowRight, Inbox, Mail, MessageSquare, Megaphone, Instagram } from 'lucide-react'
import type { ChannelType } from '@/types/database'

const channelIcons: Record<ChannelType, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
  meta_ads: <Megaphone className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
}

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
    .sort((a, b) => {
      const dateA = new Date(a.scheduled_date!)
      const dateB = new Date(b.scheduled_date!)
      return dateA.getTime() - dateB.getTime()
    })
    .slice(0, 5)

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="h-5 w-5 text-neutral-400" />
            Yaklaşan İçerikler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                <div className="h-10 w-10 rounded-xl bg-neutral-200" />
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
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5 text-neutral-400" />
          Yaklaşan İçerikler
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!upcomingItems || upcomingItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
            <Inbox className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Yaklaşan içerik yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingItems.map((item, index) => (
              <div
                key={item.id}
                className="group relative flex items-center gap-4 p-4 rounded-xl bg-neutral-50 hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                {/* Channel Icon */}
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: channelColors[item.channel] }}
                >
                  {channelIcons[item.channel]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate group-hover:text-neutral-700">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.scheduled_date && formatDate(item.scheduled_date)}
                    </span>
                    {item.scheduled_time && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.scheduled_time.slice(0, 5)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge */}
                <Badge
                  variant={item.channel as ChannelType}
                  className="hidden sm:flex"
                >
                  {channelLabels[item.channel]}
                </Badge>

                {/* Hover Arrow */}
                <ArrowRight className="h-4 w-4 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Position indicator */}
                {index === 0 && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-amber-400 rounded-full" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
