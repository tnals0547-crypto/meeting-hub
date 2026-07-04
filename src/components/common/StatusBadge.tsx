import type { MeetingStatus } from '@/types/meeting'

interface StatusBadgeProps {
  status: MeetingStatus
}

const statusConfig: Record<
  MeetingStatus,
  { label: string; className: string }
> = {
  pending: {
    label: '응답 요청 필요',
    className: 'bg-blue-50 text-blue-700',
  },
  response_collecting: {
    label: '응답 확인 필요',
    className: 'bg-amber-50 text-amber-700',
  },
  response_complete: {
    label: '대체 참석 필요',
    className: 'bg-red-50 text-red-700',
  },
  confirmed: {
    label: '확정 완료',
    className: 'bg-green-50 text-green-700',
  },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
