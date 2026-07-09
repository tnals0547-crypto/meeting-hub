'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import MailContent from '@/components/MailContent'
import type { Folder } from '@/components/MailContent'

function HomePage() {
  const searchParams = useSearchParams()
  const folder = (searchParams.get('folder') as Folder) ?? undefined

  return <MailContent initialFolder={folder} />
}

export default function Home() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  )
}
