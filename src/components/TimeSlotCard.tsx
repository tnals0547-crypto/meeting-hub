'use client'

import type { TimeSlotWithAvailability } from '@/types/meeting'
import Button from '@/components/common/Button'

interface TimeSlotCardProps {
  slot: TimeSlotWithAvailability
  mode: 'hero' | 'compact'
  onSelect?: () => void
  onSubmit?: () => void
  memberNames: Record<string, string>
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${days[d.getDay()]})`
}

export default function TimeSlotCard({
  slot,
  mode,
  onSelect,
  onSubmit,
  memberNames,
}: TimeSlotCardProps) {
  const {
    availableMemberIds,
    totalMemberCount,
    requiredAvailableCount,
    requiredTotalCount,
    allRequiredAvailable,
  } = slot

  if (mode === 'hero') {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <p className="text-title font-semibold text-gray-900">
          바로 요청 가능한 시간
        </p>

        <p className="mt-4 text-heading-s font-bold text-gray-900">
          {formatDateLabel(slot.date)}
        </p>
        <p className="text-heading-s font-bold text-gray-900">
          {slot.startTime} ~ {slot.endTime}
        </p>

        <div className="mt-4 space-y-2">
          <p className="text-body-sm text-gray-900">
            {totalMemberCount}명 중 {availableMemberIds.length}명 가능
          </p>
          <p className="text-body-sm text-gray-600">
            필수 참석자{' '}
            {allRequiredAvailable
              ? '모두 가능'
              : `${requiredAvailableCount}/${requiredTotalCount}명 가능`}
          </p>
        </div>

        {availableMemberIds.length > 0 && (
          <div className="mt-4">
            <p className="text-caption text-gray-600">가능한 참석자</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableMemberIds.map((mid) => (
                <span
                  key={mid}
                  className="inline-flex h-6 items-center rounded-full bg-surface-muted px-2 text-caption text-gray-700"
                >
                  {memberNames[mid] ?? mid}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button onClick={onSubmit} className="w-full">
            이 시간으로 요청하기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left transition-shadow hover:shadow-sm"
    >
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {formatDateLabel(slot.date)}
        </p>
        <p className="text-sm text-gray-600">
          {slot.startTime} ~ {slot.endTime}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          {availableMemberIds.length}/{totalMemberCount}명 가능
        </p>
        <p className="text-xs text-gray-500">
          {allRequiredAvailable
            ? '필수 모두 가능'
            : `필수 ${requiredAvailableCount}/${requiredTotalCount}`}
        </p>
      </div>
    </button>
  )
}
