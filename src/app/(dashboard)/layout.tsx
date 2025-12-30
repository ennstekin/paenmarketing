import { Sidebar } from '@/components/layout/sidebar'
import { QueryProvider } from '@/components/providers/query-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-neutral-50">
        <Sidebar />
        <main className="lg:ml-64">{children}</main>
      </div>
    </QueryProvider>
  )
}
