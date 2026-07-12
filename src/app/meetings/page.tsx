'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { meetings } from '@/data/mock'
import HomeContent from '@/components/HomeContent'

function MeetingsPageContent() {
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter') ?? undefined
  const query = searchParams.get('q') ?? ''

  return <HomeContent meetings={meetings} initialFilter={filter} searchQuery={query} />
}

export default function MeetingsPage() {
  return (
    <Suspense>
      <MeetingsPageContent />
    </Suspense>
  )
}
