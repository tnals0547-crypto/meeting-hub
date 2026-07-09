'use client'

interface PageLayoutProps {
  sidebar?: React.ReactNode
  children: React.ReactNode
  right?: React.ReactNode
  hideSidebar?: boolean
  hideRight?: boolean
}

export default function PageLayout({
  sidebar,
  children,
  right,
  hideSidebar = false,
  hideRight = false,
}: PageLayoutProps) {
  if (hideSidebar && hideRight) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 p-5">
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    )
  }

  if (hideSidebar) {
    return (
      <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">{children}</div>
        {right && <aside className="hidden min-w-0 lg:sticky lg:top-5 lg:block lg:self-start">{right}</aside>}
      </div>
    )
  }

  if (hideRight) {
    return (
      <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-4 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        {sidebar && <aside className="min-w-0">{sidebar}</aside>}
        <div className="min-w-0">{children}</div>
      </div>
    )
  }

  return (
    <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-4 p-5 lg:grid-cols-[260px_minmax(0,1fr)_340px]">
      {sidebar && <aside className="min-w-0">{sidebar}</aside>}
      <div className="min-w-0">{children}</div>
      {right && <aside className="hidden min-w-0 lg:sticky lg:top-5 lg:block lg:self-start">{right}</aside>}
    </div>
  )
}
