import { Sidebar } from '@/components/layout/sidebar'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/toaster'

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
        <Toaster />
      </div>
    </QueryProvider>
  )
}
