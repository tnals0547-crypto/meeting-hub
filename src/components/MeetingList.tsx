'use client'

import { useMemo, useSyncExternalStore } from 'react'
import type { Meeting } from '@/types/meeting'
import MeetingCard from '@/components/MeetingCard'
import {
  getStoredMeetingsServerSnapshot,
  getStoredMeetingsSnapshot,
  mergeMeetings,
  subscribeStoredMeetings,
} from '@/lib/meetingStore'

interface MeetingListProps {
  initialMeetings: Meeting[]
}

const statusPriority: Record<string, number> = {
  response_complete: 0,
  response_collecting: 1,
  pending: 2,
  confirmed: 3,
}

export default function MeetingList({ initialMeetings }: MeetingListProps) {
  const dynamicMeetings = useSyncExternalStore(
    subscribeStoredMeetings,
    getStoredMeetingsSnapshot,
    getStoredMeetingsServerSnapshot,
  )

  const dynamicIds = useMemo(() => new Set(dynamicMeetings.map((m) => m.id)), [dynamicMeetings])

  const allMeetings = mergeMeetings(initialMeetings, dynamicMeetings).sort((a, b) => {
    const aDynamic = dynamicIds.has(a.id)
    const bDynamic = dynamicIds.has(b.id)
    if (aDynamic && !bDynamic) return -1
    if (!aDynamic && bDynamic) return 1
    return (statusPriority[a.status] ?? 9) - (statusPriority[b.status] ?? 9)
  })

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
      {allMeetings.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          ctaOverride={
            dynamicIds.has(meeting.id)
              ? { label: '응답 현황 보기', href: `/meetings/${meeting.id}?source=new` }
              : undefined
          }
        />
      ))}
    </div>
  )
}
