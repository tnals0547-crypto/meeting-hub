'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mail, CalendarDays, ClipboardList, MessageSquare } from 'lucide-react'

const NAV_ITEMS = [
  { icon: Mail, label: 'Mail', href: '/' },
  { icon: CalendarDays, label: 'Calendar', href: '/calendar' },
  { icon: ClipboardList, label: 'Meetings', href: '/meetings' },
  { icon: MessageSquare, label: 'Chat', href: '/chat' },
]

export default function SideNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/meetings') return pathname.startsWith('/meetings')
    return pathname.startsWith(href)
  }

  return (
    <nav className="hidden w-[72px] shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col lg:items-center">
      <div className="flex w-full flex-col items-center gap-3 py-4">
        <Link href="/" className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold tracking-tight text-white">
            R
        </Link>

        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              isActive(item.href)
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {isActive(item.href) && (
              <span className="absolute left-[-17px] top-2 h-6 w-0.5 rounded-full bg-brand-500" />
            )}
            <item.icon className="h-5 w-5 shrink-0" />
          </Link>
        ))}
      </div>
    </nav>
  )
}
