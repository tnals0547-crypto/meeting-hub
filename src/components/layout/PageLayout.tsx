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
      <div className="flex w-full max-w-7xl flex-1 flex-col px-6 py-6 mx-auto gap-6">
        <div className="min-w-0">{children}</div>
      </div>
    )
  }

  if (hideSidebar) {
    return (
      <div className="flex w-full max-w-7xl flex-1 flex-col px-6 py-6 mx-auto gap-6 lg:grid lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">{children}</div>
        {right && <div className="lg:sticky lg:top-6 lg:self-start">{right}</div>}
      </div>
    )
  }

  if (hideRight) {
    return (
      <div className="flex w-full max-w-7xl flex-1 flex-col px-6 py-6 mx-auto gap-6 lg:grid lg:grid-cols-[220px_1fr]">
        {sidebar && <div>{sidebar}</div>}
        <div className="min-w-0">{children}</div>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-7xl flex-1 flex-col px-6 py-6 mx-auto gap-6 lg:grid lg:grid-cols-[220px_1fr_320px]">
      {sidebar && <div>{sidebar}</div>}
      <div className="min-w-0">{children}</div>
      {right && <div className="lg:sticky lg:top-6 lg:self-start">{right}</div>}
    </div>
  )
}
