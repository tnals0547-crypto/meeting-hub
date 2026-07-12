'use client'

import { useEffect } from 'react'
import type { Meeting } from '@/types/meeting'
import { writeStoredMeeting } from '@/lib/meetingStore'
import { writeStoredMailState } from '@/lib/mailStore'

export default function StoreMeetingSnapshot({
  meeting,
  mailId,
}: {
  meeting: Meeting
  mailId?: string
}) {
  useEffect(() => {
    writeStoredMeeting(meeting)
    if (mailId) {
      writeStoredMailState(mailId, { isRead: true, actionState: 'processed' })
    }
  }, [mailId, meeting])

  return null
}
