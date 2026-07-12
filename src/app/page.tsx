'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import MailContent from '@/components/MailContent'
import type { Folder } from '@/components/MailContent'

function HomePage() {
  const searchParams = useSearchParams()
  const folder = (searchParams.get('folder') as Folder) ?? undefined
  const query = searchParams.get('q') ?? ''
  const mailId = searchParams.get('mail') ?? undefined

  return <MailContent initialFolder={folder} initialMailId={mailId} searchQuery={query} />
}

export default function Home() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  )
}
