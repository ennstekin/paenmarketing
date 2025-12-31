'use client'

import { useState } from 'react'
import { Filter, X, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useChannels } from '@/hooks/use-channels'
import { useCampaigns } from '@/hooks/use-campaigns'
import type { Priority, ContentType, ItemStatus } from '@/types/database'

export interface FilterState {
  search: string
  channels: string[]
  statuses: ItemStatus[]
  priorities: Priority[]
  contentTypes: ContentType[]
  campaignId: string | null
  dateRange: {
    start: string | null
    end: string | null
  }
  hasDeadline: boolean | null
}

const initialFilters: FilterState = {
  search: '',
  channels: [],
  statuses: [],
  priorities: [],
  contentTypes: [],
  campaignId: null,
  dateRange: { start: null, end: null },
  hasDeadline: null,
}

const statusOptions: { value: ItemStatus; label: string }[] = [
  { value: 'planned', label: 'Planlandı' },
  { value: 'in_progress', label: 'Devam Ediyor' },
  { value: 'completed', label: 'Tamamlandı' },
]

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Düşük' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Yüksek' },
  { value: 'urgent', label: 'Acil' },
]

const contentTypeOptions: { value: ContentType; label: string }[] = [
  { value: 'post', label: 'Post' },
  { value: 'story', label: 'Story' },
  { value: 'reel', label: 'Reel' },
  { value: 'article', label: 'Makale' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'ad', label: 'Reklam' },
]

interface AdvancedFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  className?: string
}

export function AdvancedFilters({ filters, onChange, className }: AdvancedFiltersProps) {
  const { data: channels } = useChannels()
  const { data: campaigns } = useCampaigns()
  const [open, setOpen] = useState(false)

  const activeFilterCount =
    filters.channels.length +
    filters.statuses.length +
    filters.priorities.length +
    filters.contentTypes.length +
    (filters.campaignId ? 1 : 0) +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0) +
    (filters.hasDeadline !== null ? 1 : 0)

  const handleClearAll = () => {
    onChange(initialFilters)
  }

  const toggleArrayFilter = <T extends string>(
    key: keyof FilterState,
    value: T
  ) => {
    const current = filters[key] as T[]
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: updated })
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="İçerik ara..."
          className="pl-10 h-10"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-10 gap-2">
            <Filter className="h-4 w-4" />
            Filtreler
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-4" align="end">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtreler</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs text-neutral-500"
                >
                  Tümünü Temizle
                </Button>
              )}
            </div>

            {/* Channels */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Kanallar</label>
              <div className="flex flex-wrap gap-1.5">
                {channels?.map((channel) => {
                  const isSelected = filters.channels.includes(channel.name)
                  return (
                    <button
                      key={channel.name}
                      onClick={() => toggleArrayFilter('channels', channel.name)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                        isSelected
                          ? 'text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                      style={isSelected ? { backgroundColor: channel.color } : {}}
                    >
                      {channel.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Durum</label>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map((status) => {
                  const isSelected = filters.statuses.includes(status.value)
                  return (
                    <button
                      key={status.value}
                      onClick={() => toggleArrayFilter('statuses', status.value)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                    >
                      {status.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Öncelik</label>
              <div className="flex flex-wrap gap-1.5">
                {priorityOptions.map((priority) => {
                  const isSelected = filters.priorities.includes(priority.value)
                  return (
                    <button
                      key={priority.value}
                      onClick={() => toggleArrayFilter('priorities', priority.value)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                        isSelected
                          ? 'bg-orange-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                    >
                      {priority.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">İçerik Tipi</label>
              <div className="flex flex-wrap gap-1.5">
                {contentTypeOptions.map((type) => {
                  const isSelected = filters.contentTypes.includes(type.value)
                  return (
                    <button
                      key={type.value}
                      onClick={() => toggleArrayFilter('contentTypes', type.value)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                        isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                    >
                      {type.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Campaign */}
            {campaigns && campaigns.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Kampanya</label>
                <div className="flex flex-wrap gap-1.5">
                  {campaigns.map((campaign) => {
                    const isSelected = filters.campaignId === campaign.id
                    return (
                      <button
                        key={campaign.id}
                        onClick={() =>
                          onChange({
                            ...filters,
                            campaignId: isSelected ? null : campaign.id,
                          })
                        }
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                          isSelected
                            ? 'text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        )}
                        style={isSelected ? { backgroundColor: campaign.color } : {}}
                      >
                        {campaign.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Tarih Aralığı</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.dateRange.start || ''}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      dateRange: { ...filters.dateRange, start: e.target.value || null },
                    })
                  }
                  className="h-9 text-sm"
                />
                <span className="text-neutral-400 self-center">-</span>
                <Input
                  type="date"
                  value={filters.dateRange.end || ''}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      dateRange: { ...filters.dateRange, end: e.target.value || null },
                    })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Has Deadline */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Deadline</label>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    onChange({
                      ...filters,
                      hasDeadline: filters.hasDeadline === true ? null : true,
                    })
                  }
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    filters.hasDeadline === true
                      ? 'bg-green-500 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  Deadline Var
                </button>
                <button
                  onClick={() =>
                    onChange({
                      ...filters,
                      hasDeadline: filters.hasDeadline === false ? null : false,
                    })
                  }
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    filters.hasDeadline === false
                      ? 'bg-red-500 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  Deadline Yok
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters.channels.map((channel) => (
            <Badge
              key={channel}
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-neutral-200"
              onClick={() => toggleArrayFilter('channels', channel)}
            >
              {channels?.find((c) => c.name === channel)?.label || channel}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {filters.statuses.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-neutral-200"
              onClick={() => toggleArrayFilter('statuses', status)}
            >
              {statusOptions.find((s) => s.value === status)?.label || status}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {filters.priorities.map((priority) => (
            <Badge
              key={priority}
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-neutral-200"
              onClick={() => toggleArrayFilter('priorities', priority)}
            >
              {priorityOptions.find((p) => p.value === priority)?.label || priority}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export function useFilteredItems<T extends {
  title: string
  description?: string | null
  channel?: string
  channels?: string[]
  status: ItemStatus
  priority?: Priority
  content_type?: ContentType | null
  campaign_id?: string | null
  deadline?: string | null
  scheduled_date?: string | null
}>(items: T[] | undefined, filters: FilterState): T[] {
  if (!items) return []

  return items.filter((item) => {
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      const titleMatch = item.title.toLowerCase().includes(search)
      const descMatch = item.description?.toLowerCase().includes(search) || false
      if (!titleMatch && !descMatch) return false
    }

    // Channel filter
    if (filters.channels.length > 0) {
      const itemChannels = item.channels || (item.channel ? [item.channel] : [])
      const hasMatchingChannel = filters.channels.some((c) => itemChannels.includes(c))
      if (!hasMatchingChannel) return false
    }

    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) {
      return false
    }

    // Priority filter
    if (filters.priorities.length > 0 && item.priority && !filters.priorities.includes(item.priority)) {
      return false
    }

    // Content type filter
    if (filters.contentTypes.length > 0 && item.content_type && !filters.contentTypes.includes(item.content_type)) {
      return false
    }

    // Campaign filter
    if (filters.campaignId && item.campaign_id !== filters.campaignId) {
      return false
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const itemDate = item.scheduled_date
      if (!itemDate) return false

      if (filters.dateRange.start && itemDate < filters.dateRange.start) {
        return false
      }
      if (filters.dateRange.end && itemDate > filters.dateRange.end) {
        return false
      }
    }

    // Has deadline filter
    if (filters.hasDeadline === true && !item.deadline) {
      return false
    }
    if (filters.hasDeadline === false && item.deadline) {
      return false
    }

    return true
  })
}

export { initialFilters }
