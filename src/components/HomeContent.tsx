'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, HelpCircle, XCircle, AlertCircle, Calendar, Archive } from 'lucide-react'
import type { Meeting } from '@/types/meeting'
import MeetingTable from '@/components/MeetingTable'
import MeetingPreview from '@/components/MeetingPreview'
import Button from '@/components/common/Button'
import PageLayout from '@/components/layout/PageLayout'

interface HomeContentProps {
  meetings: Meeting[]
  initialFilter?: string
}

function readStoredMeetings() {
  const stored: Meeting[] = []
  if (typeof window === 'undefined') return stored

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

  return stored
}

const stepLabel: Record<string, { icon: React.ReactNode; text: string; className: string }> = {
  pending: {
    icon: <HelpCircle className="h-3.5 w-3.5" />,
    text: '참석 요청 전',
    className: 'border border-info/15 bg-info-bg text-info',
  },
  response_collecting: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    text: '미응답 있음',
    className: 'border border-warning/15 bg-warning-bg text-warning',
  },
  response_complete: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    text: '불참 있음',
    className: 'border border-status-replacement/15 bg-status-replacement-bg text-status-replacement',
  },
  confirmed: {
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    text: '확정 가능',
    className: 'border border-success/15 bg-success-bg text-success',
  },
  completed: {
    icon: <Archive className="h-3.5 w-3.5" />,
    text: '회의 기록',
    className: 'bg-gray-100 text-gray-700',
  },
}

export default function HomeContent({ meetings, initialFilter }: HomeContentProps) {
  const [dynamicMeetings] = useState<Meeting[]>(() => readStoredMeetings())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const allMeetingSource = [...dynamicMeetings, ...meetings]
    .sort((a, b) => {
      const priority: Record<string, number> = {
        response_complete: 0,
        response_collecting: 1,
        pending: 2,
        confirmed: 3,
        completed: 4,
      }
      return (priority[a.status] ?? 9) - (priority[b.status] ?? 9)
    })

  const activeFilter = initialFilter === 'confirmed' ? 'active' : initialFilter ?? 'active'
  const allMeetings = allMeetingSource.filter((m) => {
    if (activeFilter === 'completed') return m.status === 'completed'
    if (activeFilter !== 'active') return m.status === activeFilter
    return m.status !== 'completed'
  })

  const pending = allMeetingSource.filter((m) => m.status === 'pending')
  const collecting = allMeetingSource.filter((m) => m.status === 'response_collecting')
  const replacement = allMeetingSource.filter((m) => m.status === 'response_complete')
  const completed = allMeetingSource.filter((m) => m.status === 'completed')
  const isRecordView = activeFilter === 'completed'

  const selected = allMeetings.find((m) => m.id === selectedId) ?? allMeetings[0] ?? null
  const pageTitle = isRecordView ? '회의 기록' : '진행 중인 회의'
  const emptyTitle = isRecordView ? '완료된 회의 기록이 없습니다' : '진행 중인 회의가 없습니다'
  const emptyDescription = isRecordView ? '회의가 완료되면 회의록과 녹음/녹화 기록이 여기에 표시됩니다.' : '새로운 회의를 시작해보세요.'

  return (
    <>
      <div className="flex items-center w-full px-6 pt-6 pb-0 lg:hidden">
        <h1 className="text-heading-s font-semibold text-gray-900">회의</h1>
      </div>

      {/* Mobile summary */}
      <div className="w-full max-w-7xl px-6 pt-5 lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['pending', 'response_collecting', 'response_complete', 'completed'] as const).map((s) => {
            const count = s === 'pending' ? pending.length : s === 'response_collecting' ? collecting.length : s === 'response_complete' ? replacement.length : completed.length
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
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium ${step.className}`}>
                        {step.icon}
                        {step.text}
                      </span>
                    </div>
                    <p className="mt-1.5 text-body-sm text-gray-500 line-clamp-2">
                      {m.description || (m.participants.length > 0
                        ? `참석자 ${m.participants.length}명 · ${m.participants.filter(p => p.responseStatus === 'approved').length}명 승인`
                        : '참석자 정보 없음')}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-body-sm text-gray-400">
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
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <Calendar className="h-7 w-7 text-gray-400" />
              </div>
              <h3 className="text-title font-semibold text-gray-900">{emptyTitle}</h3>
              <p className="mt-1.5 text-body-sm text-gray-500">{emptyDescription}</p>
              {!isRecordView && (
                <div className="mt-4">
                  <Button href="/meetings/new">회의 생성</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden min-h-0 flex-1 lg:block">
        <PageLayout
          hideSidebar
          right={selected && <MeetingPreview meeting={selected} />}
        >
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h1 className="text-heading-s font-semibold text-gray-900">{pageTitle}</h1>
                <p className="mt-0.5 text-body-sm text-gray-500">
                  {isRecordView
                    ? '완료된 회의의 회의록과 녹음/녹화 기록은 오른쪽 패널에서 확인합니다.'
                    : '선택한 회의의 상세 정보와 다음 액션은 오른쪽 패널에서 확인합니다.'}
                </p>
              </div>
              <span className="text-body-sm font-medium text-gray-500">{allMeetings.length}건</span>
            </div>
            {allMeetings.length > 0 ? (
              <div>
                <MeetingTable
                  meetings={allMeetings}
                  selectedId={selected?.id ?? null}
                  onSelect={setSelectedId}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-title font-semibold text-gray-900">{emptyTitle}</h3>
                <p className="mt-1 text-body-sm text-gray-500">{emptyDescription}</p>
                {!isRecordView && (
                  <div className="mt-4">
                    <Button href="/meetings/new">회의 생성</Button>
                  </div>
                )}
              </div>
            )}
          </section>
        </PageLayout>
      </div>
    </>
  )
}
