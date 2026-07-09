'use client'

import { useState } from 'react'
import SideNav from './SideNav'
import Workspace from './Workspace'
import MobileBottomNav from './MobileBottomNav'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false)

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <SideNav onWorkspaceToggle={() => setWorkspaceOpen((v) => !v)} />

      <main className="flex min-w-0 flex-1 flex-col pb-16 lg:ml-[72px] lg:pb-0">
        {children}
      </main>

      <Workspace isOpen={workspaceOpen} onClose={() => setWorkspaceOpen(false)} />

      <MobileBottomNav />
    </div>
  )
}
