'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Meeting } from '@/types/meeting'
import StatusBadge from '@/components/common/StatusBadge'
import ParticipantList from '@/components/ParticipantList'

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${days[d.getDay()]})`
}

function formatCreatedAt(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export default function DynamicMeetingPage({ id }: { id: string }) {
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem(`meeting-${id}`)
    if (stored) {
      setMeeting(JSON.parse(stored))
    }
    setLoading(false)
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-full flex-col items-center bg-zinc-50">
        <main className="flex w-full max-w-xl flex-col px-6 py-10">
          <p className="text-sm text-gray-500">로딩 중...</p>
        </main>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="flex min-h-full flex-col items-center bg-zinc-50">
        <main className="flex w-full max-w-xl flex-col px-6 py-10">
          <p className="text-sm text-gray-500">회의 정보를 찾을 수 없습니다.</p>
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

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50">
      <main className="flex w-full max-w-xl flex-col px-6 py-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          ← Meeting Hub
        </Link>

        <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>

        {meeting.confirmedTimeSlot && (
          <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-5">
            <p className="text-sm font-medium text-green-800">선택된 시간</p>
            <p className="mt-1 text-lg font-bold text-green-900">
              {formatDate(meeting.confirmedTimeSlot.date)}{' '}
              {meeting.confirmedTimeSlot.startTime} ~{' '}
              {meeting.confirmedTimeSlot.endTime}
            </p>
          </div>
        )}

        <div className="mt-4">
          <StatusBadge status={meeting.status} />
        </div>

        <p className="mt-4 text-sm text-gray-500">{meeting.description}</p>

        <section className="mt-10">
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
              <dt>생성일</dt>
              <dd>{formatCreatedAt(meeting.createdAt)}</dd>
            </div>
          </dl>
        </section>

        <div className="mt-8">
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black/80"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  )
}
