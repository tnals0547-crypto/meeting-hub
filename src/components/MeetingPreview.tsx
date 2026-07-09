'use client'

import type { Meeting } from '@/types/meeting'
import StatusBadge from '@/components/common/StatusBadge'
import Button from '@/components/common/Button'
import ProgressStepper from '@/components/ProgressStepper'
import ParticipantList from '@/components/ParticipantList'
import { ArrowRight, Users, CheckCircle, XCircle, HelpCircle, Calendar, MapPin, FileText, Mic, Video } from 'lucide-react'

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

function formatTimeSlot(meeting: Meeting) {
  if (!meeting.confirmedTimeSlot) return '확정 시간 없음'
  return `${meeting.confirmedTimeSlot.date} ${meeting.confirmedTimeSlot.startTime}~${meeting.confirmedTimeSlot.endTime}`
}

export default function MeetingPreview({ meeting }: MeetingPreviewProps) {
  const approved = meeting.participants.filter((p) => p.responseStatus === 'approved').length
  const declined = meeting.participants.filter((p) => p.responseStatus === 'declined').length
  const pending = meeting.participants.filter((p) => p.responseStatus === 'pending').length
  const total = meeting.participants.length
  const hasDeclinedRequired = meeting.participants.some(
    (p) => p.isRequired && p.responseStatus === 'declined',
  )
  const records = meeting.records

  if (meeting.status === 'completed') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-title font-semibold text-gray-900 truncate">{meeting.title}</h3>
          <StatusBadge status={meeting.status} />
        </div>

        <dl className="mt-3 space-y-1.5 text-body-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <dd>{meeting.organizerName} · 참석자 {total}명</dd>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <dd>{formatTimeSlot(meeting)}</dd>
          </div>
          {meeting.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <dd>{meeting.location}</dd>
            </div>
          )}
        </dl>

        <section className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <h4 className="text-title font-semibold text-gray-900">회의록</h4>
          </div>
          <ul className="mt-3 space-y-2">
            {(records?.minutes ?? ['회의록이 정리 중입니다.']).map((minute) => (
              <li key={minute} className="flex gap-2 text-body-sm leading-relaxed text-gray-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                <span>{minute}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="text-title font-semibold text-gray-900">기록 파일</h4>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <Mic className="h-4 w-4 shrink-0 text-gray-400" />
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-medium text-gray-900">{records?.recording.title ?? '녹음 기록'}</p>
                  <p className="text-caption text-gray-500">{records?.recording.duration ?? '-'} · {records?.recording.status === 'processing' ? '처리 중' : '확인 가능'}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-2xs font-medium text-gray-600">녹음 기록</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <Video className="h-4 w-4 shrink-0 text-gray-400" />
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-medium text-gray-900">{records?.video.title ?? '화상회의 녹화'}</p>
                  <p className="text-caption text-gray-500">{records?.video.duration ?? '-'} · {records?.video.status === 'processing' ? '처리 중' : '확인 가능'}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-2xs font-medium text-gray-600">영상</span>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="text-title font-semibold text-gray-900">참석자</h4>
          <div className="mt-3">
            <ParticipantList participants={meeting.participants} />
          </div>
        </section>

        <div className="mt-4">
          <Button href={`/meetings/${meeting.id}`} variant="secondary" className="w-full justify-between">
            <span>전체 기록 열기</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    )
  }

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
          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-body-sm font-medium text-gray-700">
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
          <div className="h-full rounded-full bg-gray-700 transition-all" style={{ width: `${(approved / total) * 100}%` }} />
          {declined > 0 && <div className="h-full rounded-full bg-gray-400 transition-all" style={{ width: `${(declined / total) * 100}%` }} />}
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
        <div className="mt-3 rounded-lg border border-l-4 border-gray-200 border-l-warning bg-gray-50 p-3">
          <p className="text-caption font-medium text-gray-700">
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
