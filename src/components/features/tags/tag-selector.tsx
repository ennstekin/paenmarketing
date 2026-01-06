'use client'

import { useState } from 'react'
import { Check, Plus, X, Loader2, Tag as TagIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTags, useCreateTag } from '@/hooks/use-tags'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types/database'

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
]

interface TagSelectorProps {
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
  className?: string
}

export function TagSelector({ selectedTagIds, onChange, className }: TagSelectorProps) {
  const { data: tags, isLoading } = useTags()
  const createTag = useCreateTag()
  const [isOpen, setIsOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [isCreating, setIsCreating] = useState(false)

  const selectedTags = tags?.filter(tag => selectedTagIds.includes(tag.id)) || []

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const newTag = await createTag.mutateAsync({
        name: newTagName.trim(),
        color: newTagColor,
      })
      onChange([...selectedTagIds, newTag.id])
      setNewTagName('')
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const removeTag = (tagId: string) => {
    onChange(selectedTagIds.filter(id => id !== tagId))
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {selectedTags.map(tag => (
          <Badge
            key={tag.id}
            variant="outline"
            className="pl-2 pr-1 py-1 gap-1 text-xs font-medium"
            style={{
              backgroundColor: `${tag.color}15`,
              borderColor: `${tag.color}40`,
              color: tag.color,
            }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => removeTag(tag.id)}
              className="ml-0.5 rounded-full hover:bg-black/10 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Add Tag Button */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 border-dashed"
            >
              <Plus className="h-3 w-3" />
              Etiket Ekle
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : isCreating ? (
              /* Create New Tag Form */
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TagIcon className="h-4 w-4" />
                  Yeni Etiket Oluştur
                </div>
                <Input
                  placeholder="Etiket adı..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="h-9"
                  autoFocus
                />
                <div className="flex flex-wrap gap-1.5">
                  {TAG_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagColor(color)}
                      className={cn(
                        'w-6 h-6 rounded-full transition-all',
                        newTagColor === color && 'ring-2 ring-offset-2 ring-neutral-400'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCreating(false)
                      setNewTagName('')
                    }}
                    className="flex-1"
                  >
                    İptal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || createTag.isPending}
                    className="flex-1"
                  >
                    {createTag.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Oluştur'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Tag Selection List */
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Etiketler</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreating(true)}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Yeni
                  </Button>
                </div>

                {tags && tags.length > 0 ? (
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {tags.map(tag => {
                      const isSelected = selectedTagIds.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={cn(
                            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                            isSelected
                              ? 'bg-neutral-100'
                              : 'hover:bg-neutral-50'
                          )}
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="flex-1 text-left truncate">{tag.name}</span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-neutral-600" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    <TagIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Henüz etiket yok</p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setIsCreating(true)}
                      className="mt-1"
                    >
                      İlk etiketi oluştur
                    </Button>
                  </div>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

// Simple tag display component
interface TagBadgeProps {
  tag: Tag
  size?: 'sm' | 'default'
  onRemove?: () => void
}

export function TagBadge({ tag, size = 'default', onRemove }: TagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5',
        onRemove && 'pr-1'
      )}
      style={{
        backgroundColor: `${tag.color}15`,
        borderColor: `${tag.color}40`,
        color: tag.color,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 rounded-full hover:bg-black/10 p-0.5"
        >
          <X className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
        </button>
      )}
    </Badge>
  )
}

// Tags display for lists
interface TagsDisplayProps {
  tags: Tag[]
  maxDisplay?: number
  size?: 'sm' | 'default'
}

export function TagsDisplay({ tags, maxDisplay = 3, size = 'default' }: TagsDisplayProps) {
  if (!tags || tags.length === 0) return null

  const displayTags = tags.slice(0, maxDisplay)
  const remainingCount = tags.length - maxDisplay

  return (
    <div className="flex flex-wrap gap-1">
      {displayTags.map(tag => (
        <TagBadge key={tag.id} tag={tag} size={size} />
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className={cn(
            'font-medium text-muted-foreground',
            size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'
          )}
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}
