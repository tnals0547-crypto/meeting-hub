'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Mail,
  CalendarDays,
  ClipboardList,
  MessageSquare,
} from 'lucide-react'

const TABS = [
  { icon: Mail, label: '메일', href: '/' },
  { icon: CalendarDays, label: '캘린더', href: '/calendar' },
  { icon: ClipboardList, label: '회의', href: '/meetings' },
  { icon: MessageSquare, label: '채팅', href: '/chat' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/meetings') return pathname.startsWith('/meetings')
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex h-14 w-full items-center justify-around border-t border-gray-200 bg-white lg:hidden">
      {TABS.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
           className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
            isActive(tab.href)
              ? 'text-brand-500'
              : 'text-gray-400'
          }`}
        >
          <tab.icon className="h-5 w-5" />
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}
