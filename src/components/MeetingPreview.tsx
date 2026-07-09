'use client'

import type { Meeting } from '@/types/meeting'
import StatusBadge from '@/components/common/StatusBadge'
import Button from '@/components/common/Button'
import ProgressStepper from '@/components/ProgressStepper'
import ParticipantList from '@/components/ParticipantList'
import { ArrowRight, Users, CheckCircle, XCircle, HelpCircle, Calendar, MapPin } from 'lucide-react'

interface MeetingPreviewProps {
  meeting: Meeting
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export default function MeetingPreview({ meeting }: MeetingPreviewProps) {
  const approved = meeting.participants.filter((p) => p.responseStatus === 'approved').length
  const declined = meeting.participants.filter((p) => p.responseStatus === 'declined').length
  const pending = meeting.participants.filter((p) => p.responseStatus === 'pending').length
  const total = meeting.participants.length
  const hasDeclinedRequired = meeting.participants.some(
    (p) => p.isRequired && p.responseStatus === 'declined',
  )

  if (meeting.myRole === 'participant') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-title font-semibold text-gray-900 truncate">{meeting.title}</h3>
          <StatusBadge status={meeting.status} />
        </div>

        <dl className="mt-3 space-y-1.5 text-body-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <dd>{meeting.organizerName} · {total}명</dd>
          </div>
          {meeting.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <dd>{meeting.location}</dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <dd>{formatDate(meeting.createdAt)}</dd>
          </div>
        </dl>

        {(meeting.status === 'pending' || meeting.status === 'response_collecting') && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <p className="text-body-sm font-medium text-gray-700">참석 여부를 선택해주세요</p>
            <div className="mt-3 flex gap-2">
              <Button variant="primary" className="flex-1 gap-1.5">
                <CheckCircle className="h-4 w-4" />
                <span>참석</span>
              </Button>
              <Button variant="secondary" className="flex-1 gap-1.5">
                <XCircle className="h-4 w-4" />
                <span>불참</span>
              </Button>
            </div>
          </div>
        )}

        {meeting.status === 'response_complete' && (
          <div className="mt-4 rounded-lg bg-green-50 p-4">
            <p className="text-body-sm font-medium text-green-700">
              응답이 완료되었습니다. 주최자의 확정을 기다려주세요.
            </p>
          </div>
        )}

        {meeting.status === 'confirmed' && (
          <div className="mt-4">
            <Button href={`/meetings/${meeting.id}`} variant="primary" className="w-full justify-between">
              <span>확정 정보 보기</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        <div className="mt-4">
          <ProgressStepper status={meeting.status} myRole="participant" />
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-caption text-gray-500 mb-2">응답 현황</p>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-caption font-medium text-green-700">
              <CheckCircle className="h-3.5 w-3.5" />{approved}
            </span>
            {declined > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-caption font-medium text-red-700">
                <XCircle className="h-3.5 w-3.5" />{declined}
              </span>
            )}
            {pending > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-caption font-medium text-gray-600">
                <HelpCircle className="h-3.5 w-3.5" />{pending}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  const actionConfig: Record<string, { text: string; href: string }> = {
    pending: { text: '참석 요청 보내기', href: `/meetings/${meeting.id}` },
    response_collecting: { text: '응답 확인하기', href: `/meetings/${meeting.id}` },
    response_complete: {
      text: hasDeclinedRequired ? '대체 참석자 선택' : '회의 확정하기',
      href: hasDeclinedRequired ? `/meetings/${meeting.id}/replacement` : `/meetings/${meeting.id}`,
    },
    confirmed: { text: '확정 정보 보기', href: `/meetings/${meeting.id}` },
  }

  const action = actionConfig[meeting.status] ?? { text: '확인하기', href: `/meetings/${meeting.id}` }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-title font-semibold text-gray-900 truncate">{meeting.title}</h3>
        <StatusBadge status={meeting.status} />
      </div>

      <div className="mt-3">
        <p className="text-caption text-gray-500 mb-2">응답 현황</p>
        <div className="flex gap-0.5 overflow-hidden rounded-full h-2">
          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(approved / total) * 100}%` }} />
          {declined > 0 && <div className="h-full rounded-full bg-red-300 transition-all" style={{ width: `${(declined / total) * 100}%` }} />}
          {pending > 0 && <div className="h-full rounded-full bg-gray-200 transition-all" style={{ width: `${(pending / total) * 100}%` }} />}
        </div>
        <div className="mt-1.5 flex gap-3">
          <span className="inline-flex items-center gap-1 text-caption text-green-600">
            <CheckCircle className="h-3.5 w-3.5" />{approved} 승인
          </span>
          {declined > 0 && (
            <span className="inline-flex items-center gap-1 text-caption text-red-500">
              <XCircle className="h-3.5 w-3.5" />{declined} 불참
            </span>
          )}
          {pending > 0 && (
            <span className="inline-flex items-center gap-1 text-caption text-gray-400">
              <HelpCircle className="h-3.5 w-3.5" />{pending} 미응답
            </span>
          )}
        </div>
      </div>

      {hasDeclinedRequired && meeting.status === 'response_complete' && (
        <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
          <p className="text-caption font-medium text-amber-800">
            필수 참석자가 불참했습니다. 대체 참석자를 선택해주세요.
          </p>
        </div>
      )}

      <div className="mt-4">
        <ParticipantList participants={meeting.participants} />
      </div>

      <div className="mt-4">
        <ProgressStepper status={meeting.status} myRole="organizer" />
      </div>

      <div className="mt-4">
        <Button href={action.href} variant="primary" className="w-full justify-between">
          <span>{action.text}</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
