'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import type { Participant } from '@/types/meeting'

interface ParticipantListProps {
  participants: Participant[]
  enableReminderActions?: boolean
}

const responseLabel: Record<string, { label: string; className: string }> = {
  approved: {
    label: '승인',
    className: 'bg-success-bg text-success',
  },
  declined: {
    label: '불참',
    className: 'bg-danger-bg text-danger',
  },
  pending: {
    label: '미응답',
    className: 'bg-gray-100 text-gray-600',
  },
}

export default function ParticipantList({ participants, enableReminderActions = false }: ParticipantListProps) {
  const pendingIds = participants
    .filter((participant) => participant.responseStatus === 'pending')
    .map((participant) => participant.id)
  const [selectedIds, setSelectedIds] = useState<string[]>(pendingIds)
  const [requestedIds, setRequestedIds] = useState<string[]>([])
  const selectedPendingCount = selectedIds.filter((id) => pendingIds.includes(id)).length
  const allPendingRequested = pendingIds.length > 0 && pendingIds.every((id) => requestedIds.includes(id))

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    )
  }

  function requestSelected() {
    setRequestedIds((current) => Array.from(new Set([...current, ...selectedIds])))
    setSelectedIds([])
  }

  return (
    <div className="flex flex-col gap-2">
      {enableReminderActions && pendingIds.length > 0 && (
        <div className="mb-1 rounded-[8px] border border-gray-200 bg-gray-50 px-3 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body-sm font-medium text-gray-900">
                미응답자 {pendingIds.length}명
              </p>
              <p className="mt-0.5 text-body-sm text-gray-600">
                요청할 인원을 선택해서 참석 응답을 다시 요청할 수 있어요.
              </p>
            </div>
            <button
              type="button"
              onClick={requestSelected}
              disabled={selectedPendingCount === 0}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[8px] bg-info px-3 text-body-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              <Send className="h-4 w-4" />
              {allPendingRequested ? '요청 보냄' : `선택 ${selectedPendingCount}명 요청`}
            </button>
          </div>
        </div>
      )}

      {participants.map((p) => {
        const response = responseLabel[p.responseStatus]
        const isPending = p.responseStatus === 'pending'
        const isSelected = selectedIds.includes(p.id)
        const isRequested = requestedIds.includes(p.id)

        return (
          <div
            key={p.id}
            className={`flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ${
              enableReminderActions && isSelected ? 'ring-1 ring-info/25' : ''
            }`}
          >
            <div className="flex min-w-0 items-start gap-3">
              {enableReminderActions && isPending && (
                <button
                  type="button"
                  onClick={() => toggleSelected(p.id)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-body-sm font-bold transition-colors ${
                    isSelected
                      ? 'border-info bg-info text-white'
                      : 'border-gray-300 bg-white text-transparent hover:border-gray-400'
                  }`}
                  aria-label={`${p.name} 응답 요청 선택`}
                >
                  ✓
                </button>
              )}
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-2">
                  <span className="truncate text-body-sm font-medium text-gray-900">
                    {p.name}
                  </span>
                  {p.isRequired && (
                    <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-gray-100 px-2 text-caption font-medium text-gray-700">
                      필수
                    </span>
                  )}
                  {isRequested && (
                    <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-info-bg px-2 text-caption font-medium text-info">
                      요청 보냄
                    </span>
                  )}
                </div>
                <span className="truncate text-body-sm text-gray-600">
                  {p.department} · {p.role}
                </span>
              </div>
            </div>

            <span
              className={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-caption font-medium ${response.className}`}
            >
              {response.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
