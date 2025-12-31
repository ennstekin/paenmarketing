import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Takvim',
}

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
