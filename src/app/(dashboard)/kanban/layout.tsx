import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kanban',
}

export default function KanbanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
