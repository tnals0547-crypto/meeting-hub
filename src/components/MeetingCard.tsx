import type { Meeting, MeetingRole } from '@/types/meeting'
import StatusBadge from '@/components/common/StatusBadge'
import Button from '@/components/common/Button'

const ROLE_CONFIG: Record<MeetingRole, { label: string; className: string }> = {
  organizer: { label: '내가 주최', className: 'bg-blue-50 text-blue-600' },
  participant: { label: '참석 요청', className: 'bg-gray-100 text-gray-600' },
}

interface MeetingCardProps {
  meeting: Meeting
  ctaOverride?: { label: string; href: string }
}

const actionConfig: Record<
  string,
  { description: string; cta: string; href: (id: string) => string }
> = {
  pending: {
    description: '아직 참석자에게 응답 요청을 보내지 않았습니다.',
    cta: '참석 요청 보내기',
    href: (id) => `/meetings/${id}`,
  },
  response_collecting: {
    description: '아직 일부 참석자의 응답이 도착하지 않았습니다.',
    cta: '미응답자 확인하기',
    href: (id) => `/meetings/${id}`,
  },
  response_complete: {
    description: '필수 참석자가 불참하여 대체 참석자 지정이 필요합니다.',
    cta: '대체 참석자 지정하기',
    href: (id) => `/meetings/${id}`,
  },
  confirmed: {
    description: '회의가 확정되었습니다.',
    cta: '확정 정보 보기',
    href: (id) => `/meetings/${id}`,
  },
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export default function MeetingCard({ meeting, ctaOverride }: MeetingCardProps) {
  const action = actionConfig[meeting.status] ?? actionConfig.pending
  const ctaLabel = ctaOverride?.label ?? action.cta
  const ctaHref = ctaOverride?.href ?? action.href(meeting.id)

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-md hover:border-gray-200">
      <h3 className="text-base font-semibold text-gray-900">{meeting.title}</h3>

      <p className="mt-1 text-sm text-gray-500">
        {formatDate(meeting.createdAt)} · {meeting.location}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <StatusBadge status={meeting.status} />
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_CONFIG[meeting.myRole].className}`}
        >
          {ROLE_CONFIG[meeting.myRole].label}
        </span>
      </div>

      <p className="mt-2 text-sm leading-snug text-gray-600">
        {action.description}
      </p>

      <div className="mt-3">
        <Button href={ctaHref} className="w-full justify-between">
          <span>{ctaLabel}</span>
          <span className="text-lg leading-none">→</span>
        </Button>
      </div>
    </div>
  )
}
