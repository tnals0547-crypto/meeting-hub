'use client'

import Link from 'next/link'
import { Plus, Bell, Search, CircleUserRound } from 'lucide-react'

export default function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-5">
      <div className="flex min-w-0 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-title font-bold tracking-tight text-white">
            R
          </span>
          <span className="text-title font-bold text-gray-900">Relay</span>
        </Link>

        <div className="hidden md:relative md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="메일, 회의, 참석자 검색"
            className="h-9 w-[320px] rounded-[8px] border border-gray-200 bg-gray-50 pl-9 pr-3 text-body-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-300 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/meetings/new"
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-gray-200 bg-white px-4 py-2 text-body-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">새 회의</span>
        </Link>

        <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <Bell className="h-5 w-5" />
        </button>

        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-500 transition-colors hover:bg-gray-300">
          <CircleUserRound className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
