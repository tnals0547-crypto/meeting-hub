'use client'

import { useMemo, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { PanelLeft, X, ArrowRight } from 'lucide-react'
import { meetings as mockMeetings } from '@/data/mock'
import {
  getStoredMeetingsServerSnapshot,
  getStoredMeetingsSnapshot,
  mergeMeetings,
  subscribeStoredMeetings,
} from '@/lib/meetingStore'

const scheduleItems = [
  { time: '09:00', title: '데일리 스크럼', bar: 'bg-warning' },
  { time: '11:00', title: '프로젝트 리뷰', bar: 'bg-info' },
  { time: '14:30', title: '파트너 미팅', bar: 'bg-success' },
]

const recentMails = [
  { from: '김민수', title: '수율 개선 회의 참석 요청' },
  { from: '정서연', title: 'Q2 회고 - 대체 참석자 선택 안내' },
]

const statusBadge: Record<string, string> = {
  pending: 'bg-surface-muted text-text-tertiary',
  response_collecting: 'bg-warning-bg text-warning',
  response_complete: 'bg-status-replacement-bg text-status-replacement',
  confirmed: 'bg-success-bg text-success',
}

const statusLabel: Record<string, string> = {
  pending: '응답 필요',
  response_collecting: '응답 확인',
  response_complete: '대체 참석 요청',
  confirmed: '확정 완료',
}

export default function Workspace({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const storedMeetings = useSyncExternalStore(
    subscribeStoredMeetings,
    getStoredMeetingsSnapshot,
    getStoredMeetingsServerSnapshot,
  )
  const allMeetings = useMemo(
    () => mergeMeetings(mockMeetings, storedMeetings),
    [storedMeetings],
  )

  const actionRequired = allMeetings.filter(
    (m) =>
      m.status === 'pending' ||
      m.status === 'response_collecting' ||
      m.status === 'response_complete',
  )

  const pendingCount = allMeetings.filter((m) => m.status === 'pending').length
  const replacementCount = allMeetings.filter((m) => m.status === 'response_complete').length
  const confirmTodayCount = allMeetings.filter(
    (m) => m.status === 'response_collecting',
  ).length

  const myMeetings = allMeetings
    .filter((m) => m.myRole === 'organizer')
    .slice(0, 4)

  return (
    <>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={onClose}
          />
          <div
            className="fixed top-0 left-0 z-50 flex h-full w-[320px] flex-col border-r border-gray-200 bg-white shadow-xl lg:left-[72px]"
          >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <PanelLeft className="h-4 w-4 text-gray-400" />
            <span className="text-title font-bold text-gray-900">Relay Workspace</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-0">
            {/* 오늘 일정 */}
            <section className="px-4 pt-5 pb-4">
              <h3 className="text-title font-semibold text-gray-900">
                오늘 일정
              </h3>
              <div className="mt-3 space-y-2">
                {scheduleItems.map((item) => (
                  <div key={item.time} className="flex items-center gap-3">
                    <span
                      className={`inline-block h-4 w-0.5 shrink-0 rounded-full ${item.bar}`}
                    />
                    <span className="w-9 text-body-sm font-medium text-gray-500">
                      {item.time}
                    </span>
                    <span className="text-body-sm text-gray-900">{item.title}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="mx-4 h-px bg-gray-100" />

            {/* Action Required */}
            <section className="px-4 pt-4 pb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-title font-semibold text-gray-900">
                  오늘 확인할 내용
                </h3>
                {actionRequired.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-caption font-medium text-danger">
                    {actionRequired.length}
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-0.5">
                {pendingCount > 0 && (
                  <Link
                    href="/meetings"
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-body-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-warning" />
                    <span>응답을 기다리는 회의 {pendingCount}건</span>
                  </Link>
                )}
                {replacementCount > 0 && (
                  <Link
                    href={`/meetings/${allMeetings.find((m) => m.status === 'response_complete')?.id}/replacement`}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-body-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-status-replacement" />
                    <span>대체 참석이 필요한 회의 {replacementCount}건</span>
                  </Link>
                )}
                {confirmTodayCount > 0 && (
                  <Link
                    href="/meetings"
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-body-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-success" />
                    <span>오늘 확정 예정인 회의 {confirmTodayCount}건</span>
                  </Link>
                )}
                {actionRequired.length === 0 && (
                  <p className="px-2.5 py-2 text-body-sm text-gray-400">
                    확인할 내용이 없습니다
                  </p>
                )}
              </div>
            </section>

            <div className="mx-4 h-px bg-gray-100" />

            {/* 최근 회의 */}
            <section className="px-4 pt-4 pb-4">
              <h3 className="text-title font-semibold text-gray-900">
                최근 회의
              </h3>
              <div className="mt-3 space-y-0.5">
                {myMeetings.length > 0 ? (
                  myMeetings.map((m) => (
                    <Link
                      key={m.id}
                      href={`/meetings/${m.id}`}
                      className="flex items-center justify-between rounded-lg px-2.5 py-2 text-body-sm transition-colors hover:bg-gray-50"
                    >
                      <span className="truncate text-gray-900">{m.title}</span>
                      <span
                        className={`inline-flex h-6 shrink-0 items-center rounded-full px-2 text-caption font-medium ${
                          statusBadge[m.status]
                        }`}
                      >
                        {statusLabel[m.status]}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="px-2.5 py-2 text-body-sm text-gray-400">
                    주최한 회의가 없습니다
                  </p>
                )}
                <Link
                  href="/meetings"
                  className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-body-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
                >
                  <span>모든 회의 보기</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>

            <div className="mx-4 h-px bg-gray-100" />

            {/* 최근 메일 */}
            <section className="px-4 pt-4 pb-5">
              <h3 className="text-title font-semibold text-gray-900">
                최근 메일
              </h3>
              <div className="mt-3 space-y-0.5">
                {recentMails.map((mail, i) => (
                  <div
                    key={i}
                    className="rounded-lg px-2.5 py-2 text-body-sm transition-colors hover:bg-gray-50"
                  >
                    <p className="truncate text-gray-900">{mail.title}</p>
                    <p className="text-body-sm text-gray-500">{mail.from}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )}
</>
  )
}
