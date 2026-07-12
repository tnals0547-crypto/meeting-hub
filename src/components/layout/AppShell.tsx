'use client'

import { Suspense } from 'react'
import TopBar from './TopBar'
import SideNav from './SideNav'
import LNB from './LNB'
import MobileBottomNav from './MobileBottomNav'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-full flex-col bg-gray-50">
      <Suspense fallback={<div className="h-14 shrink-0 border-b border-gray-200 bg-white" />}>
        <TopBar />
      </Suspense>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SideNav />
        <Suspense fallback={null}>
          <LNB />
        </Suspense>

        <main className="flex min-w-0 flex-1 flex-col overflow-auto bg-gray-50 pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  )
}
