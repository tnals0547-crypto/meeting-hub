'use client'

import { Suspense, useMemo, useSyncExternalStore } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { meetings } from '@/data/mock'
import {
  getStoredMeetingsServerSnapshot,
  getStoredMeetingsSnapshot,
  mergeMeetings,
  subscribeStoredMeetings,
} from '@/lib/meetingStore'
import {
  getMailTotalCount,
  getPendingMailActionCount,
  getStoredMailStatesServerSnapshot,
  getStoredMailStatesSnapshot,
  subscribeStoredMailStates,
} from '@/lib/mailStore'

const MAIL_ITEMS = [
  { label: '전체', href: '/' },
  { label: '확인 필요', href: '/?folder=action_needed' },
  { label: '참석 요청', href: '/?folder=meeting_request' },
  { label: '대체 참석 요청', href: '/?folder=replacement_needed' },
  { label: '일반 알림', href: '/?folder=regular' },
]

const CALENDAR_ITEMS = [
  { label: '이번 주', href: '/calendar' },
  { label: '회의', href: '/calendar?filter=meeting' },
  { label: '집중 업무', href: '/calendar?filter=focus' },
  { label: '외부 일정', href: '/calendar?filter=external' },
  { label: '부재', href: '/calendar?filter=vacation' },
]

const MEETINGS_ITEMS = [
  { label: '진행 중', href: '/meetings' },
  { label: '참석 요청 전', href: '/meetings?filter=pending' },
  { label: '대체 참석 필요', href: '/meetings?filter=response_complete' },
  { label: '회의 기록', href: '/meetings?filter=completed' },
]

const CHAT_ITEMS = [
  { label: '전체 대화', href: '/chat' },
  { label: '회의 관련', href: '/chat?section=meeting' },
  { label: '대체 참석 요청', href: '/chat?section=replacement' },
  { label: '미응답 확인', href: '/chat?section=pending' },
]

function getSection(pathname: string) {
  if (pathname === '/' || pathname.startsWith('/mail')) return 'mail'
  if (pathname.startsWith('/calendar')) return 'calendar'
  if (pathname.startsWith('/meetings')) return 'meetings'
  if (pathname.startsWith('/chat')) return 'chat'
  return null
}

function matchesCurrent(href: string, pathname: string, searchParams: URLSearchParams) {
  const [hrefPath, hrefQuery] = href.split('?')
  if (hrefPath !== pathname) return false
  if (!hrefQuery) return !searchParams.toString()
  const params = new URLSearchParams(hrefQuery)
  for (const [key, value] of params) {
    if (searchParams.get(key) !== value) return false
  }
  return true
}

const SECTION_ITEMS: Record<string, { label: string; href: string }[]> = {
  mail: MAIL_ITEMS,
  calendar: CALENDAR_ITEMS,
  meetings: MEETINGS_ITEMS,
  chat: CHAT_ITEMS,
}

const SECTION_META: Record<
  string,
  { title: string; summary: { label: string; value: string }[] }
> = {
  mail: {
    title: '메일',
    summary: [
      { label: '전체', value: '10' },
      { label: '확인 필요', value: '3' },
    ],
  },
  calendar: {
    title: '캘린더',
    summary: [
      { label: '이번 주', value: '16' },
      { label: '가능 시간', value: '5' },
    ],
  },
  meetings: {
    title: '회의',
    summary: [
      { label: '진행 중', value: '3' },
      { label: '기록', value: '2' },
    ],
  },
  chat: {
    title: '채팅',
    summary: [
      { label: '대화', value: '0' },
      { label: '확인 필요', value: '0' },
    ],
  },
}

type SectionMeta = typeof SECTION_META

function LNBContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const storedMailStates = useSyncExternalStore(
    subscribeStoredMailStates,
    getStoredMailStatesSnapshot,
    getStoredMailStatesServerSnapshot,
  )
  const storedMeetings = useSyncExternalStore(
    subscribeStoredMeetings,
    getStoredMeetingsSnapshot,
    getStoredMeetingsServerSnapshot,
  )
  const allMeetings = useMemo(() => mergeMeetings(meetings, storedMeetings), [storedMeetings])
  const dynamicMeta = useMemo<SectionMeta>(() => ({
    ...SECTION_META,
    mail: {
      title: '메일',
      summary: [
        { label: '전체', value: String(getMailTotalCount()) },
        { label: '확인 필요', value: String(getPendingMailActionCount(storedMailStates)) },
      ],
    },
    meetings: {
      title: '회의',
      summary: [
        { label: '진행 중', value: String(allMeetings.filter((meeting) => meeting.status !== 'completed').length) },
        { label: '기록', value: String(allMeetings.filter((meeting) => meeting.status === 'completed').length) },
      ],
    },
  }), [allMeetings, storedMailStates])

  const section = getSection(pathname)
  if (!section) return null

  const items = SECTION_ITEMS[section]
  const meta = dynamicMeta[section]

  return (
    <nav className="hidden w-60 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-gray-100 px-5 py-4">
        <p className="text-body-sm font-medium text-gray-400">SECTION</p>
        <h2 className="mt-1 text-heading-s font-semibold text-gray-900">{meta.title}</h2>
      </div>

      <div className="border-b border-gray-100 px-4 py-4">
        <p className="px-1 text-body-sm font-semibold text-gray-500">요약</p>
        <div className="mt-2 space-y-1">
          {meta.summary.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg px-2 py-1.5">
              <span className="text-body-sm text-gray-500">{item.label}</span>
              <span className="text-body-sm font-semibold text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-0.5 px-3 py-4">
        <p className="mb-2 px-2 text-body-sm font-semibold text-gray-500">필터</p>
        {items.map((item) => {
          const active = matchesCurrent(item.href, pathname, searchParams)
          return (
            <Link
              key={item.href}
              href={item.href}
              scroll={false}
              className={`rounded-lg border px-3 py-2 text-body-sm transition-colors ${
                active
                  ? 'border-[#9AA8B8] bg-gray-50 font-semibold text-gray-900'
                  : 'border-transparent font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function LNB() {
  return (
    <Suspense
      fallback={
        <div className="hidden w-60 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col" />
      }
    >
      <LNBContent />
    </Suspense>
  )
}
