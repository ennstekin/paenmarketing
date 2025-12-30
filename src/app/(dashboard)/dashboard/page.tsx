'use client'

import { Header } from '@/components/layout/header'
import { StatsCard } from '@/components/features/dashboard/stats-card'
import { ChannelChart } from '@/components/features/dashboard/channel-chart'
import { UpcomingItems } from '@/components/features/dashboard/upcoming-items'
import { CompletionRate } from '@/components/features/dashboard/completion-rate'
import { useStats } from '@/hooks/use-marketing-items'
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  TrendingUp,
} from 'lucide-react'

export default function DashboardPage() {
  const { data: stats, isLoading } = useStats()

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Toplam İçerik"
            value={isLoading ? '-' : stats?.total || 0}
            icon={<LayoutDashboard className="h-6 w-6" />}
          />
          <StatsCard
            title="Yaklaşan"
            value={isLoading ? '-' : stats?.upcoming || 0}
            description="Planlanmış içerikler"
            icon={<Clock className="h-6 w-6" />}
          />
          <StatsCard
            title="Tamamlanan"
            value={isLoading ? '-' : stats?.byStatus?.completed || 0}
            icon={<CheckCircle className="h-6 w-6" />}
          />
          <StatsCard
            title="Tamamlanma Oranı"
            value={isLoading ? '-' : `${stats?.completionRate || 0}%`}
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ChannelChart data={stats?.byChannel || {}} />
          <CompletionRate
            rate={stats?.completionRate || 0}
            completed={stats?.byStatus?.completed || 0}
            total={stats?.total || 0}
          />
          <UpcomingItems />
        </div>
      </div>
    </div>
  )
}
