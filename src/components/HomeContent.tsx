'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, HelpCircle, XCircle, AlertCircle, Calendar, Plus } from 'lucide-react'
import type { Meeting, AvailabilityStatus } from '@/types/meeting'
import MeetingTable from '@/components/MeetingTable'
import MeetingPreview from '@/components/MeetingPreview'
import Button from '@/components/common/Button'
import PageLayout from '@/components/layout/PageLayout'
import { teamMembers } from '@/data/mock'

interface HomeContentProps {
  meetings: Meeting[]
}

const teamAvailability: Record<string, AvailabilityStatus> = {
  m1: 'available',
  m2: 'in_meeting',
  m3: 'available',
  m4: 'focused',
  m5: 'available',
  m6: 'on_leave',
  m7: 'in_meeting',
  m8: 'focused',
}

const availConfig: Record<AvailabilityStatus, { dot: string; label: string }> = {
  available: { dot: 'bg-green-500', label: '업무 중' },
  in_meeting: { dot: 'bg-amber-500', label: '회의 중' },
  focused: { dot: 'bg-blue-500', label: '집중 중' },
  on_leave: { dot: 'bg-gray-400', label: '부재' },
}

const stepLabel: Record<string, { icon: React.ReactNode; text: string; className: string }> = {
  pending: {
    icon: <HelpCircle className="h-3.5 w-3.5" />,
    text: '참석 요청 전',
    className: 'bg-gray-100 text-gray-600',
  },
  response_collecting: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    text: '미응답 있음',
    className: 'bg-amber-50 text-amber-700',
  },
  response_complete: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    text: '불참 있음',
    className: 'bg-purple-50 text-purple-700',
  },
  confirmed: {
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    text: '확정 가능',
    className: 'bg-green-50 text-green-700',
  },
}

export default function HomeContent({ meetings }: HomeContentProps) {
  const [dynamicMeetings, setDynamicMeetings] = useState<Meeting[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const stored: Meeting[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('meeting-') && key !== 'newMeetingForm') {
        try {
          const data = JSON.parse(sessionStorage.getItem(key)!)
          if (!data.myRole) data.myRole = 'organizer'
          stored.push(data)
        } catch {
          /* ignore */
        }
      }
    }
    setDynamicMeetings(stored)
  }, [])

  const allMeetings = [...dynamicMeetings, ...meetings].sort((a, b) => {
    const priority: Record<string, number> = {
      response_complete: 0,
      response_collecting: 1,
      pending: 2,
      confirmed: 3,
    }
    return (priority[a.status] ?? 9) - (priority[b.status] ?? 9)
  })

  const pending = allMeetings.filter((m) => m.status === 'pending')
  const collecting = allMeetings.filter((m) => m.status === 'response_collecting')
  const replacement = allMeetings.filter((m) => m.status === 'response_complete')
  const confirmed = allMeetings.filter((m) => m.status === 'confirmed')

  const selected = allMeetings.find((m) => m.id === selectedId) ?? allMeetings[0] ?? null

  const teamWithStatus = teamMembers.map((member) => {
    const status = teamAvailability[member.id] ?? 'available'
    const config = availConfig[status]
    return { ...member, status, config }
  })

  return (
    <>
      <div className="flex items-center justify-between w-full max-w-7xl px-6 pt-6 pb-0">
        <h1 className="text-heading-s font-semibold text-gray-900">회의</h1>
        <Button href="/meetings/new" className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span>회의 생성</span>
        </Button>
      </div>

      {/* Mobile summary */}
      <div className="w-full max-w-7xl px-6 pt-5 lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['pending', 'response_collecting', 'response_complete', 'confirmed'] as const).map((s) => {
            const count = s === 'pending' ? pending.length : s === 'response_collecting' ? collecting.length : s === 'response_complete' ? replacement.length : confirmed.length
            if (count === 0) return null
            const cfg = stepLabel[s]
            return (
              <span key={s} className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-caption font-medium ${cfg.className}`}>
                {cfg.icon}
                {cfg.text} {count}
              </span>
            )
          })}
        </div>
      </div>

      <div className="flex w-full max-w-7xl flex-1 flex-col px-4 pb-6 lg:hidden">
        <div className="mt-3">
          {allMeetings.length > 0 ? (
            <div className="flex flex-col gap-4">
              {allMeetings.map((m) => {
                const step = stepLabel[m.status]
                return (
                  <Link
                    key={m.id}
                    href={`/meetings/${m.id}`}
                    className="block rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-title font-semibold text-gray-900 truncate">{m.title}</h3>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium ${step.className}`}>
                        {step.icon}
                        {step.text}
                      </span>
                    </div>
                    <p className="mt-1.5 text-body-sm text-gray-500 line-clamp-2">
                      {m.description || (m.participants.length > 0
                        ? `참석자 ${m.participants.length}명 · ${m.participants.filter(p => p.responseStatus === 'approved').length}명 승인`
                        : '참석자 정보 없음')}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-caption text-gray-400">
                      <span>{m.organizerName}</span>
                      <span>·</span>
                      <span>{m.location || '장소 미정'}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                <Calendar className="h-7 w-7 text-brand-500" />
              </div>
              <h3 className="text-title font-semibold text-gray-900">진행 중인 회의가 없습니다</h3>
              <p className="mt-1.5 text-body-sm text-gray-500">새로운 회의를 시작해보세요.</p>
              <div className="mt-4">
                <Button href="/meetings/new">회의 생성</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop */}
      <PageLayout
        sidebar={
          <div className="hidden lg:block">
            {selected ? (
              <>
                <h2 className="text-title font-semibold text-gray-900">참석자 현황</h2>
                <div className="mt-3 space-y-2">
                  {selected.participants.map((p) => {
                    const respStyle = p.responseStatus === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : p.responseStatus === 'declined'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-500'
                    const respLabel = p.responseStatus === 'approved' ? '승인'
                      : p.responseStatus === 'declined' ? '불참' : '미응답'
                    return (
                      <div key={p.id} className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-body-sm font-medium text-gray-900">{p.name}</p>
                          <p className="truncate text-body-sm text-gray-600">
                            {p.department} &middot; {p.role}
                            {p.isRequired && <span className="ml-1 text-brand-600">· 필수</span>}
                          </p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${respStyle}`}>
                          {respLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-title font-semibold text-gray-900">팀 현황</h2>
                <div className="mt-3 space-y-2">
                  {teamWithStatus.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50">
                      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${member.config.dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body-sm font-medium text-gray-900">{member.name}</p>
                        <p className="truncate text-body-sm text-gray-600">
                          {member.department} &middot; {member.role}
                        </p>
                      </div>
                      <span className={`shrink-0 text-caption font-medium ${
                        member.status === 'available' || member.status === 'focused'
                          ? 'text-gray-600'
                          : member.status === 'in_meeting'
                            ? 'text-amber-600'
                            : 'text-gray-400'
                      }`}>
                        {member.config.label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        }
        right={
          selected && (
            <div className="hidden lg:block">
              <MeetingPreview meeting={selected} />
            </div>
          )
        }
      >
        <div className="hidden lg:block">
          {/* In-progress meetings — main content */}
          <section>
            <h2 className="text-title font-semibold text-gray-900">진행 중인 회의</h2>
            {allMeetings.length > 0 ? (
              <div className="mt-3">
                <MeetingTable
                  meetings={allMeetings}
                  selectedId={selected?.id ?? null}
                  onSelect={setSelectedId}
                />
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center py-12 text-center rounded-xl border border-gray-100 bg-gray-50">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                  <Calendar className="h-6 w-6 text-brand-500" />
                </div>
                <h3 className="text-title font-semibold text-gray-900">진행 중인 회의가 없습니다</h3>
                <p className="mt-1 text-body-sm text-gray-500">새로운 회의를 시작해보세요.</p>
                <div className="mt-4">
                  <Button href="/meetings/new">회의 생성</Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </PageLayout>
    </>
  )
}