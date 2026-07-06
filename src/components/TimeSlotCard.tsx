'use client'

import type { TimeSlotWithAvailability } from '@/types/meeting'

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
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <p className="text-sm font-semibold text-gray-900">
          바로 요청 가능한 시간
        </p>

        <p className="mt-4 text-lg font-bold text-gray-900">
          {formatDateLabel(slot.date)}
        </p>
        <p className="text-lg font-bold text-gray-900">
          {slot.startTime} ~ {slot.endTime}
        </p>

        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-900">
            {totalMemberCount}명 중 {availableMemberIds.length}명 가능
          </p>
          <p
            className={`text-sm ${allRequiredAvailable ? 'text-green-600' : 'text-red-500'}`}
          >
            필수 참석자{' '}
            {allRequiredAvailable
              ? '모두 가능'
              : `${requiredAvailableCount}/${requiredTotalCount}명 가능`}
          </p>
        </div>

        {availableMemberIds.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500">가능한 참석자</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableMemberIds.map((mid) => (
                <span
                  key={mid}
                  className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                >
                  {memberNames[mid] ?? mid}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={onSubmit}
            className="flex w-full items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black/80"
          >
            이 시간으로 요청하기
          </button>
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
        <p className="text-sm text-gray-500">
          {slot.startTime} ~ {slot.endTime}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          {availableMemberIds.length}/{totalMemberCount}명 가능
        </p>
        <p
          className={`text-xs ${allRequiredAvailable ? 'text-green-600' : 'text-red-400'}`}
        >
          {allRequiredAvailable
            ? '필수 모두 가능'
            : `필수 ${requiredAvailableCount}/${requiredTotalCount}`}
        </p>
      </div>
    </button>
  )
}
