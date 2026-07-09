import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Calendar, Clock, MapPin, Users, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import { meetings } from '@/data/mock'
import type { Meeting, MeetingStatus, MeetingRole } from '@/types/meeting'
import StatusBadge from '@/components/common/StatusBadge'
import Button from '@/components/common/Button'
import ProgressStepper from '@/components/ProgressStepper'
import ParticipantList from '@/components/ParticipantList'
import ConfirmConditions from '@/components/ConfirmConditions'
import PageLayout from '@/components/layout/PageLayout'
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
    return `${declinedRequired.name}(${declinedRequired.department} · ${declinedRequired.role})님은 필수 참석자예요. 대체 참석자를 선택하면 회의를 확정할 수 있습니다.`
  }

  return '회의 확정을 위해 필요한 조건을 확인해주세요.'
}

function getOrganizerCta(status: MeetingStatus, hasDeclinedRequired: boolean, meetingId: string) {
  switch (status) {
    case 'pending':
      return { text: '참석 요청 보내기', href: '#' }
    case 'response_collecting':
      return { text: '미응답자에게 다시 요청하기', href: '#' }
    case 'response_complete':
      return {
        text: hasDeclinedRequired ? '대체 참석자 선택하기' : '회의 확정하기',
        href: hasDeclinedRequired ? `/meetings/${meetingId}/replacement` : '#',
      }
    case 'confirmed':
      return { text: '확정 정보 보기', href: '#' }
  }
}

function ResponseSummary({ meeting }: { meeting: Meeting }) {
  const approved = meeting.participants.filter((p) => p.responseStatus === 'approved').length
  const declined = meeting.participants.filter((p) => p.responseStatus === 'declined').length
  const pending = meeting.participants.filter((p) => p.responseStatus === 'pending').length
  const total = meeting.participants.length
  const hasRequiredDeclined = meeting.participants.some(
    (p) => p.isRequired && p.responseStatus === 'declined',
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-caption font-medium text-gray-500">참석자</span>
        </div>
        <span className="text-caption text-gray-400">{total}명</span>
      </div>

      <div className="flex gap-1.5">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${(approved / total) * 100}%`,
            backgroundColor: hasRequiredDeclined ? '#f59e0b' : '#16a34a',
          }}
        />
        {declined > 0 && (
          <div
            className="h-2 rounded-full bg-red-400 transition-all"
            style={{ width: `${(declined / total) * 100}%` }}
          />
        )}
        {pending > 0 && (
          <div
            className="h-2 rounded-full bg-gray-200 transition-all"
            style={{ width: `${(pending / total) * 100}%` }}
          />
        )}
      </div>

      <div className="flex gap-3">
        <span className="inline-flex items-center gap-1 text-caption text-green-600">
          <CheckCircle className="h-3.5 w-3.5" />
          {approved}
        </span>
        {declined > 0 && (
          <span className="inline-flex items-center gap-1 text-caption text-red-500">
            <XCircle className="h-3.5 w-3.5" />
            {declined}
          </span>
        )}
        {pending > 0 && (
          <span className="inline-flex items-center gap-1 text-caption text-gray-400">
            <HelpCircle className="h-3.5 w-3.5" />
            {pending}
          </span>
        )}
      </div>
    </div>
  )
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
    approved: meeting.participants.filter((p) => p.responseStatus === 'approved').length,
    declined: meeting.participants.filter((p) => p.responseStatus === 'declined').length,
    pending: meeting.participants.filter((p) => p.responseStatus === 'pending').length,
  }

  const hasDeclinedRequired = meeting.participants.some(
    (p) => p.isRequired && p.responseStatus === 'declined',
  )

  const statusDot: Record<string, string> = {
    pending: 'bg-blue-500',
    response_collecting: 'bg-amber-500',
    response_complete: 'bg-purple-500',
    confirmed: 'bg-green-500',
  }

  const isConfirmed = meeting.status === 'confirmed'
  const needsReplacement = meeting.status === 'response_complete' && hasDeclinedRequired

  const headerSection = (
    <>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-heading-s font-semibold text-gray-900">{meeting.title}</h1>
          <p className="mt-1 text-body-sm text-gray-500">
            {formatDate(meeting.createdAt)}
            {meeting.location && ` · ${meeting.location}`}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <StatusBadge status={meeting.status} />
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${
          meeting.myRole === 'organizer'
            ? 'bg-brand-50 text-brand-700'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {meeting.myRole === 'organizer' ? '주최자' : '참석자'}
        </span>
      </div>
    </>
  )

  const organizerReasonSection = !isConfirmed && (
    <section className="rounded-xl border border-amber-100 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <span className="text-caption font-bold text-amber-700">!</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {needsReplacement ? '대체 참석자 선택이 필요해요' : '회의를 확정할 수 없는 이유'}
          </h3>
          <p className="mt-1 text-body-sm leading-relaxed text-gray-700">
            {getReason(meeting)}
          </p>
        </div>
      </div>
    </section>
  )

  const participantResponseSection = meeting.myRole === 'participant' && (
    <div className="rounded-xl bg-gray-50 p-5">
      <h3 className="text-sm font-semibold text-gray-900">내 응답</h3>
      <p className="mt-1 text-body-sm text-gray-500">참석 여부를 선택해주세요.</p>
      <div className="mt-3 flex gap-2">
        <Button variant="primary" className="flex-1 gap-1.5">
          <CheckCircle className="h-4 w-4" />
          <span>참석</span>
        </Button>
        <Button variant="secondary" className="flex-1 gap-1.5">
          <XCircle className="h-4 w-4" />
          <span>불참</span>
        </Button>
      </div>
    </div>
  )

  const rightPanel = (
    <div className="hidden lg:flex lg:flex-col lg:gap-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">응답 현황</h3>
        <div className="mt-3">
          <ResponseSummary meeting={meeting} />
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">참석자 목록</h3>
        <div className="mt-3">
          <ParticipantList participants={meeting.participants} />
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">회의 정보</h3>
        <dl className="mt-2 space-y-2 text-body-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <dd>{meeting.organizerName}</dd>
          </div>
          {meeting.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <dd>{meeting.location}</dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <dd>{formatDate(meeting.createdAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )

  const sidebar = (
    <div className="hidden lg:block">
      <h2 className="text-title font-semibold text-gray-900">내 회의</h2>
      <nav className="mt-3 space-y-1">
        {meetings.map((m) => (
          <Link
            key={m.id}
            href={`/meetings/${m.id}`}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-title transition-colors ${
              m.id === id
                ? 'bg-brand-50 font-medium text-gray-900'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${statusDot[m.status]}`} />
            <span className="truncate">{m.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  )

  return (
    <div className="flex flex-col items-center bg-gray-50 min-h-full">
      <div className="w-full max-w-7xl px-6 pt-6 pb-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-body-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Relay
        </Link>
        {headerSection}
      </div>

      <PageLayout sidebar={sidebar} right={rightPanel}>
        {/* Mobile: single column */}
        <div className="lg:hidden space-y-5">
          {meeting.myRole === 'participant' ? (
            <>
              {participantResponseSection}
              <ProgressStepper status={meeting.status} myRole="participant" />
              <div>
                <h3 className="text-title font-semibold text-gray-900">응답 현황</h3>
                <div className="mt-3 flex gap-2">
                  {(['approved', 'declined', 'pending'] as const).map((key) => (
                    <div
                      key={key}
                      className={`inline-flex h-6 items-center rounded-full px-2 text-caption font-medium ${summaryLabel[key].className}`}
                    >
                      <span className="font-semibold">{summary[key]}</span>
                      <span className="ml-1">{summaryLabel[key].label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {organizerReasonSection}
              <ConfirmConditions meeting={meeting} />
              <ProgressStepper status={meeting.status} myRole="organizer" />
              <div>
                <h3 className="text-title font-semibold text-gray-900">응답 현황</h3>
                <div className="mt-3 flex gap-2">
                  {(['approved', 'declined', 'pending'] as const).map((key) => (
                    <div
                      key={key}
                      className={`inline-flex h-6 items-center rounded-full px-2 text-caption font-medium ${summaryLabel[key].className}`}
                    >
                      <span className="font-semibold">{summary[key]}</span>
                      <span className="ml-1">{summaryLabel[key].label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {needsReplacement && (
                <Button
                  href={`/meetings/${meeting.id}/replacement`}
                  variant="primary"
                  className="w-full justify-between"
                >
                  <span>대체 참석자 선택하기</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
              {!isConfirmed && !needsReplacement && meeting.status === 'response_complete' && (
                <Button className="w-full justify-between">
                  <span>회의 확정하기</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
            </>
          )}
          <div>
            <h3 className="text-title font-semibold text-gray-900">참석자 목록</h3>
            <div className="mt-3">
              <ParticipantList participants={meeting.participants} />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-title font-medium text-gray-500">회의 정보</h3>
            <dl className="mt-2 space-y-1 text-body-sm text-gray-600">
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
          </div>
        </div>

        {/* Desktop: center column — action & progress */}
        <div className="hidden lg:block space-y-6">
          {meeting.myRole === 'participant' ? (
            <>
              {participantResponseSection}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">진행 단계</h3>
                <ProgressStepper status={meeting.status} myRole="participant" />
              </div>
            </>
          ) : (
            <>
              {organizerReasonSection}
              <ConfirmConditions meeting={meeting} />
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">진행 단계</h3>
                <ProgressStepper status={meeting.status} myRole="organizer" />
              </div>
              {needsReplacement && (
                <Button
                  href={`/meetings/${meeting.id}/replacement`}
                  variant="primary"
                  className="w-full justify-between text-base"
                >
                  <span>대체 참석자 선택하기</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
              {!isConfirmed && !needsReplacement && meeting.status === 'response_complete' && (
                <Button className="w-full justify-between text-base">
                  <span>회의 확정하기</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
              {isConfirmed && (
                <Button className="w-full justify-between text-base">
                  <span>확정 정보 보기</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
            </>
          )}
        </div>
      </PageLayout>
    </div>
  )
}
