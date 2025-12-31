'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { ArrowUpDown, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ItemFormDialog } from '@/components/features/marketing-item/item-form-dialog'
import {
  useMarketingItems,
  useDeleteMarketingItem,
} from '@/hooks/use-marketing-items'
import { useChannels } from '@/hooks/use-channels'
import { formatDate, statusLabels } from '@/lib/utils'
import type { MarketingItem, ItemStatus, Channel } from '@/types/database'

// Helper functions that work with channel data
const getChannelLabel = (channels: Channel[] | undefined, name: string) => {
  return channels?.find(c => c.name === name)?.label || name
}

const getChannelColor = (channels: Channel[] | undefined, name: string) => {
  return channels?.find(c => c.name === name)?.color || '#6b7280'
}

export function DataTable() {
  const { data: items, isLoading } = useMarketingItems()
  const { data: channels } = useChannels()
  const deleteItem = useDeleteMarketingItem()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [editingItem, setEditingItem] = useState<MarketingItem | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const handleDelete = async (id: string) => {
    if (confirm('Bu içeriği silmek istediğinize emin misiniz?')) {
      await deleteItem.mutateAsync(id)
    }
  }

  const columns: ColumnDef<MarketingItem>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Başlık
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('title')}</div>
        ),
      },
      {
        accessorKey: 'channels',
        header: 'Kanallar',
        cell: ({ row }) => {
          // Support both old single channel and new multiple channels
          const itemChannels = (row.original as MarketingItem & { channels?: string[] }).channels ||
            (row.original.channel ? [row.original.channel] : [])

          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              {itemChannels.map((channelName) => (
                <Badge
                  key={channelName}
                  variant="channel"
                  color={getChannelColor(channels, channelName)}
                  className="text-xs"
                >
                  {getChannelLabel(channels, channelName)}
                </Badge>
              ))}
            </div>
          )
        },
        filterFn: (row, id, value) => {
          if (value === 'all') return true
          const itemChannels = (row.original as MarketingItem & { channels?: string[] }).channels ||
            (row.original.channel ? [row.original.channel] : [])
          return itemChannels.includes(value)
        },
      },
      {
        accessorKey: 'status',
        header: 'Durum',
        cell: ({ row }) => {
          const status = row.getValue('status') as ItemStatus
          return <Badge variant={status}>{statusLabels[status]}</Badge>
        },
        filterFn: (row, id, value) => {
          return value === 'all' || row.getValue(id) === value
        },
      },
      {
        accessorKey: 'scheduled_date',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tarih
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => {
          const date = row.getValue('scheduled_date') as string | null
          const time = row.original.scheduled_time
          if (!date) return <span className="text-neutral-400">-</span>
          return (
            <span>
              {formatDate(date)}
              {time && ` ${time.slice(0, 5)}`}
            </span>
          )
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingItem(row.original)
                setShowDialog(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [channels]
  )

  const table = useReactTable({
    data: items || [],
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-neutral-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Ara..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={(table.getColumn('channels')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table.getColumn('channels')?.setFilterValue(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tüm Kanallar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kanallar</SelectItem>
              {channels?.map((channel) => (
                <SelectItem key={channel.name} value={channel.name}>
                  {channel.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={(table.getColumn('status')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table.getColumn('status')?.setFilterValue(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tüm Durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-medium text-neutral-700"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center text-neutral-500"
                    >
                      İçerik bulunamadı
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-neutral-50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm text-neutral-700"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
            <div className="text-sm text-neutral-500">
              {table.getFilteredRowModel().rows.length} içerikten{' '}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
              -
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              arası gösteriliyor
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-neutral-600">
                Sayfa {table.getState().pagination.pageIndex + 1} /{' '}
                {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ItemFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        item={editingItem}
      />
    </>
  )
}
