'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Plus, Bell, Search, CircleUserRound, CalendarCheck, Mail, UserRound } from 'lucide-react'

type TopBarPopover = 'notifications' | 'profile' | null

export default function TopBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activePopover, setActivePopover] = useState<TopBarPopover>(null)
  const searchTimeoutRef = useRef<number | null>(null)
  const currentSearchQuery = searchParams.get('q') ?? ''

  function handleSearchChange(value: string) {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams.toString())
      const normalizedSearch = value.trim()

      if (normalizedSearch) {
        nextParams.set('q', normalizedSearch)
      } else {
        nextParams.delete('q')
      }

      const queryString = nextParams.toString()
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
    }, 250)
  }

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-5">
      {activePopover && (
        <button
          type="button"
          aria-label="상단 팝업 닫기"
          className="fixed inset-0 z-30 cursor-default"
          onClick={() => setActivePopover(null)}
        />
      )}

      <div className="flex min-w-0 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info text-title font-bold tracking-tight text-white">
            R
          </span>
          <span className="text-title font-bold text-gray-900">Relay</span>
        </Link>

        <div className="hidden md:relative md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            key={currentSearchQuery}
            type="search"
            defaultValue={currentSearchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="메일, 회의, 참석자 검색"
            className="h-9 w-[320px] rounded-[8px] border border-gray-200 bg-gray-50 pl-9 pr-3 text-body-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-300 focus:bg-white"
          />
        </div>
      </div>

      <div className="relative z-40 flex items-center gap-3">
        <Link
          href="/meetings/new"
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-info/15 bg-info-bg px-4 py-2 text-body-sm font-medium text-info transition-colors hover:border-info/25 hover:bg-brand-100"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">새 회의</span>
        </Link>

        <button
          type="button"
          aria-label="알림 열기"
          aria-expanded={activePopover === 'notifications'}
          onClick={() => setActivePopover((current) => current === 'notifications' ? null : 'notifications')}
          className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            activePopover === 'notifications' ? 'bg-info-bg text-info' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          }`}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
        </button>

        <button
          type="button"
          aria-label="프로필 열기"
          aria-expanded={activePopover === 'profile'}
          onClick={() => setActivePopover((current) => current === 'profile' ? null : 'profile')}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            activePopover === 'profile' ? 'bg-info text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
          }`}
        >
          <CircleUserRound className="h-5 w-5" />
        </button>

        {activePopover === 'notifications' && (
          <div className="absolute right-10 top-11 w-[320px] rounded-[12px] border border-gray-200 bg-white p-3 shadow-lg">
            <div className="flex items-center justify-between px-1 pb-2">
              <h2 className="text-title font-semibold text-gray-900">알림</h2>
              <span className="text-caption font-medium text-gray-500">3건</span>
            </div>
            <div className="space-y-1">
              <Link
                href="/meetings/meeting-3/replacement"
                onClick={() => setActivePopover(null)}
                className="flex gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-gray-50"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning-bg text-warning">
                  <CalendarCheck className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-body-sm font-semibold text-gray-900">Q2 회고 대체 참석 필요</span>
                  <span className="mt-0.5 block text-body-sm text-gray-500">필수 참석자 불참으로 대체자 확인이 필요합니다.</span>
                </span>
              </Link>
              <Link
                href="/?folder=response_update"
                onClick={() => setActivePopover(null)}
                className="flex gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-gray-50"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-info-bg text-info">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-body-sm font-semibold text-gray-900">응답 현황 확인</span>
                  <span className="mt-0.5 block text-body-sm text-gray-500">공정 변경 검토 회의에 미응답자가 남아 있습니다.</span>
                </span>
              </Link>
              <Link
                href="/?folder=meeting_request"
                onClick={() => setActivePopover(null)}
                className="flex gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-gray-50"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                  <Bell className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-body-sm font-semibold text-gray-900">참석 요청 도착</span>
                  <span className="mt-0.5 block text-body-sm text-gray-500">수율 개선 회의 참석 여부를 확인해주세요.</span>
                </span>
              </Link>
            </div>
          </div>
        )}

        {activePopover === 'profile' && (
          <div className="absolute right-0 top-11 w-[280px] rounded-[12px] border border-gray-200 bg-white p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-info text-white">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-title font-semibold text-gray-900">최서연</h2>
                <p className="text-body-sm text-gray-500">공정기술팀 · 파트장</p>
              </div>
            </div>
            <div className="mt-4 rounded-[8px] border border-gray-200 bg-gray-50 p-3">
              <p className="text-body-sm font-semibold text-gray-900">캘린더 공유</p>
              <p className="mt-1 text-body-sm leading-relaxed text-gray-500">
                상세 일정은 공개하지 않고, 회의 조율에 필요한 가능 여부만 공유합니다.
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-body-sm">
              <div className="rounded-[8px] bg-gray-50 p-3">
                <p className="text-gray-500">업무 시작</p>
                <p className="mt-1 font-semibold text-gray-900">09:00</p>
              </div>
              <div className="rounded-[8px] bg-gray-50 p-3">
                <p className="text-gray-500">업무 종료</p>
                <p className="mt-1 font-semibold text-gray-900">18:00</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
