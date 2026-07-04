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

const STEPS = ['후보 선택', '요청 확인', '요청 완료']

function ProblemSection({ meeting }: { meeting: Meeting }) {
  const declinedRequired = meeting.participants.find(
    (p) => p.isRequired && p.responseStatus === 'declined',
  )
  const approved = meeting.participants.filter(
    (p) => p.responseStatus === 'approved',
  ).length

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
      <p className="mt-1 text-sm leading-relaxed text-gray-600">
        대체 참석자 1명만 지정하면 참석률{' '}
        <span className="font-semibold text-gray-900">
          {approved + 1}/{meeting.participants.length}명 (
          {Math.round(((approved + 1) / meeting.participants.length) * 100)}%)
        </span>
        로 회의를 확정할 수 있어요.
      </p>
    </section>
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

function CandidateCard({
  candidate,
  isPrimary,
  onRequest,
}: {
  candidate: ReplacementCandidate
  isPrimary: boolean
  onRequest: () => void
}) {
  const avail = AVAILABILITY[candidate.availability]

  return (
    <div
      className={`rounded-2xl border bg-white p-5 ${
        isPrimary ? 'border-black' : 'border-gray-100'
      }`}
    >
      {isPrimary && (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
          가장 먼저 요청할 후보
        </span>
      )}

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

      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        {candidate.rationale}
      </p>

      <div className="mt-4">
        <Button onClick={onRequest} className="w-full justify-between">
          <span>이 후보로 요청</span>
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
        요청이 수락되면 참석률{' '}
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
          <p className="text-sm text-gray-500">후보 정보를 찾을 수 없습니다.</p>
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

  function handleRequest(candidateId: string) {
    setSelectedId(candidateId)
    setStep(1)
  }

  function handleConfirm() {
    setStep(2)
  }

  function handleBack() {
    setSelectedId(null)
    setStep(0)
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

        {step === 0 && (
          <>
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-gray-900">
                가장 먼저 요청할 후보
              </h2>
              <div className="mt-3">
                <CandidateCard
                  candidate={primary}
                  isPrimary
                  onRequest={() => handleRequest(primary.id)}
                />
              </div>
            </section>

            {others.length > 0 && (
              <section className="mt-8">
                <h2 className="text-sm font-semibold text-gray-900">
                  다른 후보
                </h2>
                <div className="mt-3 flex flex-col gap-3">
                  {others.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      isPrimary={false}
                      onRequest={() => handleRequest(c.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {step === 1 && selected && (
          <div className="mt-8">
            <ConfirmationStep
              candidate={selected}
              meeting={meeting}
              onConfirm={handleConfirm}
              onBack={handleBack}
            />
          </div>
        )}

        {step === 2 && selected && (
          <div className="mt-8">
            <SuccessStep candidate={selected} meeting={meeting} />
          </div>
        )}
      </main>
    </div>
  )
}
