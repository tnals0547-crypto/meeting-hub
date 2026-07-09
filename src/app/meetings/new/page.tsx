'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock, Users, ArrowRight, CheckCircle, XCircle, HelpCircle, Plus, ChevronRight } from 'lucide-react'
import { teamMembers } from '@/data/mock'
import type { TeamMember, MeetingDuration } from '@/types/meeting'
import Button from '@/components/common/Button'
import MemberSelector from '@/components/MemberSelector'
import PageLayout from '@/components/layout/PageLayout'

type MeetingType = 'face_to_face' | 'online' | 'undecided'

const MEETING_TYPE_OPTIONS: { value: MeetingType; label: string }[] = [
  { value: 'face_to_face', label: '대면' },
  { value: 'online', label: '온라인' },
  { value: 'undecided', label: '미정' },
]

const DURATION_OPTIONS: { value: MeetingDuration; label: string }[] = [
  { value: '30m', label: '30분' },
  { value: '60m', label: '1시간' },
  { value: '90m', label: '1시간 30분' },
  { value: '120m', label: '2시간' },
]

const DURATION_LABEL: Record<MeetingDuration, string> = {
  '30m': '30분',
  '60m': '1시간',
  '90m': '1시간 30분',
  '120m': '2시간',
}

interface CandidateSlot {
  date: string
  dayLabel: string
  startTime: string
  endTime: string
  availableCount: number
  totalCount: number
  pendingCount: number
  unavailableCount: number
  status: 'all_available' | 'partial' | 'replacement_needed'
}

function getTodayString() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function getWeekLaterString() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

function getDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${days[d.getDay()]})`
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  all_available: {
    label: '전원 가능',
    className: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  partial: {
    label: '일부 확인 필요',
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    icon: <HelpCircle className="h-3.5 w-3.5" />,
  },
  replacement_needed: {
    label: '대체 참석 필요',
    className: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
}

const MOCK_CANDIDATES: CandidateSlot[] = [
  {
    date: '2026-07-10',
    dayLabel: formatDateShort('2026-07-10'),
    startTime: '10:00',
    endTime: '11:00',
    availableCount: 4,
    totalCount: 4,
    pendingCount: 0,
    unavailableCount: 0,
    status: 'all_available',
  },
  {
    date: '2026-07-11',
    dayLabel: formatDateShort('2026-07-11'),
    startTime: '14:00',
    endTime: '15:00',
    availableCount: 3,
    totalCount: 4,
    pendingCount: 1,
    unavailableCount: 0,
    status: 'partial',
  },
  {
    date: '2026-07-13',
    dayLabel: formatDateShort('2026-07-13'),
    startTime: '09:00',
    endTime: '10:00',
    availableCount: 2,
    totalCount: 4,
    pendingCount: 1,
    unavailableCount: 1,
    status: 'replacement_needed',
  },
]

export default function NewMeetingPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [meetingType, setMeetingType] = useState<MeetingType>('face_to_face')
  const [duration, setDuration] = useState<MeetingDuration>('60m')
  const [requiredMembers, setRequiredMembers] = useState<TeamMember[]>([])
  const [optionalMembers, setOptionalMembers] = useState<TeamMember[]>([])
  const [startDate, setStartDate] = useState(getTodayString())
  const [endDate, setEndDate] = useState(getWeekLaterString())
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState<number | null>(1)

  function handleAddRequired(member: TeamMember) {
    if (requiredMembers.length + optionalMembers.length < 6) {
      setRequiredMembers([...requiredMembers, member])
    }
  }

  function handleAddOptional(member: TeamMember) {
    if (requiredMembers.length + optionalMembers.length < 6) {
      setOptionalMembers([...optionalMembers, member])
    }
  }

  function handleRemove(member: TeamMember) {
    setRequiredMembers(requiredMembers.filter((m) => m.id !== member.id))
    setOptionalMembers(optionalMembers.filter((m) => m.id !== member.id))
  }

  function handleSubmit() {
    const formData = {
      title,
      description,
      meetingType,
      duration,
      requiredMembers,
      optionalMembers,
      startDate,
      endDate,
    }
    sessionStorage.setItem('newMeetingForm', JSON.stringify(formData))
    router.push('/meetings/new/time-selection')
  }

  const totalMembers = requiredMembers.length + optionalMembers.length
  const daysDiff =
    Math.ceil(
      (new Date(endDate + 'T00:00:00').getTime() -
        new Date(startDate + 'T00:00:00').getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1
  const isValid = title.trim().length > 0 && totalMembers > 0 && startDate <= endDate

  const selectedSlot = selectedCandidateIdx != null ? MOCK_CANDIDATES[selectedCandidateIdx] : null
  const hasCandidate = totalMembers > 0 && selectedSlot != null

  const ctaFlow = (() => {
    if (totalMembers === 0) return { text: '팀원 추가하기', disabled: false, onClick: () => document.getElementById('member-selector')?.scrollIntoView({ behavior: 'smooth' }), icon: <Plus className="h-4 w-4" /> }
    if (hasCandidate) return { text: '참석 요청 보내기', disabled: !isValid, onClick: handleSubmit, icon: <ArrowRight className="h-4 w-4" /> }
    return { text: '가능한 시간 보기', disabled: !isValid, onClick: handleSubmit, icon: <ArrowRight className="h-4 w-4" /> }
  })()

  const summaryPanel = (
    <div className="rounded-[8px] border border-gray-200 bg-white p-5">
      <h3 className="text-title font-semibold text-gray-900">회의 요약</h3>

      <dl className="mt-4 space-y-3">
        <div className="flex justify-between text-title">
          <dt className="text-gray-600">방식</dt>
          <dd className="font-medium text-gray-900">{MEETING_TYPE_OPTIONS.find((o) => o.value === meetingType)?.label ?? ''}</dd>
        </div>
        <div className="flex justify-between text-title">
          <dt className="text-gray-600">길이</dt>
          <dd className="font-medium text-gray-900">{DURATION_LABEL[duration]}</dd>
        </div>
        <div className="flex justify-between text-title">
          <dt className="text-gray-600">참석자</dt>
          <dd className="font-medium text-gray-900">
            {totalMembers > 0 ? (
              <span>{requiredMembers.length > 0 ? `필수 ${requiredMembers.length}명` : ''}{optionalMembers.length > 0 ? ` · 선택 ${optionalMembers.length}명` : ''}</span>
            ) : (
              <span className="text-gray-400">0명</span>
            )}
          </dd>
        </div>
        <div className="flex justify-between text-title">
          <dt className="text-gray-600">검토 기간</dt>
          <dd className="font-medium text-gray-900">{daysDiff}일</dd>
        </div>
      </dl>

      {selectedSlot && (
        <>
          <hr className="my-4 border-gray-100" />
          <div className="space-y-3">
            <p className="text-caption font-semibold text-gray-500 uppercase tracking-wider">선택한 후보 시간</p>
            <div className="rounded-lg border border-l-4 border-gray-200 border-l-brand-500 bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedSlot.dayLabel}</p>
                  <p className="text-sm text-gray-600">{selectedSlot.startTime} ~ {selectedSlot.endTime} · {DURATION_LABEL[duration]}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium ${statusConfig[selectedSlot.status].className}`}>
                  {statusConfig[selectedSlot.status].icon}
                  {statusConfig[selectedSlot.status].label}
                </span>
              </div>
              <div className="mt-2 flex gap-3 text-2xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3 text-gray-400" />
                  가능 {selectedSlot.availableCount}/{selectedSlot.totalCount}
                </span>
                {selectedSlot.pendingCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <HelpCircle className="h-3 w-3 text-gray-400" />
                    확인 {selectedSlot.pendingCount}명
                  </span>
                )}
                {selectedSlot.unavailableCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-gray-400" />
                    불가 {selectedSlot.unavailableCount}명
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <hr className="my-4 border-gray-100" />
      <div className="flex items-center justify-between text-body-sm">
        <span className="text-gray-600">진행 상태</span>
        <span className="font-medium text-gray-900">
          {totalMembers === 0 ? '정보 입력 중' : selectedSlot ? '후보 시간 선택됨' : '후보 시간 확인 필요'}
        </span>
      </div>

      <div className="mt-4 hidden lg:block">
        <Button onClick={ctaFlow.onClick} disabled={ctaFlow.disabled} className="w-full gap-2">
          {ctaFlow.icon}
          <span>{ctaFlow.text}</span>
        </Button>
      </div>
    </div>
  )

  const candidatesSection = (
    <div className="rounded-[8px] border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-title font-semibold text-gray-900">가능한 시간 후보</h3>
        {totalMembers > 0 && (
          <span className="text-caption text-gray-400">{MOCK_CANDIDATES.length}개</span>
        )}
      </div>

      <p className="mt-1.5 text-body-sm text-gray-500">
        {totalMembers > 0
          ? '참석자들의 일정을 분석한 예상 후보 시간이에요. 원하는 시간을 선택하고 요청을 보내보세요.'
          : '참석자를 추가하면 가능한 시간을 찾을 수 있어요.'}
      </p>

      <div className="mt-4 space-y-2">
        {totalMembers === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CalendarDays className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-body-sm text-gray-500">참석자를 추가하면 가능한 시간을 찾을 수 있어요.</p>
            <button
              onClick={() => document.getElementById('member-selector')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-3 inline-flex items-center gap-1 rounded-[8px] border border-gray-200 px-4 py-2 text-body-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              팀원 추가하기
            </button>
          </div>
        ) : (
          MOCK_CANDIDATES.map((slot, i) => {
            const isSelected = selectedCandidateIdx === i
            const cfg = statusConfig[slot.status]
            return (
              <button
                key={i}
                onClick={() => setSelectedCandidateIdx(i)}
                className={`w-full rounded-[8px] border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}>{slot.dayLabel}</p>
                      <p className="text-sm text-gray-500">
                        {slot.startTime} ~ {slot.endTime} · {DURATION_LABEL[duration]}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium ${cfg.className}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3 text-2xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3 text-gray-400" />
                    가능 {slot.availableCount}/{slot.totalCount}
                  </span>
                  {slot.pendingCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                      확인 {slot.pendingCount}명
                    </span>
                  )}
                  {slot.unavailableCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-gray-400" />
                      불가 {slot.unavailableCount}명
                    </span>
                  )}
                  {isSelected && (
                    <span className="ml-auto inline-flex items-center gap-1 text-2xs font-medium text-gray-700">
                      선택됨
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <div className="w-full border-b border-gray-200 bg-white px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-body-sm text-gray-600 hover:text-gray-900"
        >
          ← 홈
        </Link>

        <h1 className="mt-2 text-heading-s font-semibold text-gray-900">새 회의 만들기</h1>
        <p className="mt-1.5 text-body-sm text-gray-500 max-w-xl">
          참석자들의 일정을 확인해 모두가 가능한 시간을 찾고, 요청까지 한 번에 보낼 수 있어요.
        </p>
      </div>

      <PageLayout hideSidebar right={summaryPanel}>
        <section className="rounded-[8px] border border-gray-100 bg-white p-5">
          <label className="text-title font-semibold text-gray-900">회의 제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="회의 제목을 입력해주세요"
            className="mt-2 w-full rounded-[8px] border border-gray-200 px-4 py-3 text-body-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-black"
          />
        </section>

        <section className="mt-3 rounded-[8px] border border-gray-100 bg-white p-5">
          <label className="text-title font-semibold text-gray-900">회의 설명</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명을 입력해주세요"
            className="mt-2 w-full rounded-[8px] border border-gray-200 px-4 py-3 text-body-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-black"
          />
        </section>

        <section className="mt-3 rounded-[8px] border border-gray-100 bg-white p-5">
          <label className="text-title font-semibold text-gray-900">회의 방식</label>
          <div className="mt-3 flex gap-3">
            {MEETING_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMeetingType(opt.value)}
                className={`flex-1 rounded-[8px] border px-4 py-3 text-title font-medium transition-colors ${
                  meetingType === opt.value
                    ? 'border-black bg-gray-50 text-gray-900'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-3 rounded-[8px] border border-gray-100 bg-white p-5">
          <label className="text-title font-semibold text-gray-900">회의 시간</label>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDuration(opt.value)}
                className={`rounded-[8px] border px-3 py-3 text-title font-medium transition-colors ${
                  duration === opt.value
                    ? 'border-black bg-gray-50 text-gray-900'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section id="member-selector" className="mt-3 rounded-[8px] border border-gray-100 bg-white p-5">
          <MemberSelector
            allMembers={teamMembers}
            requiredMembers={requiredMembers}
            optionalMembers={optionalMembers}
            onAddRequired={handleAddRequired}
            onAddOptional={handleAddOptional}
            onRemove={handleRemove}
          />
        </section>

        <section className="mt-3 rounded-[8px] border border-gray-100 bg-white p-5">
          <label className="text-title font-semibold text-gray-900">회의 가능 기간</label>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-caption text-gray-600">시작일</p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-[8px] border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-black"
              />
            </div>
            <span className="mt-5 text-title text-gray-300">~</span>
            <div className="flex-1">
              <p className="text-caption text-gray-600">종료일</p>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-[8px] border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-black"
              />
            </div>
          </div>
          <p className="mt-2 text-body-sm text-gray-600">
            {getDateLabel(startDate)} ~ {getDateLabel(endDate)} · 총 {daysDiff}일
          </p>
        </section>

        {/* Mobile: candidates + CTA */}
        <div className="mt-6 lg:hidden">
          {candidatesSection}
          <div className="mt-4">
            <Button onClick={ctaFlow.onClick} disabled={ctaFlow.disabled} className="w-full gap-2">
              {ctaFlow.icon}
              <span>{ctaFlow.text}</span>
            </Button>
          </div>
        </div>
      </PageLayout>

      {/* Desktop: candidate panel below main area */}
      <div className="hidden w-full px-5 pb-5 lg:block">
        {candidatesSection}
      </div>
    </div>
  )
}
