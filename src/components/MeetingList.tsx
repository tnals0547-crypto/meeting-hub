'use client'

import { useEffect, useState } from 'react'
import type { Meeting } from '@/types/meeting'
import MeetingCard from '@/components/MeetingCard'

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
  const [dynamicMeetings, setDynamicMeetings] = useState<Meeting[]>([])

  useEffect(() => {
    const meetings: Meeting[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('meeting-') && key !== 'newMeetingForm') {
        try {
          const data = JSON.parse(sessionStorage.getItem(key)!)
          if (!data.myRole) data.myRole = 'organizer'
          meetings.push(data)
        } catch {
          /* ignore parse errors */
        }
      }
    }
    setDynamicMeetings(meetings)
  }, [])

  const dynamicIds = new Set(dynamicMeetings.map((m) => m.id))

  const allMeetings = [...dynamicMeetings, ...initialMeetings].sort((a, b) => {
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
