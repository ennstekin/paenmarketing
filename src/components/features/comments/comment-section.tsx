'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Send, Reply, Trash2, Edit2, MoreHorizontal, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  type CommentWithUser,
} from '@/hooks/use-comments'
import { useRealtimeComments } from '@/hooks/use-realtime'
import { useCurrentUser } from '@/hooks/use-users'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CommentSectionProps {
  marketingItemId: string
}

export function CommentSection({ marketingItemId }: CommentSectionProps) {
  const { data: comments, isLoading } = useComments(marketingItemId)
  const { data: currentUser } = useCurrentUser()
  const createComment = useCreateComment()

  // Real-time updates
  useRealtimeComments(marketingItemId)

  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await createComment.mutateAsync({
        marketingItemId,
        content: newComment,
        parentId: replyingTo || undefined,
      })
      setNewComment('')
      setReplyingTo(null)
      toast.success('Yorum eklendi')
    } catch {
      toast.error('Yorum eklenemedi')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 bg-neutral-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 rounded w-1/4" />
              <div className="h-12 bg-neutral-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        {replyingTo && (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Reply className="h-4 w-4" />
            <span>Yanıtlıyorsun</span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-red-500 hover:underline"
            >
              İptal
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Yorum yaz..."
            className="min-h-[60px] resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newComment.trim() || createComment.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments?.length === 0 ? (
          <p className="text-center text-neutral-500 py-8">
            Henüz yorum yok. İlk yorumu sen yap!
          </p>
        ) : (
          comments?.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              marketingItemId={marketingItemId}
              currentUserId={currentUser?.id}
              onReply={() => setReplyingTo(comment.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: CommentWithUser
  marketingItemId: string
  currentUserId?: string
  onReply: () => void
  isReply?: boolean
}

function CommentItem({
  comment,
  marketingItemId,
  currentUserId,
  onReply,
  isReply = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()

  const isOwner = currentUserId === comment.user_id

  const handleUpdate = async () => {
    if (!editContent.trim()) return

    try {
      await updateComment.mutateAsync({
        id: comment.id,
        content: editContent,
        marketingItemId,
      })
      setIsEditing(false)
      toast.success('Yorum güncellendi')
    } catch {
      toast.error('Yorum güncellenemedi')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return

    try {
      await deleteComment.mutateAsync({
        id: comment.id,
        marketingItemId,
      })
      toast.success('Yorum silindi')
    } catch {
      toast.error('Yorum silinemedi')
    }
  }

  return (
    <div className={cn('flex gap-3', isReply && 'ml-8')}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
        {comment.user?.avatar_url ? (
          <img
            src={comment.user.avatar_url}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <User className="h-4 w-4 text-neutral-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-neutral-900">
            {comment.user?.full_name || comment.user?.email || 'Anonim'}
          </span>
          <span className="text-xs text-neutral-400">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
              locale: tr,
            })}
          </span>
          {comment.is_edited && (
            <span className="text-xs text-neutral-400">(düzenlendi)</span>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px] resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdate} disabled={updateComment.isPending}>
                Kaydet
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                İptal
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">
              {comment.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-2">
              {!isReply && (
                <button
                  onClick={onReply}
                  className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                >
                  <Reply className="h-3 w-3" />
                  Yanıtla
                </button>
              )}

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-neutral-400 hover:text-neutral-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply as CommentWithUser}
                marketingItemId={marketingItemId}
                currentUserId={currentUserId}
                onReply={onReply}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
