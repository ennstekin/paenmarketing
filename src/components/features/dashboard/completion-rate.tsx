'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CompletionRateProps {
  rate: number
  completed: number
  total: number
}

export function CompletionRate({ rate, completed, total }: CompletionRateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tamamlanma Oranı</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative h-32 w-32">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-neutral-100"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
              <circle
                className="text-green-500"
                strokeWidth="8"
                strokeDasharray={`${rate * 2.64} 264`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-neutral-900">{rate}%</span>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-neutral-500">
            {completed} / {total} içerik tamamlandı
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
