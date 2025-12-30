'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { channelColors, channelLabels } from '@/lib/utils'
import { PieChart as PieChartIcon, Mail, MessageSquare, Megaphone, Instagram } from 'lucide-react'
import type { ChannelType } from '@/types/database'

interface ChannelChartProps {
  data: Record<string, number>
}

const channelIcons: Record<ChannelType, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
  meta_ads: <Megaphone className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
}

export function ChannelChart({ data }: ChannelChartProps) {
  const chartData = Object.entries(data).map(([channel, count]) => ({
    name: channelLabels[channel] || channel,
    value: count,
    color: channelColors[channel] || '#6b7280',
    channel: channel as ChannelType,
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  if (chartData.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChartIcon className="h-5 w-5 text-neutral-400" />
            Kanal Dağılımı
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[280px] text-neutral-400">
          <PieChartIcon className="h-12 w-12 mb-3 opacity-50" />
          <p>Henüz veri yok</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PieChartIcon className="h-5 w-5 text-neutral-400" />
          Kanal Dağılımı
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Chart */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                    padding: '12px 16px',
                  }}
                  formatter={(value, name) => [
                    `${value} içerik`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {chartData.map((item) => (
              <div key={item.channel} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: item.color }}
                >
                  {channelIcons[item.channel]}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                  <p className="text-xs text-neutral-500">
                    {item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
