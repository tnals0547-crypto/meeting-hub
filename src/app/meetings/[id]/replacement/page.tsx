'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowRight, CheckCircle, Check, AlertTriangle, AlertCircle, Send, ArrowLeft, UserCheck } from 'lucide-react'
import { meetings } from '@/data/mock'
import type { Meeting, ReplacementCandidate, AvailabilityStatus, TimeSlot } from '@/types/meeting'
import StatusBadge from '@/components/common/StatusBadge'
import Button from '@/components/common/Button'
import EmptyState from '@/components/common/EmptyState'
import ErrorState from '@/components/common/ErrorState'
import PageLayout from '@/components/layout/PageLayout'

const AVAILABILITY: Record<AvailabilityStatus, { dotClass: string; label: string }> = {
  available: { dotClass: 'bg-success', label: '지금 연락 가능' },
  in_meeting: { dotClass: 'bg-warning', label: '회의 중' },
  focused: { dotClass: 'bg-info', label: '집중 업무' },
  on_leave: { dotClass: 'bg-danger', label: '연차' },
}

const StatusDot = ({ dotClass }: { dotClass: string }) => (
  <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
)

const STEPS = ['팀원 선택', '요청 확인', '요청 완료']

interface CandidateTimeStatus {
  isAvailable: boolean
  label: string
  conflict?: TimeSlot
}

function timeToMinutes(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function isOverlapping(a: TimeSlot, b: TimeSlot) {
  if (a.date !== b.date) return false
  return timeToMinutes(a.startTime) < timeToMinutes(b.endTime)
    && timeToMinutes(a.endTime) > timeToMinutes(b.startTime)
}

function getCandidateTimeStatus(candidate: ReplacementCandidate, meetingSlot: TimeSlot | null): CandidateTimeStatus {
  if (!meetingSlot) {
    return { isAvailable: true, label: '회의 시간 미정' }
  }

  const conflict = candidate.calendarEvents?.find((event) => isOverlapping(event, meetingSlot))
  if (conflict) {
    return { isAvailable: false, label: '이 시간대 일정 있음', conflict }
  }

  return { isAvailable: true, label: '이 시간대 일정 가능' }
}

function formatTimeSlot(slot: TimeSlot) {
  return `${slot.date} ${slot.startTime}~${slot.endTime}`
}

function sortCandidatesByMeetingTime(candidates: ReplacementCandidate[], meetingSlot: TimeSlot | null) {
  return candidates
    .map((candidate, index) => ({
      candidate,
      index,
      timeStatus: getCandidateTimeStatus(candidate, meetingSlot),
    }))
    .sort((a, b) => {
      if (a.timeStatus.isAvailable !== b.timeStatus.isAvailable) {
        return a.timeStatus.isAvailable ? -1 : 1
      }
      return a.index - b.index
    })
}

function ProblemSection({ meeting }: { meeting: Meeting }) {
  const declinedRequired = meeting.participants.find(
    (p) => p.isRequired && p.responseStatus === 'declined',
  )

  return (
    <section className="rounded-xl border border-l-4 border-gray-200 border-l-warning bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
          <AlertCircle className="h-3.5 w-3.5 text-warning" />
        </div>
        <div>
          <h2 className="text-title font-semibold text-gray-900">대체 참석자 선택이 필요해요</h2>
          {declinedRequired && (
            <p className="mt-1 text-body-sm leading-relaxed text-gray-700">
              <span className="font-medium">{declinedRequired.name}</span>
              ({declinedRequired.department} · {declinedRequired.role})
              님이 필수 참석자이지만 불참했어요. 대체자를 선택해주세요.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function SummaryCard({ meeting }: { meeting: Meeting }) {
  const approved = meeting.participants.filter(
    (p) => p.responseStatus === 'approved',
  ).length
  const total = meeting.participants.length
  const afterPercent = ((approved + 1) / total) * 100

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <p className="text-body-sm font-medium text-gray-600">이번 요청이 완료되면</p>

      <div className="mt-3 flex items-end gap-6">
        <div>
          <p className="text-body-sm text-gray-500">현재</p>
          <p className="mt-1 text-heading-l font-bold text-gray-500">
            {approved}
            <span className="text-title font-normal text-gray-300">/{total}</span>
          </p>
        </div>

        <div className="flex flex-col items-center pb-1">
          <ArrowRight className="h-5 w-5 text-gray-300" />
        </div>

        <div>
          <p className="text-body-sm font-medium text-gray-900">완료 시</p>
          <p className="mt-1 text-heading-l font-bold text-gray-900">
            {approved + 1}
            <span className="text-title font-normal text-gray-600">/{total}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-info transition-all"
          style={{ width: `${Math.min(afterPercent, 100)}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-body-sm">
        <span className="text-gray-500">{Math.round((approved / total) * 100)}%</span>
        <span className="inline-flex items-center gap-1 font-semibold text-success">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>회의 확정 가능</span>
        </span>
      </div>
    </div>
  )
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <span
            className={`inline-flex h-6 items-center rounded-full px-2.5 text-caption font-medium ${
              i <= current
                ? 'bg-info text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {i === current && current < STEPS.length - 1 ? `▶ ${step}` : step}
          </span>
          {i < STEPS.length - 1 && (
            <ArrowRight className="h-3 w-3 text-gray-300" />
          )}
        </div>
      ))}
    </div>
  )
}

function MeetingTimeBadge({ timeStatus }: { timeStatus: CandidateTimeStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-caption font-medium ${
      timeStatus.isAvailable
        ? 'border-success/15 bg-success-bg text-success'
        : 'border-warning/20 bg-warning-bg text-warning'
    }`}>
      <StatusDot dotClass={timeStatus.isAvailable ? 'bg-success' : 'bg-warning'} />
      {timeStatus.label}
    </span>
  )
}

function SelectionRationale({
  candidate,
  timeStatus,
}: {
  candidate: ReplacementCandidate
  timeStatus: CandidateTimeStatus
}) {
  const avail = AVAILABILITY[candidate.availability]

  return (
    <div className="flex flex-wrap items-center gap-2 text-body-sm leading-relaxed text-gray-600">
      <MeetingTimeBadge timeStatus={timeStatus} />
      <span className="inline-flex items-center gap-1">
        <StatusDot dotClass={avail.dotClass} />
        {avail.label}
      </span>
      {candidate.rationale.map((r) => (
        <span key={r} className="inline-flex items-center gap-1">
          <span className="text-gray-300">·</span>
          <Check className="h-3 w-3 text-gray-400" />
          {r}
        </span>
      ))}
    </div>
  )
}

function MemberCard({
  candidate,
  isSelected,
  isOther,
  onSelect,
  onRequest,
  requesting,
  timeStatus,
  primaryWarning,
  isRecommended,
}: {
  candidate: ReplacementCandidate
  isSelected: boolean
  isOther: boolean
  onSelect: () => void
  onRequest: () => void
  requesting?: boolean
  timeStatus: CandidateTimeStatus
  primaryWarning?: string
  isRecommended?: boolean
}) {
  const avail = AVAILABILITY[candidate.availability]
  const cardLabel = isRecommended ? '가장 먼저 요청할 팀원' : '선택한 팀원'

  if (isOther && !isSelected) {
    return (
      <button
        onClick={onSelect}
        className="w-full rounded-xl border border-gray-100 bg-white p-5 text-left transition-all hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
      >
        {isRecommended && (
          <div className="mb-3">
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-gray-100 px-2.5 text-caption font-medium text-gray-700">
              <UserCheck className="h-3.5 w-3.5" />
              가장 먼저 요청할 팀원
            </span>
          </div>
        )}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-title font-semibold text-gray-900">{candidate.name}</h3>
            <p className="text-body-sm text-gray-500">{candidate.department} · {candidate.role}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-body-sm text-gray-500">
            <StatusDot dotClass={avail.dotClass} />
            {avail.label}
          </span>
        </div>
        <div className="mt-3">
          <SelectionRationale candidate={candidate} timeStatus={timeStatus} />
        </div>
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-l-4 border-gray-200 border-l-status-replacement bg-white p-5">
      {primaryWarning && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-warning/20 bg-warning-bg px-3 py-2 text-body-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{primaryWarning}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 items-center gap-1 rounded-full bg-gray-100 px-2.5 text-caption font-medium text-gray-700">
          <UserCheck className="h-3.5 w-3.5" />
          {cardLabel}
        </span>
        {isSelected && isRecommended && (
          <span className="inline-flex h-6 items-center gap-1 rounded-full bg-gray-100 px-2.5 text-caption font-medium text-gray-700">
            <Check className="h-3.5 w-3.5" />
            선택됨
          </span>
        )}
      </div>

      <div className="mt-3">
        <SelectionRationale candidate={candidate} timeStatus={timeStatus} />
      </div>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h3 className="text-title font-semibold text-gray-900">{candidate.name}</h3>
          <p className="text-body-sm text-gray-500">{candidate.department} · {candidate.role}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-body-sm text-gray-500">
          <StatusDot dotClass={avail.dotClass} />
          {avail.label}
        </span>
      </div>

      <div className="mt-4">
        <Button
          onClick={onRequest}
          loading={requesting}
          disabled={requesting}
          className="w-full justify-between"
        >
          <span>{candidate.name}에게 요청</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

function ConfirmationStep({
  candidate,
  meeting,
  onConfirm,
  onBack,
  confirming,
}: {
  candidate: ReplacementCandidate
  meeting: Meeting
  onConfirm: () => void
  onBack: () => void
  confirming?: boolean
}) {
  const approved = meeting.participants.filter(
    (p) => p.responseStatus === 'approved',
  ).length

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mx-auto">
        <Send className="h-7 w-7 text-gray-500" />
      </div>

      <h3 className="mt-5 text-heading-s font-semibold text-gray-900">
        {candidate.name}님에게 대체 참석을 요청할까요?
      </h3>

      <p className="mt-2 text-body-sm text-gray-500">
        요청이 수락되면{' '}
        <span className="font-semibold text-gray-900">
          {approved + 1}/{meeting.participants.length}명
        </span>
        으로 회의를 확정할 수 있어요.
      </p>

      <div className="mt-6 flex gap-3">
        <Button onClick={onBack} variant="secondary" className="flex-1">
          다시 선택
        </Button>
        <div className="flex-1">
          <Button
            onClick={onConfirm}
            loading={confirming}
            disabled={confirming}
            className="w-full"
          >
            요청 보내기
          </Button>
        </div>
      </div>
    </div>
  )
}

function SuccessStep({
  candidate,
  meeting,
}: {
  candidate: ReplacementCandidate
  meeting: Meeting
}) {
  return (
    <div className="rounded-xl border border-l-4 border-gray-200 border-l-success bg-white p-6 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mx-auto">
        <CheckCircle className="h-7 w-7 text-success" />
      </div>

      <h3 className="mt-5 text-heading-s font-semibold text-gray-900">
        {candidate.name}님에게 대체 참석 요청을 보냈어요
      </h3>

      <p className="mt-2 text-body-sm text-gray-500">
        수락 여부를 기다린 후 회의를 확정할 수 있어요.
      </p>

      <div className="mt-6">
        <Button href={`/meetings/${meeting.id}`} className="w-full">
          회의 현황으로 돌아가기
        </Button>
      </div>
    </div>
  )
}

export default function ReplacementPage() {
  const [step, setStep] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const id = params.id as string

  const meeting = meetings.find((m) => m.id === id)
  const candidates = meeting?.replacementCandidates ?? []
  const rankedCandidates = sortCandidatesByMeetingTime(candidates, meeting?.confirmedTimeSlot ?? null)
  const selected = candidates.find((c) => c.id === selectedId) ?? null
  const originalPrimary = candidates[0]
  const primary = rankedCandidates[0]?.candidate

  if (!meeting || candidates.length === 0 || !primary) {
    return (
      <div className="flex flex-col items-center bg-gray-50 min-h-full">
        <main className="flex w-full max-w-xl flex-col px-6 py-10">
          <EmptyState
            icon="user-plus"
            title="대체 참석할 팀원이 없습니다"
            description="팀원 정보를 찾을 수 없습니다. 이전 화면으로 돌아가주세요."
            action={{ label: '이전으로 돌아가기', href: `/meetings/${id}` }}
          />
        </main>
      </div>
    )
  }

  const currentPrimary = selected ?? primary
  const isRecommendedSelected = currentPrimary.id === primary.id
  const mainSectionTitle = isRecommendedSelected ? '가장 먼저 요청할 팀원' : '선택한 팀원'
  const others = rankedCandidates
    .map(({ candidate }) => candidate)
    .filter((candidate) => candidate.id !== currentPrimary.id)
  const currentPrimaryTimeStatus = getCandidateTimeStatus(currentPrimary, meeting.confirmedTimeSlot)
  const originalPrimaryTimeStatus = originalPrimary
    ? getCandidateTimeStatus(originalPrimary, meeting.confirmedTimeSlot)
    : null
  const wasPrimaryAutoChanged = Boolean(
    originalPrimary
    && primary
    && originalPrimary.id !== primary.id
    && originalPrimaryTimeStatus
    && !originalPrimaryTimeStatus.isAvailable,
  )
  const primaryWarning = wasPrimaryAutoChanged && originalPrimaryTimeStatus?.conflict && !selected
    ? `${originalPrimary.name}님은 ${formatTimeSlot(originalPrimaryTimeStatus.conflict)} 일정이 있어 이 시간엔 어려울 수 있어요. 가능한 다음 후보를 먼저 추천했어요.`
    : undefined

  function handleRequest() {
    setRequesting(true)
    setError(null)
    setTimeout(() => {
      setRequesting(false)
      setStep(1)
    }, 800)
  }

  function handleConfirm() {
    setConfirming(true)
    setError(null)
    setTimeout(() => {
      setConfirming(false)
      setStep(2)
    }, 1000)
  }

  function handleBack() {
    setSelectedId(null)
    setStep(0)
    setError(null)
  }

  function handleSelect(id: string) {
    setSelectedId(id)
    setError(null)
  }

  const otherCandidatesPanel = (
    <div className="hidden lg:flex lg:flex-col lg:gap-3">
      <h2 className="text-title font-semibold text-gray-900">다른 팀원</h2>
      {others.length === 0 && (
        <p className="text-body-sm text-gray-500">다른 팀원이 없습니다.</p>
      )}
      {others.map((c) => (
        <MemberCard
          key={c.id}
          candidate={c}
          isSelected={c.id === selectedId}
          isOther={true}
          onSelect={() => handleSelect(c.id)}
          onRequest={handleRequest}
          timeStatus={getCandidateTimeStatus(c, meeting.confirmedTimeSlot)}
          isRecommended={c.id === primary.id}
        />
      ))}
    </div>
  )

  const headerContent = (
    <>
      <Link
        href={`/meetings/${meeting.id}`}
        className="inline-flex items-center gap-1 text-body-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {meeting.title}
      </Link>

      <h1 className="mt-2 text-heading-s font-semibold text-gray-900">대체 참석 요청</h1>

      <div className="mt-2">
        <StatusBadge status={meeting.status} />
      </div>

      <div className="mt-6">
        <StepIndicator current={step} />
      </div>
    </>
  )

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      {step === 0 ? (
        <>
          <div className="w-full border-b border-gray-200 bg-white px-6 py-5">
            {headerContent}
          </div>

          {error && (
            <div className="mt-4 w-full px-6">
              <ErrorState
                title="요청을 보내지 못했습니다"
                description={error}
                onRetry={handleRequest}
              />
            </div>
          )}

          <PageLayout hideSidebar right={otherCandidatesPanel}>
            {/* Mobile */}
            <div className="lg:hidden">
              <div className="mt-6">
                <ProblemSection meeting={meeting} />
              </div>
              <div className="mt-4">
                <SummaryCard meeting={meeting} />
              </div>

              <section className="mt-8">
                <h2 className="text-title font-semibold text-gray-900">{mainSectionTitle}</h2>
                <div className="mt-3">
                  <MemberCard
                    candidate={currentPrimary}
                    isSelected={selected !== null}
                    isRecommended={isRecommendedSelected}
                    isOther={false}
                    onSelect={() => handleSelect(currentPrimary.id)}
                    onRequest={handleRequest}
                    requesting={requesting}
                    timeStatus={currentPrimaryTimeStatus}
                    primaryWarning={primaryWarning}
                  />
                </div>
              </section>

              {others.length > 0 && (
                <section className="mt-6">
                  <h2 className="text-title font-semibold text-gray-900">다른 팀원</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {others.map((c) => (
                      <MemberCard
                        key={c.id}
                        candidate={c}
                        isSelected={c.id === selectedId}
                        isOther={true}
                        onSelect={() => handleSelect(c.id)}
                        onRequest={handleRequest}
                        requesting={requesting}
                        timeStatus={getCandidateTimeStatus(c, meeting.confirmedTimeSlot)}
                        isRecommended={c.id === primary.id}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Desktop */}
            <div className="hidden lg:block">
              <div className="mt-6">
                <ProblemSection meeting={meeting} />
              </div>
              <div className="mt-4">
                <SummaryCard meeting={meeting} />
              </div>

              <section className="mt-8">
                <h2 className="text-title font-semibold text-gray-900">{mainSectionTitle}</h2>
                <div className="mt-3">
                  <MemberCard
                    candidate={currentPrimary}
                    isSelected={selected !== null}
                    isRecommended={isRecommendedSelected}
                    isOther={false}
                    onSelect={() => handleSelect(currentPrimary.id)}
                    onRequest={handleRequest}
                    requesting={requesting}
                    timeStatus={currentPrimaryTimeStatus}
                    primaryWarning={primaryWarning}
                  />
                </div>
              </section>
            </div>
          </PageLayout>
        </>
      ) : (
        <>
          <div className="w-full border-b border-gray-200 bg-white px-6 py-5">
            {headerContent}
          </div>

          <PageLayout hideSidebar hideRight>
            {step === 1 && currentPrimary && (
              <div className="mt-8">
                <ConfirmationStep
                  candidate={currentPrimary}
                  meeting={meeting}
                  onConfirm={handleConfirm}
                  onBack={handleBack}
                  confirming={confirming}
                />
              </div>
            )}

            {step === 2 && currentPrimary && (
              <div className="mt-8">
                <SuccessStep candidate={currentPrimary} meeting={meeting} />
              </div>
            )}
          </PageLayout>
        </>
      )}
    </div>
  )
}
