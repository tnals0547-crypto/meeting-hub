'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { meetings } from '@/data/mock'
import type { Meeting, ReplacementCandidate, AvailabilityStatus } from '@/types/meeting'
import StatusBadge from '@/components/common/StatusBadge'
import Button from '@/components/common/Button'

const AVAILABILITY: Record<AvailabilityStatus, { icon: string; label: string }> = {
  available: { icon: '🟢', label: '지금 연락 가능' },
  in_meeting: { icon: '🟡', label: '회의 중' },
  focused: { icon: '🟠', label: '집중 업무' },
  on_leave: { icon: '🔴', label: '연차' },
}

const STEPS = ['팀원 선택', '요청 확인', '요청 완료']

function ProblemSection({ meeting }: { meeting: Meeting }) {
  const declinedRequired = meeting.participants.find(
    (p) => p.isRequired && p.responseStatus === 'declined',
  )

  return (
    <section className="rounded-xl border border-red-100 bg-red-50 p-5">
      <h2 className="text-sm font-semibold text-gray-900">
        회의를 아직 확정할 수 없는 이유
      </h2>
      {declinedRequired && (
        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          {declinedRequired.name}({declinedRequired.department} ·{' '}
          {declinedRequired.role})님이 필수 참석자지만 불참했어요.
        </p>
      )}
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
      <p className="text-xs font-medium text-gray-500">이번 요청이 완료되면</p>

      <div className="mt-3 flex items-end gap-6">
        <div>
          <p className="text-xs text-gray-400">현재</p>
          <p className="mt-1 text-2xl font-bold text-gray-400">
            {approved}
            <span className="text-base font-normal text-gray-300">/{total}</span>
          </p>
        </div>

        <div className="flex flex-col items-center pb-1">
          <span className="text-lg text-gray-300">→</span>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-900">완료 시</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {approved + 1}
            <span className="text-base font-normal text-gray-500">/{total}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex h-2 gap-1">
        <div className="h-full flex-1 rounded-full bg-green-400" />
        <div className="h-full flex-1 rounded-full bg-gray-200" />
        <div className="h-full flex-1 rounded-full bg-gray-200" />
        <div className="h-full flex-1 rounded-full bg-gray-200" />
      </div>

      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-gray-400">{Math.round((approved / total) * 100)}%</span>
        <span className="font-semibold text-gray-900">
          {Math.round(afterPercent)}% ✅ 회의 확정 가능
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
            className={`text-xs font-medium ${
              i <= current ? 'text-gray-900' : 'text-gray-300'
            }`}
          >
            {step}
          </span>
          {i < STEPS.length - 1 && (
            <span className="text-xs text-gray-200">→</span>
          )}
        </div>
      ))}
    </div>
  )
}

function PrimaryReason({ candidate }: { candidate: ReplacementCandidate }) {
  const avail = AVAILABILITY[candidate.availability]
  const hasProjectExp = candidate.rationale.some((r) => r.includes('프로젝트'))
  const sameRole = candidate.rationale.some((r) => r.includes('역할'))

  const lines = [
    `${avail.icon} ${avail.label}`,
  ]

  if (sameRole) {
    lines.push('같은 역할 경험이 있어 빠르게 적응할 수 있어요')
  }

  if (hasProjectExp) {
    lines.push('해당 프로젝트 경험이 있어요')
  }

  return (
    <p className="text-xs leading-relaxed text-gray-500">
      {lines.join(' · ')}
    </p>
  )
}

function MemberCard({
  candidate,
  isSelected,
  isOther,
  onSelect,
  onRequest,
}: {
  candidate: ReplacementCandidate
  isSelected: boolean
  isOther: boolean
  onSelect: () => void
  onRequest: () => void
}) {
  const avail = AVAILABILITY[candidate.availability]

  if (isOther && !isSelected) {
    return (
      <button
        onClick={onSelect}
        className="w-full rounded-2xl border border-gray-100 bg-white p-5 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {candidate.name}
            </h3>
            <p className="text-sm text-gray-500">
              {candidate.department} · {candidate.role}
            </p>
          </div>
          <span className="shrink-0 text-xs text-gray-500">
            {avail.icon} {avail.label}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {candidate.rationale.map((item) => (
            <span key={item} className="text-xs text-gray-500">
              ✓ {item}
            </span>
          ))}
        </div>
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-black bg-white p-5">
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
        가장 먼저 요청할 팀원
      </span>

      {isSelected && (
        <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600">
          선택됨
        </span>
      )}

      <div className="mt-2">
        <PrimaryReason candidate={candidate} />
      </div>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {candidate.name}
          </h3>
          <p className="text-sm text-gray-500">
            {candidate.department} · {candidate.role}
          </p>
        </div>
        <span className="shrink-0 text-xs text-gray-500">
          {avail.icon} {avail.label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {candidate.rationale.map((item) => (
          <span key={item} className="text-xs text-gray-500">
            ✓ {item}
          </span>
        ))}
      </div>

      <div className="mt-4">
        <Button onClick={onRequest} className="w-full justify-between">
          <span>{candidate.name}에게 요청</span>
          <span className="text-lg leading-none">→</span>
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
}: {
  candidate: ReplacementCandidate
  meeting: Meeting
  onConfirm: () => void
  onBack: () => void
}) {
  const approved = meeting.participants.filter(
    (p) => p.responseStatus === 'approved',
  ).length

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-xl mx-auto">
        ✉️
      </div>

      <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">
        {candidate.name}님에게 대체 참석을 요청할까요?
      </h3>

      <p className="mt-2 text-center text-sm text-gray-500">
        요청이 수락되면{' '}
        <span className="font-semibold text-gray-900">
          {approved + 1}/{meeting.participants.length}명
        </span>
        으로 회의를 확정할 수 있어요.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          다시 선택
        </button>
        <div className="flex-1">
          <Button onClick={onConfirm} className="w-full">
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
    <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-xl mx-auto">
        ✅
      </div>

      <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">
        {candidate.name}님에게 대체 참석 요청을 보냈어요
      </h3>

      <p className="mt-2 text-center text-sm text-gray-500">
        수락 여부를 기다린 후 회의를 확정할 수 있어요.
      </p>

      <div className="mt-6">
        <Link
          href={`/meetings/${meeting.id}`}
          className="flex w-full items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black/80"
        >
          회의 현황으로 돌아가기
        </Link>
      </div>
    </div>
  )
}

export default function ReplacementPage() {
  const [step, setStep] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const params = useParams()
  const id = params.id as string

  const meeting = meetings.find((m) => m.id === id)
  const candidates = meeting?.replacementCandidates ?? []
  const selected = candidates.find((c) => c.id === selectedId) ?? null
  const primary = candidates[0]
  const others = candidates.slice(1)

  if (!meeting || candidates.length === 0) {
    return (
      <div className="flex flex-col items-center bg-zinc-50 min-h-full">
        <main className="flex w-full max-w-xl flex-col px-6 py-10">
          <p className="text-sm text-gray-500">팀원 정보를 찾을 수 없습니다.</p>
          <Link
            href="/"
            className="mt-4 text-sm font-medium text-gray-900 underline"
          >
            홈으로 돌아가기
          </Link>
        </main>
      </div>
    )
  }

  const currentPrimary = selected ?? primary

  function handleRequest() {
    setStep(1)
  }

  function handleConfirm() {
    setStep(2)
  }

  function handleBack() {
    setSelectedId(null)
    setStep(0)
  }

  function handleSelect(id: string) {
    setSelectedId(id)
  }

  return (
    <div className="flex flex-col items-center bg-zinc-50 min-h-full">
      <main className="flex w-full max-w-xl flex-col px-6 py-6">
        <Link
          href={`/meetings/${meeting.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          ← {meeting.title}
        </Link>

        <h1 className="text-xl font-bold text-gray-900">대체 참석 요청</h1>

        <div className="mt-2">
          <StatusBadge status={meeting.status} />
        </div>

        <div className="mt-6">
          <StepIndicator current={step} />
        </div>

        <div className="mt-6">
          <ProblemSection meeting={meeting} />
        </div>

        <div className="mt-4">
          <SummaryCard meeting={meeting} />
        </div>

        {step === 0 && (
          <>
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-gray-900">
                가장 먼저 요청할 팀원
              </h2>
              <div className="mt-3">
                <MemberCard
                  candidate={currentPrimary}
                  isSelected={selected !== null}
                  isOther={false}
                  onSelect={() => handleSelect(currentPrimary.id)}
                  onRequest={handleRequest}
                />
              </div>
            </section>

            {others.length > 0 && (
              <section className="mt-6">
                <h2 className="text-sm font-semibold text-gray-900">
                  다른 팀원
                </h2>
                <div className="mt-3 flex flex-col gap-3">
                  {others.map((c) => (
                    <MemberCard
                      key={c.id}
                      candidate={c}
                      isSelected={c.id === selectedId}
                      isOther={true}
                      onSelect={() => handleSelect(c.id)}
                      onRequest={handleRequest}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {step === 1 && currentPrimary && (
          <div className="mt-8">
            <ConfirmationStep
              candidate={currentPrimary}
              meeting={meeting}
              onConfirm={handleConfirm}
              onBack={handleBack}
            />
          </div>
        )}

        {step === 2 && currentPrimary && (
          <div className="mt-8">
            <SuccessStep candidate={currentPrimary} meeting={meeting} />
          </div>
        )}
      </main>
    </div>
  )
}
