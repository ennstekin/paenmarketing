import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Liste',
}

export default function ListLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
