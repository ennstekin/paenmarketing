'use client'

import { Header } from '@/components/layout/header'
import { DataTable } from '@/components/features/list/data-table'

export default function ListPage() {
  return (
    <div>
      <Header title="Liste" />
      <div className="p-6">
        <DataTable />
      </div>
    </div>
  )
}
