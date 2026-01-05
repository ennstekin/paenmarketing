'use client'

import { useState } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Clock, Plus, Calendar, MoreHorizontal, Trash2, Edit, Loader2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StandByFormDialog } from './standby-form-dialog'
import { useStandByItems, useMoveStandByToCalendar, useDeleteStandByItem } from '@/hooks/use-marketing-items'
import { useUsers } from '@/hooks/use-users'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { MarketingItem } from '@/types/database'

export function StandByPool() {
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MarketingItem | null>(null)

  const { data: items, isLoading } = useStandByItems()
  const { data: users } = useUsers()
  const moveToCalendar = useMoveStandByToCalendar()
  const deleteItem = useDeleteStandByItem()

  const handleNewItem = () => {
    setSelectedItem(null)
    setShowFormDialog(true)
  }

  const handleEditItem = (item: MarketingItem) => {
    setSelectedItem(item)
    setShowFormDialog(true)
  }

  const handleMoveToCalendar = async (item: MarketingItem, date: Date) => {
    try {
      await moveToCalendar.mutateAsync({
        id: item.id,
        scheduled_date: format(date, 'yyyy-MM-dd'),
      })
      toast.success('Stand By takvime eklendi')
    } catch {
      toast.error('Takvime eklenemedi')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id)
      toast.success('Stand By silindi')
    } catch {
      toast.error('Silinemedi')
    }
  }

  const getUser = (userId: string) => {
    return users?.find(u => u.id === userId)
  }

  // Droppable for receiving items from Ideas
  const { setNodeRef, isOver } = useDroppable({
    id: 'standby-drop',
  })

  return (
    <Card ref={setNodeRef} data-droppable="standby" className={cn(isOver && 'ring-2 ring-blue-500 ring-offset-2')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-blue-500" />
            Stand By
            {isOver && <span className="text-xs text-blue-500 ml-2">Buraya birak</span>}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewItem}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Yeni
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => {
              const creator = getUser(item.user_id)
              return (
                <StandByCard
                  key={item.id}
                  item={item}
                  creator={creator}
                  onMoveToCalendar={handleMoveToCalendar}
                  onEdit={handleEditItem}
                  onDelete={handleDelete}
                  isMoving={moveToCalendar.isPending}
                />
              )
            })}
          </div>
        ) : (
          <div className={cn(
            "text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg",
            isOver ? "border-blue-500 bg-blue-50" : "border-transparent"
          )}>
            <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Stand By listesi bos</p>
            <p className="text-sm">Bekleyen icerikleri buraya ekleyin veya suruleyip birakin</p>
          </div>
        )}
      </CardContent>

      <StandByFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        item={selectedItem}
      />
    </Card>
  )
}

interface StandByCardProps {
  item: MarketingItem
  creator?: { full_name: string | null; avatar_url: string | null; email: string }
  onMoveToCalendar: (item: MarketingItem, date: Date) => void
  onEdit: (item: MarketingItem) => void
  onDelete: (id: string) => void
  isMoving: boolean
}

function StandByCard({ item, creator, onMoveToCalendar, onEdit, onDelete, isMoving }: StandByCardProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `standby-${item.id}`,
    data: {
      type: 'standby',
      item,
    },
  })

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      onMoveToCalendar(item, date)
      setCalendarOpen(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-blue-50/50 rounded-lg p-3 border border-blue-100 hover:border-blue-300 transition-colors",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Title */}
      <h4 className="font-medium text-sm line-clamp-2 pr-6 pl-4">{item.title}</h4>

      {/* Description if exists */}
      {item.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        {/* Creator Avatar */}
        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5">
            <AvatarImage src={creator?.avatar_url || undefined} />
            <AvatarFallback className="text-[10px]">
              {creator?.full_name?.[0] || creator?.email?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
            {creator?.full_name || creator?.email?.split('@')[0] || 'Bilinmiyor'}
          </span>
        </div>

        {/* Move to Calendar Button */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              disabled={isMoving}
            >
              <Calendar className="h-3.5 w-3.5" />
              Takvime
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={tr}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4 mr-2" />
            Duzenle
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
