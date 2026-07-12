'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Calendar, ArrowRight } from 'lucide-react'
import type { Meeting } from '@/types/meeting'
import StatusBadge from '@/components/common/StatusBadge'
import Button from '@/components/common/Button'
import EmptyState from '@/components/common/EmptyState'
import { SkeletonCard } from '@/components/common/Skeleton'
import ErrorState from '@/components/common/ErrorState'
import ParticipantList from '@/components/ParticipantList'
import ProgressStepper from '@/components/ProgressStepper'
import ConfirmConditions from '@/components/ConfirmConditions'
import PageLayout from '@/components/layout/PageLayout'
import { meetings } from '@/data/mock'

interface MeetingLoadState {
  meeting: Meeting | null
  error: string | null
}

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
  const readMeeting = (): MeetingLoadState => {
    if (typeof window === 'undefined') return { meeting: null, error: null }

    try {
      const stored = sessionStorage.getItem(`meeting-${id}`)
      if (stored) {
        const data = JSON.parse(stored)
        if (!data.myRole) data.myRole = 'organizer'
        return { meeting: data, error: null }
      }
      const fallbackMeeting = meetings.find((meeting) => meeting.id === id) ?? null
      return { meeting: fallbackMeeting, error: null }
    } catch {
      return { meeting: null, error: '회의 정보를 불러오는 중 오류가 발생했습니다.' }
    }
  }

  const [loadState, setLoadState] = useState<MeetingLoadState>(() => readMeeting())
  const { meeting, error } = loadState

  function loadMeeting() {
    setLoadState(readMeeting())
  }

  if (typeof window === 'undefined') {
    return (
      <div className="flex min-h-full flex-col items-center bg-gray-50">
        <main className="flex w-full max-w-xl flex-col gap-4 px-6 py-10">
          <SkeletonCard />
          <SkeletonCard />
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-full flex-col items-center bg-gray-50">
        <main className="flex w-full max-w-xl flex-col px-6 py-10">
          <ErrorState
            title="회의 정보를 불러올 수 없습니다"
            description={error}
            onRetry={loadMeeting}
          />
        </main>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="flex min-h-full flex-col items-center bg-gray-50">
        <main className="flex w-full max-w-xl flex-col px-6 py-10">
          <EmptyState
            icon="calendar"
            title="회의 정보를 찾을 수 없습니다"
            action={{ label: '회의로 돌아가기', href: '/meetings' }}
          />
        </main>
      </div>
    )
  }

  const timeSlotSection = meeting.confirmedTimeSlot && (
    <div className="rounded-xl border border-l-4 border-gray-200 border-l-success bg-white p-5">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <p className="text-body-sm font-semibold text-gray-700">선택된 시간</p>
      </div>
      <p className="mt-2 text-heading-s font-bold text-gray-900">
        {formatDate(meeting.confirmedTimeSlot.date)}{' '}
        {meeting.confirmedTimeSlot.startTime} ~{' '}
        {meeting.confirmedTimeSlot.endTime}
      </p>
    </div>
  )

  const status = meeting.status
  const needsReplacement = status === 'response_complete' &&
    meeting.participants.some((p) => p.isRequired && p.responseStatus === 'declined')

  const rightPanel = (
    <div className="hidden lg:flex lg:flex-col lg:gap-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-title font-semibold text-gray-900">참석자 목록</h3>
        <div className="mt-3">
          <ParticipantList participants={meeting.participants} />
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-title font-semibold text-gray-900">회의 정보</h3>
        <dl className="mt-2 space-y-2 text-body-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <dd>{meeting.organizerName}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <dd>{formatCreatedAt(meeting.createdAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <div className="w-full border-b border-gray-200 bg-white px-6 py-5">
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1 text-body-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← 회의
        </Link>

        <h1 className="mt-2 text-heading-s font-semibold text-gray-900">{meeting.title}</h1>
        {meeting.description && (
          <p className="mt-1 text-body-sm text-gray-500">{meeting.description}</p>
        )}
      </div>

      <PageLayout hideSidebar right={rightPanel}>
        {/* Mobile */}
        <div className="lg:hidden">
          {timeSlotSection && <div>{timeSlotSection}</div>}
          <div className="mt-4">
            <StatusBadge status={status} />
          </div>
          <div className="mt-5">
            <ConfirmConditions meeting={meeting} />
          </div>
          <div className="mt-10">
            <h3 className="text-title font-semibold text-gray-900">진행 단계</h3>
            <div className="mt-4">
              <ProgressStepper status={status} />
            </div>
          </div>
          <div className="mt-10">
            <h3 className="text-title font-semibold text-gray-900">참석자 목록</h3>
            <div className="mt-3">
              <ParticipantList participants={meeting.participants} />
            </div>
          </div>
          <div className="mt-8 border-t border-gray-100 pt-5">
            <h3 className="text-title font-medium text-gray-500">회의 정보</h3>
            <dl className="mt-2 text-body-sm text-gray-600">
              <div>주최자: {meeting.organizerName}</div>
              <div className="mt-1">생성일: {formatCreatedAt(meeting.createdAt)}</div>
            </dl>
          </div>
          <div className="mt-8">
            <Button href="/meetings" variant="secondary" className="w-full">
              회의로 돌아가기
            </Button>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden lg:block">
          {timeSlotSection && <div>{timeSlotSection}</div>}
          <div className="mt-4">
            <StatusBadge status={status} />
          </div>
          <div className="mt-5">
            <ConfirmConditions meeting={meeting} />
          </div>
          <div className="mt-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-title font-semibold text-gray-900 mb-4">진행 단계</h3>
              <ProgressStepper status={status} />
            </div>
          </div>
          {needsReplacement && (
            <div className="mt-5">
              <Button
                href={`/meetings/${meeting.id}/replacement`}
                variant="primary"
                className="w-full justify-between"
              >
                <span>대체 참석자 선택하기</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}
          <div className="mt-8">
            <Button href="/meetings" variant="secondary" className="w-full">
              회의로 돌아가기
            </Button>
          </div>
        </div>
      </PageLayout>
    </div>
  )
}
