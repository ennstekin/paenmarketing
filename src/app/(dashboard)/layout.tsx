import { Sidebar } from '@/components/layout/sidebar'
import { QueryProvider } from '@/components/providers/query-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <Sidebar />
        <main className="lg:ml-72 min-h-screen">{children}</main>
      </div>
    </QueryProvider>
  )
}
