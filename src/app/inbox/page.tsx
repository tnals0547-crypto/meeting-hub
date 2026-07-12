'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Meeting } from '@/types/meeting'
import { meetings as mockMeetings } from '@/data/mock'
import StatusBadge from '@/components/common/StatusBadge'

function getPendingRequests() {
  const all: Meeting[] = [...mockMeetings]

  if (typeof window !== 'undefined') {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('meeting-') && key !== 'newMeetingForm') {
        try {
          const data = JSON.parse(sessionStorage.getItem(key)!)
          if (!data.myRole) data.myRole = 'organizer'
          all.push(data)
        } catch {
          /* ignore */
        }
      }
    }
  }

  return all.filter(
    (m) => m.myRole === 'participant' && m.participants.some((p) => p.responseStatus === 'pending'),
  )
}

export default function InboxPage() {
  const requests = getPendingRequests()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-6">
      <h1 className="text-heading-s font-semibold text-gray-900">Inbox</h1>
      <p className="mt-1 text-body-sm text-gray-600">참석 요청을 받은 회의를 확인하고 응답하세요.</p>

      {requests.length === 0 ? (
        <div className="mt-12 flex flex-col items-center">
          <p className="text-body-sm text-gray-600">새로운 참석 요청이 없습니다.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {requests.map((meeting) => {
            const myParticipant = meeting.participants.find(
              (p) => p.responseStatus === 'pending',
            )
            return (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-title font-semibold text-gray-900">{meeting.title}</h3>
                    <StatusBadge status={meeting.status} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-title text-gray-600">{meeting.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-caption text-gray-600">
                    <span>{meeting.organizerName} · 주최</span>
                    <span>참석자 {meeting.participants.length}명</span>
                    {myParticipant && (
                      <span className="inline-flex h-6 items-center rounded-full bg-warning-bg px-2 text-caption font-medium text-warning">
                        응답 대기 중
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="ml-4 h-5 w-5 shrink-0 text-gray-300" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
