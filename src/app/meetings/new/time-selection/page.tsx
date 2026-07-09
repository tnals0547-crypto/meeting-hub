'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Calendar, ArrowLeft } from 'lucide-react'
import { teamMembers } from '@/data/mock'
import { generateTimeSlots, sortSlots } from '@/data/availability'
import type {
  MeetingDuration,
  Meeting,
  Participant,
  MeetingStatus,
} from '@/types/meeting'
import TimeSlotCard from '@/components/TimeSlotCard'
import Button from '@/components/common/Button'
import PageLayout from '@/components/layout/PageLayout'
import { SkeletonCard } from '@/components/common/Skeleton'
import ErrorState from '@/components/common/ErrorState'
import EmptyState from '@/components/common/EmptyState'

interface NewMeetingForm {
  title: string
  description: string
  meetingType: string
  duration: MeetingDuration
  requiredMembers: { id: string; name: string; department: string; role: string }[]
  optionalMembers: { id: string; name: string; department: string; role: string }[]
  startDate: string
  endDate: string
}

export default function TimeSelectionPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<NewMeetingForm | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('newMeetingForm')
    if (!stored) {
      router.replace('/meetings/new')
      return
    }
    try {
      setFormData(JSON.parse(stored))
    } catch {
      setError('회의 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [router])

  const memberNames = useMemo(() => {
    const names: Record<string, string> = {}
    for (const m of teamMembers) {
      names[m.id] = m.name
    }
    return names
  }, [])

  const allSlots = useMemo(() => {
    if (!formData) return []
    try {
      const requiredIds = formData.requiredMembers.map((m) => m.id)
      const optionalIds = formData.optionalMembers.map((m) => m.id)

      const slots = generateTimeSlots(
        formData.startDate,
        formData.endDate,
        formData.duration,
        requiredIds,
        optionalIds,
      )

      const viable = slots.filter(
        (s) => s.allRequiredAvailable || s.availableMemberIds.length >= requiredIds.length,
      )

      return sortSlots(viable)
    } catch {
      return []
    }
  }, [formData])

  const heroSlot = allSlots.length > 0 ? allSlots[selectedIndex] : null

  function handleSelectSlot(index: number) {
    setSelectedIndex(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSubmit() {
    if (!formData || !heroSlot) return

    const newId = `meeting-${Date.now()}`
    const participants: Participant[] = [
      ...formData.requiredMembers.map((m) => ({
        id: `p-${m.id}`,
        name: m.name,
        department: m.department,
        role: m.role,
        responseStatus: 'pending' as const,
        respondedAt: null,
        isRequired: true,
      })),
      ...formData.optionalMembers.map((m) => ({
        id: `p-${m.id}-opt`,
        name: m.name,
        department: m.department,
        role: m.role,
        responseStatus: 'pending' as const,
        respondedAt: null,
        isRequired: false,
      })),
    ]

    const newMeeting: Meeting = {
      id: newId,
      title: formData.title,
      description: formData.description,
      location: '',
      createdAt: new Date().toISOString(),
      organizerName: '나',
      myRole: 'organizer',
      participants,
      requiredAttendanceRate: 100,
      status: 'response_collecting' as MeetingStatus,
      confirmedTimeSlot: {
        date: heroSlot.date,
        startTime: heroSlot.startTime,
        endTime: heroSlot.endTime,
      },
    }

    sessionStorage.setItem(`meeting-${newId}`, JSON.stringify(newMeeting))
    router.push(`/meetings/${newId}?source=new`)
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-col items-center bg-gray-50">
        <main className="flex w-full max-w-xl flex-col gap-4 px-6 py-10">
          <div className="h-4 w-24 animate-pulse rounded-md bg-gray-200" />
          <div className="h-6 w-48 animate-pulse rounded-md bg-gray-200" />
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
            onRetry={() => router.push('/meetings/new')}
            retryLabel="회의 다시 만들기"
          />
        </main>
      </div>
    )
  }

  if (!formData) {
    return null
  }

  if (allSlots.length === 0) {
    return (
      <div className="flex min-h-full flex-col items-center bg-gray-50">
        <main className="flex w-full max-w-xl flex-col px-6 py-10">
          <Link
            href="/meetings/new"
            className="inline-flex items-center gap-1 text-body-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />새 회의 만들기
          </Link>
          <EmptyState
            icon="calendar"
            title="가능한 시간이 없습니다"
            description="선택한 기간에 모든 필수 참석자가 가능한 시간이 없습니다. 기간을 늘리거나 참석자를 조정해보세요."
            action={{ label: '회의 정보 수정하기', href: '/meetings/new' }}
          />
        </main>
      </div>
    )
  }

  const otherSlotsList = allSlots.length > 1 && (
    <>
      <h2 className="text-title font-semibold text-gray-900">다른 가능한 시간</h2>
      <div className="mt-3 flex flex-col gap-2">
        {allSlots.map((slot, i) => {
          if (i === selectedIndex) return null
          return (
            <TimeSlotCard
              key={`${slot.date}-${slot.startTime}`}
              slot={slot}
              mode="compact"
              onSelect={() => handleSelectSlot(i)}
              memberNames={memberNames}
            />
          )
        })}
      </div>
    </>
  )

  return (
    <div className="flex min-h-full flex-col items-center bg-gray-50">
      <div className="w-full max-w-7xl px-6 pt-6 pb-0">
        <Link
          href="/meetings/new"
          className="inline-flex items-center gap-1 text-body-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          새 회의 만들기
        </Link>

        <h1 className="mt-2 text-heading-s font-semibold text-gray-900">{formData.title}</h1>
      </div>

      <PageLayout
        hideSidebar
        right={
          allSlots.length > 1 && (
            <div className="hidden lg:block">
              {otherSlotsList}
            </div>
          )
        }
      >
        <div className="mt-6">
          <TimeSlotCard
            slot={heroSlot!}
            mode="hero"
            onSubmit={handleSubmit}
            memberNames={memberNames}
          />
        </div>

        {allSlots.length > 1 && (
          <section className="mt-8 lg:hidden">
            {otherSlotsList}
          </section>
        )}
      </PageLayout>
    </div>
  )
}