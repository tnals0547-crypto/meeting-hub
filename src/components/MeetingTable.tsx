'use client'

import type { Meeting } from '@/types/meeting'
import StatusBadge from '@/components/common/StatusBadge'
import { ArrowRight } from 'lucide-react'

interface MeetingTableProps {
  meetings: Meeting[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function getActionLabel(meeting: Meeting): string {
  if (meeting.myRole === 'participant') {
    if (meeting.status === 'pending' || meeting.status === 'response_collecting') return '응답하기'
    if (meeting.status === 'confirmed') return '정보 보기'
    return '확인하기'
  }
  switch (meeting.status) {
    case 'pending': return '참석 요청 보내기'
    case 'response_collecting': return '응답 확인하기'
    case 'response_complete': return '대체 참석자 선택'
    case 'confirmed': return '정보 보기'
    default: return '확인하기'
  }
}

function needsAction(meeting: Meeting): boolean {
  if (meeting.status === 'confirmed') return false
  if (meeting.myRole === 'participant') {
    return meeting.status === 'pending' || meeting.status === 'response_collecting'
  }
  return meeting.status === 'response_complete' || meeting.status === 'response_collecting'
}

function formatShortDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  })
}

export default function MeetingTable({
  meetings,
  selectedId,
  onSelect,
}: MeetingTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-subtle">
            <th className="w-1" />
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">회의명</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">내 역할</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">상태</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">다음 행동</th>
          </tr>
        </thead>
        <tbody>
          {meetings.map((meeting) => {
            const isSelected = meeting.id === selectedId
            const urgent = needsAction(meeting)
            const responded = meeting.participants.filter((p) => p.responseStatus !== 'pending').length
            const total = meeting.participants.length

            return (
              <tr
                key={meeting.id}
                onClick={() => onSelect(meeting.id)}
                className={`cursor-pointer border-b border-gray-50 transition-colors last:border-b-0 hover:bg-gray-50 ${
                  isSelected ? 'bg-brand-50/40' : ''
                }`}
              >
                <td className="w-1 p-0">
                  <div className={`w-1 h-full min-h-[52px] ${urgent ? 'bg-brand-500' : 'bg-transparent'}`} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col">
                    <span className="text-title font-medium text-gray-900">{meeting.title}</span>
                    <span className="text-caption text-gray-500 mt-0.5">
                      {responded}/{total} 응답 · {formatShortDate(meeting.createdAt)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${
                    meeting.myRole === 'organizer'
                      ? 'bg-brand-50 text-brand-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {meeting.myRole === 'organizer' ? '주최자' : '참석자'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={meeting.status} />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="inline-flex items-center gap-1 text-title font-medium text-gray-900">
                    {getActionLabel(meeting)}
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
