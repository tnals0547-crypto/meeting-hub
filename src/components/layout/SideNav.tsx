'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Mail,
  CalendarDays,
  ClipboardList,
  MessageSquare,
  Plus,
  PanelLeft,
  CircleUserRound,
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: Mail, label: '메일', href: '/' },
  { icon: CalendarDays, label: '캘린더', href: '/calendar' },
  { icon: ClipboardList, label: '회의', href: '/meetings' },
  { icon: MessageSquare, label: '채팅', href: '/chat' },
]

export default function SideNav({
  onWorkspaceToggle,
}: {
  onWorkspaceToggle: () => void
}) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/meetings') return pathname.startsWith('/meetings')
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed left-0 top-0 z-50 hidden h-full w-[72px] flex-col items-center border-r border-gray-200 bg-white py-4 lg:flex">
      <Link
        href="/"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold tracking-tight text-gray-900 transition-colors hover:bg-gray-100"
        title="Relay"
      >
        R
      </Link>

      <div className="mt-3 h-px w-6 bg-gray-200" />

      <Link
        href="/meetings/new"
        className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white transition-colors hover:bg-brand-600"
        title="새 회의"
      >
        <Plus className="h-5 w-5" />
      </Link>

      <div className="mt-3 h-px w-6 bg-gray-200" />

      <div className="mt-4 flex flex-col items-center gap-1.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
              isActive(item.href)
                ? 'bg-brand-50 text-gray-900'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
          </Link>
        ))}
      </div>

      <div className="flex-1" />

      <button
        onClick={onWorkspaceToggle}
        className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        title="Workspace"
      >
        <PanelLeft className="h-5 w-5" />
      </button>

      <button
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-500 transition-colors hover:bg-gray-300"
        title="내 프로필"
      >
        <CircleUserRound className="h-5 w-5" />
      </button>
    </nav>
  )
}
