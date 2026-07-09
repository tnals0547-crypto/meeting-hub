'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock, Users, ArrowRight, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import { teamMembers } from '@/data/mock'
import { generateTimeSlots, sortSlots } from '@/data/availability'
import type { TeamMember, MeetingDuration, TimeSlotWithAvailability } from '@/types/meeting'
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

function formatTimeSlotDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  all_available: {
    label: '전원 가능',
    className: 'bg-green-50 text-green-700',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  partial: {
    label: '일부 조율 필요',
    className: 'bg-amber-50 text-amber-700',
    icon: <HelpCircle className="h-3.5 w-3.5" />,
  },
  pending: {
    label: '확인 필요',
    className: 'bg-gray-100 text-gray-600',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
}

function CandidateCard({ slot }: { slot: TimeSlotWithAvailability }) {
  const { availableMemberIds, totalMemberCount, requiredAvailableCount, requiredTotalCount, allRequiredAvailable } = slot
  const unavailableCount = totalMemberCount - availableMemberIds.length
  const pendingCount = totalMemberCount - availableMemberIds.length

  let status: 'all_available' | 'partial' | 'pending'
  if (allRequiredAvailable && availableMemberIds.length === totalMemberCount) {
    status = 'all_available'
  } else if (availableMemberIds.length >= requiredAvailableCount) {
    status = 'partial'
  } else {
    status = 'pending'
  }

  const cfg = statusConfig[status]

  return (
    <div className="rounded-[8px] border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{formatTimeSlotDate(slot.date)}</p>
          <p className="text-sm text-gray-600">{slot.startTime} ~ {slot.endTime}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium ${cfg.className}`}>
          {cfg.icon}
          {cfg.label}
        </span>
      </div>
      <div className="mt-2 flex gap-3 text-2xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3 text-gray-400" />
          가능 {availableMemberIds.length}/{totalMemberCount}
        </span>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <HelpCircle className="h-3 w-3 text-amber-400" />
            확인 {pendingCount}명
          </span>
        )}
        {unavailableCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-400" />
            불가 {unavailableCount}명
          </span>
        )}
      </div>
    </div>
  )
}

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
  const isValid =
    title.trim().length > 0 && totalMembers > 0 && startDate <= endDate

  const previewSlots = useMemo(() => {
    if (totalMembers === 0) return []
    try {
      const requiredIds = requiredMembers.map((m) => m.id)
      const optionalIds = optionalMembers.map((m) => m.id)
      const slots = generateTimeSlots(startDate, endDate, duration, requiredIds, optionalIds)
      const viable = slots.filter(
        (s) => s.allRequiredAvailable || s.availableMemberIds.length >= requiredIds.length,
      )
      return sortSlots(viable).slice(0, 5)
    } catch {
      return []
    }
  }, [startDate, endDate, duration, requiredMembers, optionalMembers, totalMembers])

  const candidatePanel = (
    <div className="rounded-[8px] border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-title font-semibold text-gray-900">가능한 시간 후보</h3>
        {totalMembers > 0 && (
          <span className="text-caption text-gray-400">{previewSlots.length}개</span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {totalMembers === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CalendarDays className="h-8 w-8 text-gray-300" />
            <p className="mt-2 text-body-sm text-gray-500">
              참석자를 추가하면 가능한 시간을 찾을 수 있어요
            </p>
          </div>
        ) : previewSlots.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <XCircle className="h-8 w-8 text-gray-300" />
            <p className="mt-2 text-body-sm text-gray-500">
              현재 조건에서 가능한 시간이 없습니다. 기간이나 참석자를 조정해보세요.
            </p>
          </div>
        ) : (
          previewSlots.map((slot, i) => (
            <CandidateCard key={`${slot.date}-${slot.startTime}`} slot={slot} />
          ))
        )}
      </div>

      {totalMembers > 0 && previewSlots.length > 0 && (
        <>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between text-title">
              <span className="text-gray-600">검토 기간</span>
              <span className="font-medium text-gray-900">{daysDiff}일</span>
            </div>
          </div>
          <div className="mt-3">
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full gap-2"
            >
              <span>가능한 시간 보기</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="flex min-h-full flex-col items-center bg-gray-50">
      <div className="w-full max-w-7xl px-6 pt-6 pb-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-body-sm text-gray-600 hover:text-gray-900"
        >
          ← 홈
        </Link>

        <h1 className="mt-2 text-heading-s font-semibold text-gray-900">회의 일정 조율</h1>
      </div>

      <PageLayout hideSidebar right={candidatePanel}>
        <section className="rounded-[8px] border border-gray-100 bg-white p-5">
          <label className="text-title font-semibold text-gray-900">
            회의 제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="회의 제목을 입력해주세요"
            className="mt-2 w-full rounded-[8px] border border-gray-200 px-4 py-3 text-body-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-black"
          />
        </section>

        <section className="mt-3 rounded-[8px] border border-gray-100 bg-white p-5">
          <label className="text-title font-semibold text-gray-900">
            회의 설명
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명을 입력해주세요"
            className="mt-2 w-full rounded-[8px] border border-gray-200 px-4 py-3 text-body-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-black"
          />
        </section>

        <section className="mt-3 rounded-[8px] border border-gray-100 bg-white p-5">
          <label className="text-title font-semibold text-gray-900">
            회의 방식
          </label>
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
          <label className="text-title font-semibold text-gray-900">
            회의 시간
          </label>
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

        <section className="mt-3 rounded-[8px] border border-gray-100 bg-white p-5">
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
          <label className="text-title font-semibold text-gray-900">
            회의 가능 기간
          </label>
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
            {getDateLabel(startDate)} ~ {getDateLabel(endDate)} · 총 {daysDiff}
            일
          </p>
        </section>

        <div className="mt-6 lg:hidden">
          <Button onClick={handleSubmit} disabled={!isValid} className="w-full gap-2">
            <span>가능한 시간 보기</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </PageLayout>
    </div>
  )
}
