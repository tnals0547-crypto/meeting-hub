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
  if (meeting.status === 'completed') return '기록 보기'
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
  if (meeting.status === 'confirmed' || meeting.status === 'completed') return false
  if (meeting.myRole === 'participant') {
    return meeting.status === 'pending' || meeting.status === 'response_collecting'
  }
  return meeting.status === 'response_complete' || meeting.status === 'response_collecting'
}

function formatShortDate(dateString: string) {
  const date = new Date(dateString + (dateString.includes('T') ? '' : 'T00:00:00'))
  return date.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  })
}

function getScheduleLabel(meeting: Meeting) {
  if (meeting.confirmedTimeSlot) {
    return `${formatShortDate(meeting.confirmedTimeSlot.date)} ${meeting.confirmedTimeSlot.startTime}`
  }

  return formatShortDate(meeting.createdAt)
}

export default function MeetingTable({
  meetings,
  selectedId,
  onSelect,
}: MeetingTableProps) {
  return (
    <div className="overflow-hidden bg-white">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-subtle">
            <th className="w-1" />
            <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-600">회의명</th>
            <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-600">내 역할</th>
            <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-600">상태</th>
            <th className="px-4 py-3 text-right text-body-sm font-medium text-gray-600">다음 행동</th>
          </tr>
        </thead>
        <tbody>
          {meetings.map((meeting) => {
            const isSelected = meeting.id === selectedId
            const urgent = needsAction(meeting)
            const responded = meeting.participants.filter((p) => p.responseStatus !== 'pending').length
            const total = meeting.participants.length
            const scheduleLabel = getScheduleLabel(meeting)

            return (
              <tr
                key={meeting.id}
                onClick={() => onSelect(meeting.id)}
                className={`cursor-pointer border-b border-gray-50 transition-colors last:border-b-0 hover:bg-gray-50 ${
                  isSelected ? 'bg-gray-50/70' : ''
                }`}
              >
                <td className="w-1 p-0">
                  <div className={`w-1 h-full min-h-[52px] ${
                    isSelected ? 'bg-info' : urgent ? 'bg-warning' : 'bg-transparent'
                  }`} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-title font-medium text-gray-900">{meeting.title}</span>
                    <span className="text-body-sm text-gray-500 mt-0.5">
                      {responded}/{total} 응답 · {scheduleLabel}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium ${
                    meeting.myRole === 'organizer'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {meeting.myRole === 'organizer' ? '주최자' : '참석자'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={meeting.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 text-body-sm font-medium text-gray-900">
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
