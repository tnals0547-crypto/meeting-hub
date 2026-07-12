import { Loader2, CheckCircle, AlertCircle, HelpCircle, Archive, UserPlus } from 'lucide-react'
import type { MeetingStatus } from '@/types/meeting'

interface StatusBadgeProps {
  status: MeetingStatus
  loading?: boolean
}

const statusConfig: Record<
  MeetingStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  pending: {
    label: '참석 요청 대기',
    className: 'border border-info/15 bg-info-bg text-info',
    icon: <HelpCircle className="h-3 w-3" />,
  },
  response_collecting: {
    label: '응답 확인 중',
    className: 'border border-warning/15 bg-warning-bg text-warning',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  response_complete: {
    label: '대체 참석 필요',
    className: 'border border-status-replacement/15 bg-status-replacement-bg text-status-replacement',
    icon: <UserPlus className="h-3 w-3" />,
  },
  confirmed: {
    label: '확정 완료',
    className: 'border border-success/15 bg-success-bg text-success',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  completed: {
    label: '회의 기록',
    className: 'border border-gray-200 bg-gray-100 text-gray-700',
    icon: <Archive className="h-3 w-3" />,
  },
}

export default function StatusBadge({ status, loading }: StatusBadgeProps) {
  const config = statusConfig[status]

  if (loading) {
    return (
      <span className="inline-flex h-6 items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 text-caption font-medium text-gray-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        확인 중
      </span>
    )
  }

  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-caption font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  )
}
