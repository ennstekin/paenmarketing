'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Check, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface ChecklistEditorProps {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
  disabled?: boolean
  className?: string
}

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export function ChecklistEditor({ items, onChange, disabled, className }: ChecklistEditorProps) {
  const [newItemText, setNewItemText] = useState('')

  const handleAddItem = () => {
    if (!newItemText.trim()) return

    const newItem: ChecklistItem = {
      id: generateId(),
      text: newItemText.trim(),
      completed: false,
    }

    onChange([...items, newItem])
    setNewItemText('')
  }

  const handleToggleItem = (id: string) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const handleUpdateText = (id: string, text: string) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, text } : item))
    )
  }

  const handleDeleteItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddItem()
    }
  }

  const completedCount = items.filter((item) => item.completed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress */}
      {totalCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">İlerleme</span>
            <span className="font-medium text-neutral-700">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-2 group p-2 rounded-lg hover:bg-neutral-50 transition-colors',
              item.completed && 'opacity-60'
            )}
          >
            <button
              type="button"
              onClick={() => handleToggleItem(item.id)}
              disabled={disabled}
              className={cn(
                'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                item.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-neutral-300 hover:border-neutral-400'
              )}
            >
              {item.completed && <Check className="h-3 w-3" />}
            </button>

            <input
              type="text"
              value={item.text}
              onChange={(e) => handleUpdateText(item.id, e.target.value)}
              disabled={disabled}
              className={cn(
                'flex-1 bg-transparent border-none outline-none text-sm',
                item.completed && 'line-through text-neutral-500'
              )}
            />

            <button
              type="button"
              onClick={() => handleDeleteItem(item.id)}
              disabled={disabled}
              className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new item */}
      <div className="flex gap-2">
        <Input
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Yeni görev ekle..."
          disabled={disabled}
          className="flex-1 h-9 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={!newItemText.trim() || disabled}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface ChecklistPreviewProps {
  items: ChecklistItem[]
  className?: string
}

export function ChecklistPreview({ items, className }: ChecklistPreviewProps) {
  if (!items || items.length === 0) return null

  const completedCount = items.filter((item) => item.completed).length
  const totalCount = items.length

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <div className="flex items-center gap-1 text-neutral-500">
        <Square className="h-3.5 w-3.5" />
        <span>
          {completedCount}/{totalCount}
        </span>
      </div>
      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden max-w-[60px]">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}
