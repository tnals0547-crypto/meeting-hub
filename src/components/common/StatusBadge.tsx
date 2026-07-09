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
    className: 'bg-blue-50 text-blue-700',
    icon: <HelpCircle className="h-3.5 w-3.5" />,
  },
  response_collecting: {
    label: '응답 확인 중',
    className: 'bg-amber-50 text-amber-700',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  response_complete: {
    label: '대체 참석 필요',
    className: 'bg-purple-50 text-purple-700',
    icon: <UserPlus className="h-3.5 w-3.5" />,
  },
  confirmed: {
    label: '확정 완료',
    className: 'bg-green-50 text-green-700',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  completed: {
    label: '회의 기록',
    className: 'bg-gray-100 text-gray-700',
    icon: <Archive className="h-3.5 w-3.5" />,
  },
}

export default function StatusBadge({ status, loading }: StatusBadgeProps) {
  const config = statusConfig[status]

  if (loading) {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-gray-100 px-3 text-caption font-medium text-gray-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        확인 중
      </span>
    )
  }

  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-caption font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  )
}
