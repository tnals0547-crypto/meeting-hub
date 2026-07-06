import Link from 'next/link'
import { notFound } from 'next/navigation'
import { meetings } from '@/data/mock'
import type { Meeting, MeetingStatus } from '@/types/meeting'
import StatusBadge from '@/components/common/StatusBadge'
import Button from '@/components/common/Button'
import ProgressStepper from '@/components/ProgressStepper'
import ParticipantList from '@/components/ParticipantList'
import ConfirmConditions from '@/components/ConfirmConditions'
import DynamicMeetingPage from './DynamicMeetingPage'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function getReason(meeting: Meeting): string {
  if (meeting.status === 'confirmed') return '모든 조건이 충족되어 회의가 확정되었습니다.'

  const pendingParticipants = meeting.participants.filter(
    (p) => p.responseStatus === 'pending',
  )
  const declinedRequired = meeting.participants.find(
    (p) => p.isRequired && p.responseStatus === 'declined',
  )

  if (pendingParticipants.length > 0 && !meeting.participants.some((p) => p.responseStatus !== 'pending')) {
    return `참석자 ${meeting.participants.length}명에게 아직 응답 요청을 보내지 않았어요. 요청을 보내면 참석자들이 가능한 시간을 알려줄 거예요.`
  }

  if (pendingParticipants.length > 0) {
    return `참석자 ${pendingParticipants.length}명이 아직 응답하지 않았어요. 모든 응답이 모여야 회의 확정 여부를 판단할 수 있습니다.`
  }

  if (declinedRequired) {
    return `${declinedRequired.name}(${declinedRequired.department} · ${declinedRequired.role})님은 필수 참석자예요. 대체 참석자가 지정되어야 회의를 확정할 수 있습니다.`
  }

  return '회의 확정을 위해 필요한 조건을 확인해주세요.'
}

function getNextStepHint(status: MeetingStatus): string | null {
  switch (status) {
    case 'pending':
      return '참석 요청을 보낸 후 응답을 기다려주세요.'
    case 'response_collecting':
      return '모든 응답이 수집되면 참석 조건을 확인할 수 있습니다.'
    case 'response_complete':
      return '대체 참석자를 선택한 후 회의를 확정할 수 있습니다.'
    default:
      return null
  }
}

function getCtaConfig(status: MeetingStatus, meetingId: string) {
  switch (status) {
    case 'pending':
      return { text: '참석 요청 보내기', href: '#' }
    case 'response_collecting':
      return { text: '미응답자에게 다시 요청하기', href: '#' }
    case 'response_complete':
      return { text: '대체 참석자 지정하기', href: `/meetings/${meetingId}/replacement` }
    case 'confirmed':
      return { text: '확정 정보 보기', href: '#' }
  }
}

const summaryLabel: Record<string, { label: string; className: string }> = {
  approved: { label: '승인', className: 'bg-green-100 text-green-800' },
  declined: { label: '불참', className: 'bg-red-100 text-red-800' },
  pending: { label: '미응답', className: 'bg-gray-100 text-gray-600' },
}

export default async function MeetingProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const { source } = await searchParams

  if (source === 'new') {
    return <DynamicMeetingPage id={id} />
  }

  const meeting = meetings.find((m) => m.id === id)

  if (!meeting) {
    notFound()
  }

  const summary = {
    approved: meeting.participants.filter((p) => p.responseStatus === 'approved')
      .length,
    declined: meeting.participants.filter((p) => p.responseStatus === 'declined')
      .length,
    pending: meeting.participants.filter((p) => p.responseStatus === 'pending')
      .length,
  }

  const cta = getCtaConfig(meeting.status, meeting.id)
  const nextStepHint = getNextStepHint(meeting.status)

  return (
    <div className="flex flex-col items-center bg-zinc-50 min-h-full">
      <main className="flex w-full max-w-xl flex-col px-6 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          ← Meeting Hub
        </Link>

        <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {formatDate(meeting.createdAt)} · {meeting.location}
        </p>

        <div className="mt-6">
          <StatusBadge status={meeting.status} />
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">
            회의를 아직 확정할 수 없는 이유
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {getReason(meeting)}
          </p>
        </section>

        <div className="mt-6">
          <Button href={cta.href} className="w-full">{cta.text}</Button>
          {nextStepHint && (
            <p className="mt-2 text-xs text-gray-400">{nextStepHint}</p>
          )}
        </div>

        <div className="mt-5">
          <ConfirmConditions meeting={meeting} />
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-semibold text-gray-900">진행 단계</h2>
          <div className="mt-4">
            <ProgressStepper status={meeting.status} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold text-gray-900">응답 현황</h2>
          <div className="mt-3 flex gap-3">
            {(['approved', 'declined', 'pending'] as const).map((key) => (
              <div
                key={key}
                className={`rounded-lg px-3 py-2 text-sm ${summaryLabel[key].className}`}
              >
                <span className="font-semibold">{summary[key]}</span>
                <span className="ml-1">{summaryLabel[key].label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">참석자 목록</h2>
          <div className="mt-3">
            <ParticipantList participants={meeting.participants} />
          </div>
        </section>

        <section className="mt-8 border-t border-gray-100 pt-5">
          <h2 className="text-xs font-medium text-gray-400">회의 정보</h2>
          <dl className="mt-2 space-y-1 text-xs text-gray-400">
            <div className="flex gap-1">
              <dt>주최자</dt>
              <dd>{meeting.organizerName}</dd>
            </div>
            <div className="flex gap-1">
              <dt>장소</dt>
              <dd>{meeting.location}</dd>
            </div>
            <div className="flex gap-1">
              <dt>생성일</dt>
              <dd>{formatDate(meeting.createdAt)}</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  )
}
