'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, CheckCircle2, Clock, Loader2 } from 'lucide-react'

interface CompletionRateProps {
  rate: number
  completed: number
  total: number
}

export function CompletionRate({ rate, completed, total }: CompletionRateProps) {
  const inProgress = Math.max(0, total - completed)
  const circumference = 2 * Math.PI * 42

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-neutral-400" />
          Tamamlanma Oranı
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-4">
          <div className="relative h-40 w-40">
            {/* Background circle */}
            <svg className="h-40 w-40 -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-neutral-100"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
              {/* Progress circle with gradient effect */}
              <circle
                className="text-green-500 transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={`${(rate / 100) * circumference} ${circumference}`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.4))',
                }}
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-neutral-900">{rate}%</span>
              <span className="text-xs text-neutral-500 mt-1">tamamlandı</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-900">{completed}</p>
              <p className="text-xs text-neutral-500">Tamamlanan</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-900">{inProgress}</p>
              <p className="text-xs text-neutral-500">Devam Eden</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
