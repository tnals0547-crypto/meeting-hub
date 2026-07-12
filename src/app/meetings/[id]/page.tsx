import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Calendar, MapPin, Users, CheckCircle, XCircle, HelpCircle, FileText, Mic, Video } from 'lucide-react'
import { meetings } from '@/data/mock'
import type { Meeting } from '@/types/meeting'
import StatusBadge from '@/components/common/StatusBadge'
import Button from '@/components/common/Button'
import ProgressStepper from '@/components/ProgressStepper'
import ParticipantList from '@/components/ParticipantList'
import ConfirmConditions from '@/components/ConfirmConditions'
import PageLayout from '@/components/layout/PageLayout'
import DynamicMeetingPage from './DynamicMeetingPage'
import StoreMeetingSnapshot from '@/components/StoreMeetingSnapshot'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function formatTimeSlot(meeting: Meeting) {
  if (!meeting.confirmedTimeSlot) return '확정 시간 없음'
  return `${meeting.confirmedTimeSlot.date} ${meeting.confirmedTimeSlot.startTime}~${meeting.confirmedTimeSlot.endTime}`
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
          <span className="text-body-sm font-medium text-gray-500">참석자</span>
        </div>
        <span className="text-body-sm text-gray-400">{total}명</span>
      </div>

      <div className="flex gap-1.5">
        <div
          className={`h-2 rounded-full transition-all ${hasRequiredDeclined ? 'bg-warning' : 'bg-info'}`}
          style={{ width: `${(approved / total) * 100}%` }}
        />
        {declined > 0 && (
          <div
            className="h-2 rounded-full bg-gray-400 transition-all"
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
        <span className="inline-flex items-center gap-1 text-body-sm text-success">
          <CheckCircle className="h-3.5 w-3.5" />
          {approved}
        </span>
        {declined > 0 && (
          <span className="inline-flex items-center gap-1 text-body-sm text-danger">
            <XCircle className="h-3.5 w-3.5" />
            {declined}
          </span>
        )}
        {pending > 0 && (
          <span className="inline-flex items-center gap-1 text-body-sm text-gray-400">
            <HelpCircle className="h-3.5 w-3.5" />
            {pending}
          </span>
        )}
      </div>
    </div>
  )
}

const summaryLabel: Record<string, { label: string; className: string }> = {
  approved: { label: '승인', className: 'bg-success-bg text-success' },
  declined: { label: '불참', className: 'bg-danger-bg text-danger' },
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
  const { source, view, response, mail } = await searchParams
  const sourceMailId = typeof mail === 'string' ? mail : undefined

  if (source === 'new' || source === 'stored') {
    return <DynamicMeetingPage id={id} />
  }

  const meeting = meetings.find((m) => m.id === id)

  if (!meeting) {
    notFound()
  }

  if (meeting.status === 'completed') {
    const records = meeting.records
    const rightPanel = (
      <div className="hidden lg:flex lg:flex-col lg:gap-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-title font-semibold text-gray-900">회의 정보</h3>
          <dl className="mt-3 space-y-2 text-body-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <dd>{meeting.organizerName} · 참석자 {meeting.participants.length}명</dd>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <dd>{formatTimeSlot(meeting)}</dd>
            </div>
            {meeting.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <dd>{meeting.location}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-title font-semibold text-gray-900">참석자</h3>
          <div className="mt-3">
            <ParticipantList participants={meeting.participants} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-title font-semibold text-gray-900">다음 액션</h3>
          <p className="mt-2 text-body-sm leading-relaxed text-gray-600">
            회의록과 기록 파일을 확인한 뒤 후속 액션을 업무 채널에 공유할 수 있습니다.
          </p>
        </div>
      </div>
    )

    return (
      <div className="flex min-h-full flex-col bg-gray-50">
        <div className="w-full border-b border-gray-200 bg-white px-6 py-5">
          <Link
            href="/meetings?filter=completed"
            className="inline-flex items-center gap-1 text-body-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            ← 회의 기록
          </Link>
          <div className="mt-4 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-heading-s font-semibold text-gray-900">{meeting.title}</h1>
              <p className="mt-1 text-body-sm text-gray-500">
                {formatTimeSlot(meeting)}
                {meeting.location && ` · ${meeting.location}`}
              </p>
            </div>
            <StatusBadge status={meeting.status} />
          </div>
        </div>

        <PageLayout hideSidebar right={rightPanel}>
          <div className="space-y-5">
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <h2 className="text-title font-semibold text-gray-900">회의록</h2>
              </div>
              <ul className="mt-4 space-y-3">
                {(records?.minutes ?? ['회의록이 정리 중입니다.']).map((minute) => (
                  <li key={minute} className="flex gap-2 text-body-sm leading-relaxed text-gray-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    <span>{minute}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-gray-400" />
                  <h2 className="text-title font-semibold text-gray-900">녹음 기록</h2>
                </div>
                <p className="mt-3 text-body-sm font-medium text-gray-900">{records?.recording.title ?? '녹음 기록'}</p>
                <p className="mt-1 text-body-sm text-gray-500">
                  {records?.recording.duration ?? '-'} · {records?.recording.status === 'processing' ? '처리 중' : '확인 가능'}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-gray-400" />
                  <h2 className="text-title font-semibold text-gray-900">화상회의 녹화</h2>
                </div>
                <p className="mt-3 text-body-sm font-medium text-gray-900">{records?.video.title ?? '화상회의 녹화'}</p>
                <p className="mt-1 text-body-sm text-gray-500">
                  {records?.video.duration ?? '-'} · {records?.video.status === 'processing' ? '처리 중' : '확인 가능'}
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 lg:hidden">
              <h2 className="text-title font-semibold text-gray-900">참석자</h2>
              <div className="mt-3">
                <ParticipantList participants={meeting.participants} />
              </div>
            </section>
          </div>
        </PageLayout>
      </div>
    )
  }

  const isResponseStatusView = view === 'response-status'
  const isRespondView = view === 'respond'
  const responseChoice = response === 'approved' || response === 'declined' ? response : null
  const responseTargetId = meeting.participants.find((p) => p.responseStatus === 'pending')?.id
  const viewMeeting: Meeting = responseChoice && responseTargetId
    ? {
      ...meeting,
      status: meeting.status === 'pending' ? 'response_collecting' : meeting.status,
      participants: meeting.participants.map((participant) =>
        participant.id === responseTargetId
          ? {
            ...participant,
            responseStatus: responseChoice,
            respondedAt: new Date().toISOString(),
          }
          : participant,
      ),
    }
    : meeting

  const summary = {
    approved: viewMeeting.participants.filter((p) => p.responseStatus === 'approved').length,
    declined: viewMeeting.participants.filter((p) => p.responseStatus === 'declined').length,
    pending: viewMeeting.participants.filter((p) => p.responseStatus === 'pending').length,
  }

  const hasDeclinedRequired = viewMeeting.participants.some(
    (p) => p.isRequired && p.responseStatus === 'declined',
  )

  const isConfirmed = viewMeeting.status === 'confirmed'
  const needsReplacement = viewMeeting.status === 'response_complete' && hasDeclinedRequired
  const pageRole = isResponseStatusView ? 'organizer' : isRespondView ? 'participant' : viewMeeting.myRole
  const responseMailQuery = sourceMailId ? `&mail=${sourceMailId}` : ''

  const headerSection = (
    <>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-heading-s font-semibold text-gray-900">{meeting.title}</h1>
          <p className="mt-1 text-body-sm text-gray-500">
            {formatDate(viewMeeting.createdAt)}
            {viewMeeting.location && ` · ${viewMeeting.location}`}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <StatusBadge status={viewMeeting.status} />
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium ${
          pageRole === 'organizer'
            ? 'bg-gray-100 text-gray-700'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isResponseStatusView ? '응답 확인' : pageRole === 'organizer' ? '주최자' : '참석자'}
        </span>
      </div>
    </>
  )

  const organizerReasonSection = !isConfirmed && (
    <section className="rounded-xl border border-l-4 border-gray-200 border-l-warning bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
          <span className="text-body-sm font-bold text-warning">!</span>
        </div>
        <div>
          <h3 className="text-title font-semibold text-gray-900">
            {needsReplacement ? '대체 참석자 선택이 필요해요' : '회의를 확정할 수 없는 이유'}
          </h3>
          <p className="mt-1 text-body-sm leading-relaxed text-gray-700">
            {getReason(viewMeeting)}
          </p>
        </div>
      </div>
    </section>
  )

  const participantResponseSection = pageRole === 'participant' && (
    <div className="rounded-xl bg-gray-50 p-5">
      <h3 className="text-title font-semibold text-gray-900">내 응답</h3>
      {responseChoice ? (
        <div className="mt-3 rounded-[8px] border border-gray-200 bg-white px-4 py-3">
          <p className="text-body-sm font-medium text-gray-900">
            {responseChoice === 'approved' ? '참석으로 응답했습니다.' : '불참으로 응답했습니다.'}
          </p>
          <p className="mt-1 text-body-sm text-gray-600">
            응답 현황과 참석자 목록에 바로 반영되었습니다.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-body-sm text-gray-500">참석 여부를 선택해주세요.</p>
          <div className="mt-3 flex gap-2">
            <Button href={`/meetings/${meeting.id}?view=respond&response=approved${responseMailQuery}`} variant="primary" className="flex-1 gap-1.5">
              <CheckCircle className="h-4 w-4" />
              <span>참석</span>
            </Button>
            <Button href={`/meetings/${meeting.id}?view=respond&response=declined${responseMailQuery}`} variant="secondary" className="flex-1 gap-1.5">
              <XCircle className="h-4 w-4" />
              <span>불참</span>
            </Button>
          </div>
        </>
      )}
    </div>
  )

  const rightPanel = (
    <div className="hidden lg:flex lg:flex-col lg:gap-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-title font-semibold text-gray-900">응답 현황</h3>
        <div className="mt-3">
          <ResponseSummary meeting={viewMeeting} />
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-title font-semibold text-gray-900">참석자 목록</h3>
        <div className="mt-3">
          <ParticipantList
            participants={viewMeeting.participants}
            enableReminderActions={pageRole === 'organizer' && summary.pending > 0}
          />
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-title font-semibold text-gray-900">회의 정보</h3>
        <dl className="mt-2 space-y-2 text-body-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <dd>{viewMeeting.organizerName}</dd>
          </div>
          {viewMeeting.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <dd>{viewMeeting.location}</dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <dd>{formatDate(viewMeeting.createdAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      {(responseChoice || (sourceMailId && isResponseStatusView)) && (
        <StoreMeetingSnapshot meeting={viewMeeting} mailId={sourceMailId} />
      )}
      <div className="w-full border-b border-gray-200 bg-white px-6 py-5">
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1 text-body-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← 회의
        </Link>
        {headerSection}
      </div>

      <PageLayout hideSidebar right={rightPanel}>
        {/* Mobile: single column */}
        <div className="lg:hidden space-y-5">
          {pageRole === 'participant' ? (
            <>
              {participantResponseSection}
              <ProgressStepper status={viewMeeting.status} myRole="participant" />
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
              <ConfirmConditions meeting={viewMeeting} />
              <ProgressStepper status={viewMeeting.status} myRole="organizer" />
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
                  href={`/meetings/${viewMeeting.id}/replacement`}
                  variant="primary"
                  className="w-full justify-between"
                >
                  <span>대체 참석자 선택하기</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
              {!isConfirmed && !needsReplacement && viewMeeting.status === 'response_complete' && (
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
              <ParticipantList
                participants={viewMeeting.participants}
                enableReminderActions={pageRole === 'organizer' && summary.pending > 0}
              />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-title font-medium text-gray-500">회의 정보</h3>
            <dl className="mt-2 space-y-1 text-body-sm text-gray-600">
              <div className="flex gap-1">
                <dt>주최자</dt>
                <dd>{viewMeeting.organizerName}</dd>
              </div>
              <div className="flex gap-1">
                <dt>장소</dt>
                <dd>{viewMeeting.location}</dd>
              </div>
              <div className="flex gap-1">
                <dt>생성일</dt>
                <dd>{formatDate(viewMeeting.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Desktop: center column — action & progress */}
        <div className="hidden lg:block space-y-6">
          {pageRole === 'participant' ? (
            <>
              {participantResponseSection}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-title font-semibold text-gray-900 mb-4">진행 단계</h3>
                <ProgressStepper status={viewMeeting.status} myRole="participant" />
              </div>
            </>
          ) : (
            <>
              {organizerReasonSection}
              <ConfirmConditions meeting={viewMeeting} />
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-title font-semibold text-gray-900 mb-4">진행 단계</h3>
                <ProgressStepper status={viewMeeting.status} myRole="organizer" />
              </div>
              {needsReplacement && (
                <Button
                  href={`/meetings/${viewMeeting.id}/replacement`}
                  variant="primary"
                  className="w-full justify-between"
                >
                  <span>대체 참석자 선택하기</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
              {!isConfirmed && !needsReplacement && viewMeeting.status === 'response_complete' && (
                <Button className="w-full justify-between">
                  <span>회의 확정하기</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
              {isConfirmed && (
                <Button className="w-full justify-between">
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
