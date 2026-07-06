'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { teamMembers } from '@/data/mock'
import { generateTimeSlots, sortSlots } from '@/data/availability'
import type {
  MeetingDuration,
  TimeSlotWithAvailability,
  Meeting,
  Participant,
  MeetingStatus,
} from '@/types/meeting'
import TimeSlotCard from '@/components/TimeSlotCard'

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

  useEffect(() => {
    const stored = sessionStorage.getItem('newMeetingForm')
    if (!stored) {
      router.replace('/meetings/new')
      return
    }
    setFormData(JSON.parse(stored))
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
  }, [formData])

  const heroSlot =
    allSlots.length > 0 ? allSlots[selectedIndex] : null

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

  if (!formData) {
    return (
      <div className="flex min-h-full flex-col items-center bg-zinc-50">
        <main className="flex w-full max-w-xl flex-col px-6 py-6">
          <p className="text-sm text-gray-500">로딩 중...</p>
        </main>
      </div>
    )
  }

  if (allSlots.length === 0) {
    return (
      <div className="flex min-h-full flex-col items-center bg-zinc-50">
        <main className="flex w-full max-w-xl flex-col px-6 py-6">
          <Link
            href="/meetings/new"
            className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
          >
            ← 새 회의 만들기
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{formData.title}</h1>
          <p className="mt-6 text-sm text-gray-500">
            선택한 기간에 모든 필수 참석자가 가능한 시간이 없습니다.
          </p>
          <Link
            href="/meetings/new"
            className="mt-4 text-sm font-medium text-gray-900 underline"
          >
            회의 정보 수정하기
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50">
      <main className="flex w-full max-w-xl flex-col px-6 py-6">
        <Link
          href="/meetings/new"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          ← 새 회의 만들기
        </Link>

        <h1 className="text-xl font-bold text-gray-900">{formData.title}</h1>

        <div className="mt-6">
          <TimeSlotCard
            slot={heroSlot!}
            mode="hero"
            onSubmit={handleSubmit}
            memberNames={memberNames}
          />
        </div>

        {allSlots.length > 1 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-gray-900">
              다른 가능한 시간
            </h2>
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
          </section>
        )}
      </main>
    </div>
  )
}
