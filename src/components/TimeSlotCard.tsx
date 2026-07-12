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
    preferenceConflicts,
    totalMemberCount,
    requiredAvailableCount,
    requiredTotalCount,
    allRequiredAvailable,
    hasPreferenceConflict,
  } = slot
  const conflictPreview = preferenceConflicts.slice(0, 2)
  const extraConflictCount = Math.max(0, preferenceConflicts.length - conflictPreview.length)
  const isManualRequest = slot.requestMode === 'manual'

  if (mode === 'hero') {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <p className="text-title font-semibold text-gray-900">
          {isManualRequest ? '직접 요청 시간' : '바로 요청 가능한 시간'}
        </p>
        {isManualRequest && (
          <p className="mt-1 text-body-sm text-gray-600">
            추천 후보가 아니어도 참석자에게 확인 요청을 보낼 수 있어요.
          </p>
        )}

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
            {isManualRequest
              ? '응답 확인 필요'
              : allRequiredAvailable
              ? hasPreferenceConflict ? '모두 가능 · 일정 조율 권장' : '모두 가능'
              : `${requiredAvailableCount}/${requiredTotalCount}명 가능`}
          </p>
        </div>

        {preferenceConflicts.length > 0 && (
          <div className="mt-3 rounded-[8px] border border-warning/20 bg-warning-bg px-3 py-2">
            <p className="text-body-sm font-medium text-warning">일정 조율 권장</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {conflictPreview.map((conflict) => (
                <span key={`${conflict.memberId}-${conflict.reason}`} className="rounded-full bg-white px-2 py-0.5 text-caption text-warning">
                  {conflict.memberName}님 {conflict.reason}
                </span>
              ))}
              {extraConflictCount > 0 && (
                <span className="rounded-full bg-white px-2 py-0.5 text-caption text-warning">
                  외 {extraConflictCount}명
                </span>
              )}
            </div>
          </div>
        )}

        {availableMemberIds.length > 0 && (
          <div className="mt-4">
            <p className="text-body-sm text-gray-600">가능한 참석자</p>
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
            {isManualRequest ? '직접 입력한 시간으로 요청하기' : '이 시간으로 요청하기'}
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
        <p className="text-body-sm text-gray-500">
          {isManualRequest
            ? '응답 확인 필요'
            : allRequiredAvailable
            ? hasPreferenceConflict ? '확인 권장' : '필수 모두 가능'
            : `필수 ${requiredAvailableCount}/${requiredTotalCount}`}
        </p>
        {preferenceConflicts[0] && (
          <p className="mt-1 max-w-[180px] truncate text-body-sm text-warning">
            {preferenceConflicts[0].memberName}님 일정 조율 권장
          </p>
        )}
      </div>
    </button>
  )
}
