'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  User,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useApprovalRequests,
  useCreateApprovalRequest,
  useRespondToApproval,
} from '@/hooks/use-approvals'
import { useRealtimeApprovals } from '@/hooks/use-realtime'
import { useUsers, useCurrentUser } from '@/hooks/use-users'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ApprovalStatus } from '@/types/database'

interface ApprovalSectionProps {
  marketingItemId: string
}

const statusConfig: Record<ApprovalStatus, {
  label: string
  icon: typeof Clock
  color: string
  bgColor: string
}> = {
  pending: {
    label: 'Bekliyor',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  approved: {
    label: 'Onaylandı',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  rejected: {
    label: 'Reddedildi',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  changes_requested: {
    label: 'Değişiklik İstendi',
    icon: MessageSquare,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
}

export function ApprovalSection({ marketingItemId }: ApprovalSectionProps) {
  const { data: approvals, isLoading } = useApprovalRequests(marketingItemId)
  const { data: users } = useUsers()
  const { data: currentUser } = useCurrentUser()
  const createApproval = useCreateApprovalRequest()
  const respondToApproval = useRespondToApproval()

  // Real-time updates
  useRealtimeApprovals(marketingItemId)

  const [showNewRequest, setShowNewRequest] = useState(false)
  const [selectedReviewer, setSelectedReviewer] = useState<string>('')
  const [responseNotes, setResponseNotes] = useState<Record<string, string>>({})

  const handleCreateRequest = async () => {
    try {
      await createApproval.mutateAsync({
        marketingItemId,
        reviewerId: selectedReviewer || undefined,
      })
      setShowNewRequest(false)
      setSelectedReviewer('')
      toast.success('Onay isteği gönderildi')
    } catch {
      toast.error('Onay isteği gönderilemedi')
    }
  }

  const handleRespond = async (id: string, status: ApprovalStatus) => {
    try {
      await respondToApproval.mutateAsync({
        id,
        status,
        notes: responseNotes[id],
        marketingItemId,
      })
      setResponseNotes((prev) => ({ ...prev, [id]: '' }))
      toast.success(
        status === 'approved'
          ? 'Onaylandı'
          : status === 'rejected'
          ? 'Reddedildi'
          : 'Değişiklik istendi'
      )
    } catch {
      toast.error('İşlem başarısız')
    }
  }

  const pendingForMe = approvals?.filter(
    (a) => a.status === 'pending' && a.reviewer_id === currentUser?.id
  )

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-12 bg-neutral-200 rounded" />
        <div className="h-24 bg-neutral-200 rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* New Request Button */}
      {!showNewRequest ? (
        <Button
          variant="outline"
          onClick={() => setShowNewRequest(true)}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          Onay İsteği Gönder
        </Button>
      ) : (
        <div className="p-4 border rounded-lg space-y-3">
          <h4 className="font-medium text-sm">Yeni Onay İsteği</h4>
          <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
            <SelectTrigger>
              <SelectValue placeholder="Onaylayacak kişiyi seç (opsiyonel)" />
            </SelectTrigger>
            <SelectContent>
              {users
                ?.filter((u) => u.id !== currentUser?.id)
                .map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateRequest}
              disabled={createApproval.isPending}
              size="sm"
            >
              Gönder
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowNewRequest(false)}
              size="sm"
            >
              İptal
            </Button>
          </div>
        </div>
      )}

      {/* Pending Approvals for Current User */}
      {pendingForMe && pendingForMe.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
          <h4 className="font-medium text-amber-800 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Senin Onayını Bekliyor ({pendingForMe.length})
          </h4>
          {pendingForMe.map((approval) => (
            <div key={approval.id} className="bg-white p-3 rounded border space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-neutral-400" />
                <span className="font-medium">
                  {approval.requester?.full_name || approval.requester?.email}
                </span>
                <span className="text-neutral-400">tarafından istendi</span>
              </div>
              <Textarea
                placeholder="Not ekle (opsiyonel)"
                value={responseNotes[approval.id] || ''}
                onChange={(e) =>
                  setResponseNotes((prev) => ({
                    ...prev,
                    [approval.id]: e.target.value,
                  }))
                }
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleRespond(approval.id, 'approved')}
                  disabled={respondToApproval.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Onayla
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRespond(approval.id, 'changes_requested')}
                  disabled={respondToApproval.isPending}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Değişiklik İste
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRespond(approval.id, 'rejected')}
                  disabled={respondToApproval.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reddet
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval History */}
      {approvals && approvals.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-neutral-700">Onay Geçmişi</h4>
          <div className="space-y-2">
            {approvals.map((approval) => {
              const config = statusConfig[approval.status]
              const Icon = config.icon

              return (
                <div
                  key={approval.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg',
                    config.bgColor
                  )}
                >
                  <Icon className={cn('h-5 w-5 mt-0.5', config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('font-medium text-sm', config.color)}>
                        {config.label}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatDistanceToNow(new Date(approval.created_at), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mt-0.5">
                      {approval.requester?.full_name || approval.requester?.email} tarafından istendi
                      {approval.reviewer && (
                        <>, {approval.reviewer.full_name || approval.reviewer.email} tarafından yanıtlandı</>
                      )}
                    </p>
                    {approval.notes && (
                      <p className="text-sm text-neutral-500 mt-1 italic">
                        "{approval.notes}"
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {(!approvals || approvals.length === 0) && !showNewRequest && (
        <p className="text-center text-neutral-500 py-4 text-sm">
          Henüz onay isteği yok
        </p>
      )}
    </div>
  )
}
