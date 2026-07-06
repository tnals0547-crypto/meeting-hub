'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { teamMembers } from '@/data/mock'
import type { TeamMember, MeetingDuration } from '@/types/meeting'
import MemberSelector from '@/components/MemberSelector'

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

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50">
      <main className="flex w-full max-w-xl flex-col px-6 py-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          ← 홈
        </Link>

        <h1 className="text-xl font-bold text-gray-900">새 회의 만들기</h1>

        <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
          <label className="text-sm font-semibold text-gray-900">
            회의 제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="회의 제목을 입력해주세요"
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-black"
          />
        </section>

        <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-5">
          <label className="text-sm font-semibold text-gray-900">
            회의 설명
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명을 입력해주세요"
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-black"
          />
        </section>

        <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-5">
          <label className="text-sm font-semibold text-gray-900">
            회의 방식
          </label>
          <div className="mt-3 flex gap-3">
            {MEETING_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMeetingType(opt.value)}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  meetingType === opt.value
                    ? 'border-black bg-gray-50 text-gray-900'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-5">
          <label className="text-sm font-semibold text-gray-900">
            회의 시간
          </label>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDuration(opt.value)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                  duration === opt.value
                    ? 'border-black bg-gray-50 text-gray-900'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-5">
          <MemberSelector
            allMembers={teamMembers}
            requiredMembers={requiredMembers}
            optionalMembers={optionalMembers}
            onAddRequired={handleAddRequired}
            onAddOptional={handleAddOptional}
            onRemove={handleRemove}
          />
        </section>

        <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-5">
          <label className="text-sm font-semibold text-gray-900">
            회의 가능 기간
          </label>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500">시작일</p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-black"
              />
            </div>
            <span className="mt-5 text-sm text-gray-300">~</span>
            <div className="flex-1">
              <p className="text-xs text-gray-500">종료일</p>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-black"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {getDateLabel(startDate)} ~ {getDateLabel(endDate)} · 총 {daysDiff}
            일
          </p>
        </section>

        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-medium transition-colors ${
              isValid
                ? 'bg-black text-white hover:bg-black/80'
                : 'cursor-not-allowed bg-gray-200 text-gray-400'
            }`}
          >
            가능한 시간 보기
          </button>
        </div>
      </main>
    </div>
  )
}
