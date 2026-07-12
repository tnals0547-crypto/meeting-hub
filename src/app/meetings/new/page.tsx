'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, Users, ArrowRight, CheckCircle, XCircle, HelpCircle, Plus, ChevronRight } from 'lucide-react'
import { teamMembers } from '@/data/mock'
import { generateTimeSlots, sortSlots } from '@/data/availability'
import { addDays, getDaysBetween, getTodayString, getWeekLaterString, toDateString } from '@/lib/date'
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
  { value: 'custom', label: '기타' },
]

const DURATION_LABEL: Record<Exclude<MeetingDuration, 'custom'>, string> = {
  '30m': '30분',
  '60m': '1시간',
  '90m': '1시간 30분',
  '120m': '2시간',
}

function getDurationLabel(duration: MeetingDuration, customDurationMinutes: number) {
  return duration === 'custom' ? `${customDurationMinutes}분` : DURATION_LABEL[duration]
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
  status: 'all_available' | 'preference_conflict' | 'partial' | 'replacement_needed' | 'manual'
  preferenceConflict?: string
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
    className: 'border border-success/15 bg-success-bg text-success',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  partial: {
    label: '일부 확인 필요',
    className: 'border border-warning/15 bg-warning-bg text-warning',
    icon: <HelpCircle className="h-3.5 w-3.5" />,
  },
  preference_conflict: {
    label: '일정 조율 권장',
    className: 'border border-warning/15 bg-warning-bg text-warning',
    icon: <HelpCircle className="h-3.5 w-3.5" />,
  },
  replacement_needed: {
    label: '대체 참석 필요',
    className: 'border border-status-replacement/15 bg-status-replacement-bg text-status-replacement',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  manual: {
    label: '직접 요청 시간',
    className: 'border border-warning/15 bg-warning-bg text-warning',
    icon: <HelpCircle className="h-3.5 w-3.5" />,
  },
}

function isValidTimeRange(startTime: string, endTime: string) {
  return startTime < endTime
}

function timeToMinutes(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function minutesToTime(minutes: number) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function getCurrentMinute() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function getDefaultManualDate() {
  return getCurrentMinute() >= 17 * 60 ? toDateString(addDays(new Date(), 1)) : getTodayString()
}

function getDefaultManualStartTime() {
  const nextHalfHour = Math.ceil((getCurrentMinute() + 1) / 30) * 30
  const clamped = Math.min(Math.max(nextHalfHour, 9 * 60), 17 * 60)
  return minutesToTime(clamped)
}

function getDefaultManualEndTime() {
  return minutesToTime(Math.min(timeToMinutes(getDefaultManualStartTime()) + 60, 18 * 60))
}

export default function NewMeetingPage() {
  const router = useRouter()
  const [todayDate, setTodayDate] = useState(getTodayString)
  const [currentMinute, setCurrentMinute] = useState(getCurrentMinute)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [noticeMessage, setNoticeMessage] = useState('')
  const [meetingType, setMeetingType] = useState<MeetingType>('face_to_face')
  const [duration, setDuration] = useState<MeetingDuration>('60m')
  const [customDurationMinutes, setCustomDurationMinutes] = useState(45)
  const [requiredMembers, setRequiredMembers] = useState<TeamMember[]>([])
  const [optionalMembers, setOptionalMembers] = useState<TeamMember[]>([])
  const [startDate, setStartDate] = useState(todayDate)
  const [endDate, setEndDate] = useState(getWeekLaterString())
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState<number | null>(0)
  const [manualTimeEnabled, setManualTimeEnabled] = useState(false)
  const [manualDate, setManualDate] = useState(getDefaultManualDate)
  const [manualStartTime, setManualStartTime] = useState(getDefaultManualStartTime)
  const [manualEndTime, setManualEndTime] = useState(getDefaultManualEndTime)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTodayDate(getTodayString())
      setCurrentMinute(getCurrentMinute())
    }, 60 * 1000)

    return () => window.clearInterval(timer)
  }, [])

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

  function handleStartDateChange(value: string) {
    const nextStartDate = value < todayDate ? todayDate : value
    setStartDate(nextStartDate)
    if (endDate < nextStartDate) setEndDate(nextStartDate)
  }

  function handleEndDateChange(value: string) {
    const minEndDate = normalizedStartDate
    setEndDate(value < minEndDate ? minEndDate : value)
  }

  function handleSubmit() {
    const formData = {
      title,
      description,
      noticeMessage,
      meetingType,
      duration,
      customDurationMinutes,
      requiredMembers,
      optionalMembers,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      manualTimeSlot: manualTimeEnabled ? {
        date: normalizedManualDate,
        startTime: manualStartTime,
        endTime: manualEndTime,
      } : null,
    }
    sessionStorage.setItem('newMeetingForm', JSON.stringify(formData))
    router.push('/meetings/new/time-selection')
  }

  const totalMembers = requiredMembers.length + optionalMembers.length
  const normalizedStartDate = startDate < todayDate ? todayDate : startDate
  const normalizedEndDate = endDate < normalizedStartDate ? normalizedStartDate : endDate
  const normalizedManualDate = manualDate < normalizedStartDate
    ? normalizedStartDate
    : manualDate > normalizedEndDate ? normalizedEndDate : manualDate
  const isManualStartPast = normalizedManualDate === todayDate && timeToMinutes(manualStartTime) <= currentMinute
  const isManualTimeValid = !manualTimeEnabled || (isValidTimeRange(manualStartTime, manualEndTime) && !isManualStartPast)
  const daysDiff = getDaysBetween(normalizedStartDate, normalizedEndDate)
  const isValid = title.trim().length > 0 && totalMembers > 0 && normalizedStartDate <= normalizedEndDate && isManualTimeValid

  const requiredIds = requiredMembers.map((member) => member.id)
  const optionalIds = optionalMembers.map((member) => member.id)
  const candidateSlots: CandidateSlot[] = totalMembers === 0 || normalizedStartDate > normalizedEndDate
    ? []
    : sortSlots(generateTimeSlots(
      normalizedStartDate,
      normalizedEndDate,
      duration,
      requiredIds,
      optionalIds,
      { customDurationMinutes },
    )).slice(0, 3).map((slot) => {
      const availableCount = slot.availableMemberIds.length
      const unavailableCount = slot.totalMemberCount - availableCount
      const status = !slot.allRequiredAvailable
        ? 'replacement_needed'
        : slot.hasPreferenceConflict
          ? 'preference_conflict'
          : unavailableCount > 0
            ? 'partial'
            : 'all_available'

      return {
        date: slot.date,
        dayLabel: formatDateShort(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        availableCount,
        totalCount: slot.totalMemberCount,
        pendingCount: status === 'partial' ? unavailableCount : 0,
        unavailableCount: status === 'replacement_needed' ? unavailableCount : 0,
        status,
        preferenceConflict: slot.preferenceConflicts[0]?.reason,
      }
    })

  const effectiveSelectedIdx = !manualTimeEnabled && selectedCandidateIdx != null && selectedCandidateIdx < candidateSlots.length
    ? selectedCandidateIdx
    : candidateSlots.length > 0 ? 0 : null
  const manualSelectedSlot: CandidateSlot | null = manualTimeEnabled ? {
    date: normalizedManualDate,
    dayLabel: formatDateShort(normalizedManualDate),
    startTime: manualStartTime,
    endTime: manualEndTime,
    availableCount: 0,
    totalCount: totalMembers,
    pendingCount: totalMembers,
    unavailableCount: 0,
    status: 'manual',
  } : null
  const selectedSlot = manualSelectedSlot ?? (effectiveSelectedIdx != null ? candidateSlots[effectiveSelectedIdx] : null)
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
          <dd className="font-medium text-gray-900">{getDurationLabel(duration, customDurationMinutes)}</dd>
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
            <p className="text-body-sm font-semibold text-gray-500 uppercase tracking-wider">선택한 후보 시간</p>
            <div className="rounded-lg border border-l-4 border-gray-200 border-l-info bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-sm font-semibold text-gray-900">{selectedSlot.dayLabel}</p>
                  <p className="text-body-sm text-gray-600">{selectedSlot.startTime} ~ {selectedSlot.endTime} · {getDurationLabel(duration, customDurationMinutes)}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium ${statusConfig[selectedSlot.status].className}`}>
                  {statusConfig[selectedSlot.status].icon}
                  {statusConfig[selectedSlot.status].label}
                </span>
              </div>
              <div className="mt-2 flex gap-3 text-body-sm text-gray-500">
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
          {totalMembers === 0 ? '정보 입력 중' : manualTimeEnabled ? '직접 요청 시간 선택됨' : selectedSlot ? '후보 시간 선택됨' : '후보 시간 확인 필요'}
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
          <span className="text-body-sm text-gray-400">{candidateSlots.length}개</span>
        )}
      </div>

      <p className="mt-1.5 text-body-sm text-gray-500">
        {totalMembers > 0
          ? '참석자들의 일정을 분석한 예상 후보 시간이에요. 필요한 경우 직접 시간을 입력해 요청할 수도 있어요.'
          : '참석자를 추가하면 가능한 시간을 찾을 수 있어요.'}
      </p>

      <div className="mt-4 space-y-2">
        {totalMembers > 0 && (
          <div className={`rounded-[8px] border p-4 ${
            manualTimeEnabled ? 'border-gray-200 border-l-4 border-l-warning bg-white' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-body-sm font-semibold text-gray-900">직접 요청 시간</p>
                <p className="mt-1 text-body-sm text-gray-600">
                  추천 후보 외 시간이 필요하면 직접 지정해서 참석 확인 요청을 보낼 수 있어요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setManualTimeEnabled((enabled) => !enabled)
                  setSelectedCandidateIdx(null)
                }}
                className={`shrink-0 rounded-[8px] border px-3 py-2 text-body-sm font-medium transition-colors ${
                  manualTimeEnabled
                    ? 'border-warning/20 bg-warning-bg text-warning'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {manualTimeEnabled ? '직접 시간 선택됨' : '직접 시간 사용'}
              </button>
            </div>

            {manualTimeEnabled && (
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_120px]">
                <label className="block">
                  <span className="text-body-sm text-gray-600">요청일</span>
                  <input
                    type="date"
                    value={normalizedManualDate}
                    min={normalizedStartDate}
                    max={normalizedEndDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-gray-200 px-3 py-2.5 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
                  />
                </label>
                <label className="block">
                  <span className="text-body-sm text-gray-600">시작</span>
                  <input
                    type="time"
                    value={manualStartTime}
                    min={normalizedManualDate === todayDate ? minutesToTime(Math.min(currentMinute + 1, 23 * 60 + 59)) : undefined}
                    onChange={(e) => setManualStartTime(e.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-gray-200 px-3 py-2.5 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
                  />
                </label>
                <label className="block">
                  <span className="text-body-sm text-gray-600">종료</span>
                  <input
                    type="time"
                    value={manualEndTime}
                    onChange={(e) => setManualEndTime(e.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-gray-200 px-3 py-2.5 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
                  />
                </label>
                {!isManualTimeValid && (
                  <p className="text-body-sm text-warning sm:col-span-3">
                    {isManualStartPast ? '오늘 요청은 현재 시간 이후로 선택해주세요.' : '종료 시간은 시작 시간보다 늦어야 해요.'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

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
        ) : candidateSlots.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CalendarDays className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-body-sm text-gray-500">선택한 기간 안에서 현재 이후 가능한 시간이 없어요.</p>
            <p className="mt-1 text-body-sm text-gray-400">기간을 넓히거나 참석자를 조정해보세요.</p>
          </div>
        ) : (
          candidateSlots.map((slot, i) => {
            const isSelected = !manualTimeEnabled && effectiveSelectedIdx === i
            const cfg = statusConfig[slot.status]
            return (
              <button
                key={i}
                onClick={() => {
                  setManualTimeEnabled(false)
                  setSelectedCandidateIdx(i)
                }}
                className={`w-full rounded-[8px] border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-gray-200 border-l-4 border-l-info bg-white'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? 'border-info bg-info' : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                    </span>
                    <div>
                      <p className="text-body-sm font-semibold text-gray-900">{slot.dayLabel}</p>
                      <p className="text-body-sm text-gray-500">
                        {slot.startTime} ~ {slot.endTime} · {getDurationLabel(duration, customDurationMinutes)}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium ${cfg.className}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3 text-body-sm text-gray-500">
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
                  {slot.preferenceConflict && (
                    <span className="inline-flex min-w-0 items-center gap-1 text-warning">
                      <HelpCircle className="h-3 w-3 shrink-0" />
                      <span className="truncate">{slot.preferenceConflict}</span>
                    </span>
                  )}
                  {isSelected && (
                    <span className="ml-auto inline-flex items-center gap-1 text-body-sm font-medium text-gray-700">
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
          <div className="flex items-baseline justify-between gap-3">
            <label className="text-title font-semibold text-gray-900">회의 공지 내용</label>
            <span className="shrink-0 text-body-sm text-gray-500">선택 입력</span>
          </div>
          <textarea
            value={noticeMessage}
            onChange={(e) => setNoticeMessage(e.target.value)}
            rows={5}
            placeholder="참석자에게 전달할 안건, 준비사항, 참고 링크를 입력해주세요."
            className="mt-2 w-full resize-none rounded-[8px] border border-gray-200 px-4 py-3 text-body-sm leading-relaxed text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-black"
          />
          <p className="mt-2 text-body-sm text-gray-500">
            입력하지 않아도 회의 요청을 보낼 수 있어요.
          </p>
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
                    ? 'border-info border-l-4 border-l-info bg-white text-gray-900'
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
          <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDuration(opt.value)}
                className={`flex h-11 min-w-20 items-center justify-center whitespace-nowrap rounded-[8px] border px-4 py-3 text-title font-medium transition-colors ${
                  duration === opt.value
                    ? 'border-info border-l-4 border-l-info bg-white text-gray-900'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {duration === 'custom' && (
            <div className="mt-3 max-w-[180px]">
              <label className="text-body-sm font-semibold text-gray-500">직접 입력</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-[8px] border border-gray-200 px-3 py-2.5 focus-within:border-info">
                <input
                  type="number"
                  min={10}
                  max={240}
                  step={5}
                  value={customDurationMinutes}
                  onChange={(e) => setCustomDurationMinutes(Math.min(Math.max(Number(e.target.value) || 10, 10), 240))}
                  className="w-full bg-transparent text-body-sm text-gray-900 outline-none"
                />
                <span className="shrink-0 text-body-sm text-gray-500">분</span>
              </div>
            </div>
          )}
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
              <p className="text-body-sm text-gray-600">시작일</p>
              <input
                type="date"
                value={normalizedStartDate}
                min={todayDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="mt-1 w-full rounded-[8px] border border-gray-200 px-4 py-3 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
              />
            </div>
            <span className="mt-5 text-title text-gray-300">~</span>
            <div className="flex-1">
              <p className="text-body-sm text-gray-600">종료일</p>
              <input
                type="date"
                value={normalizedEndDate}
                min={normalizedStartDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="mt-1 w-full rounded-[8px] border border-gray-200 px-4 py-3 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
              />
            </div>
          </div>
          <p className="mt-2 text-body-sm text-gray-600">
            {getDateLabel(normalizedStartDate)} ~ {getDateLabel(normalizedEndDate)} · 총 {daysDiff}일
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
