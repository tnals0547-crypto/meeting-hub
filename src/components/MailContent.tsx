'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Mail, CalendarDays, Users, Clock, CheckCircle, XCircle, HelpCircle, AlertCircle, FileText } from 'lucide-react'
import { meetings } from '@/data/mock'
import type { ResponseStatus, Meeting } from '@/types/meeting'

type MailType =
  | 'replacement_needed'
  | 'response_update'
  | 'meeting_request'
  | 'meeting_confirmed'
  | 'regular'

const mailStageLabel: Record<MailType, string | null> = {
  meeting_request: '참석 요청',
  response_update: '응답 확인',
  replacement_needed: '대체 참석 조율',
  meeting_confirmed: '확정 완료',
  regular: null,
}

interface MailItem {
  id: string
  type: MailType
  priority: number
  from: string
  fromOrg?: string
  title: string
  preview: string
  meetingId: string
  receivedAt: string
  isRead: boolean
  hasAttachment?: boolean
}

const priorityOrder: Record<MailType, number> = {
  replacement_needed: 0,
  response_update: 1,
  meeting_request: 2,
  meeting_confirmed: 3,
  regular: 4,
}

const mailTypeLabel: Record<MailType, string> = {
  replacement_needed: '대체 참석 조율',
  response_update: '응답 확인',
  meeting_request: '참석 요청',
  meeting_confirmed: '확정 완료',
  regular: '',
}

const mailItems: MailItem[] = [
  {
    id: 'mail-2',
    type: 'replacement_needed',
    priority: priorityOrder.replacement_needed,
    from: '최리더',
    fromOrg: '공정 기술 · 공정 리드',
    title: 'Q2 회고 대체 참석자 선택 안내',
    preview: 'Q2 회고 회의에서 필수 참석자가 불참 의사를 밝혔습니다. 대체 참석자를 선택해주세요.',
    meetingId: 'meeting-3',
    receivedAt: '2026-07-08T09:30:00',
    isRead: false,
    hasAttachment: false,
  },
  {
    id: 'mail-3',
    type: 'response_update',
    priority: priorityOrder.response_update,
    from: '박공정',
    fromOrg: '공정 기술 · 기술원',
    title: '공정 변경 검토 회의 응답 현황',
    preview: '공정 변경 검토 회의 참석자 응답이 업데이트되었습니다. 3명 승인, 1명 불참, 1명 미응답입니다.',
    meetingId: 'meeting-2',
    receivedAt: '2026-07-08T08:15:00',
    isRead: false,
    hasAttachment: false,
  },
  {
    id: 'mail-1',
    type: 'meeting_request',
    priority: priorityOrder.meeting_request,
    from: '김철수',
    fromOrg: '설비 기술 · 엔지니어',
    title: '수율 개선 회의 참석 요청',
    preview: '설비 수율 개선 회의 참석을 요청드립니다. 일정 확인 후 응답 부탁드립니다.',
    meetingId: 'meeting-1',
    receivedAt: '2026-07-07T16:30:00',
    isRead: false,
    hasAttachment: true,
  },
  {
    id: 'mail-4',
    type: 'meeting_request',
    priority: priorityOrder.meeting_request,
    from: '이영희',
    fromOrg: '공정 기술 · 기술원',
    title: '생산 계획 회의 참석 요청',
    preview: '다음 주 생산 계획 회의에 참석해주세요. 일정 확인 후 응답 부탁드립니다.',
    meetingId: 'meeting-1',
    receivedAt: '2026-07-06T14:00:00',
    isRead: true,
    hasAttachment: false,
  },
  {
    id: 'mail-5',
    type: 'meeting_confirmed',
    priority: priorityOrder.meeting_confirmed,
    from: '정서연',
    fromOrg: '생산 관리 · 책임',
    title: '주간 생산 미팅 확정 안내',
    preview: '주간 생산 미팅이 7월 10일 금요일 오전 10시, 회의실 A에서 진행됩니다.',
    meetingId: 'meeting-1',
    receivedAt: '2026-07-04T10:00:00',
    isRead: true,
    hasAttachment: false,
  },
  {
    id: 'mail-6',
    type: 'regular',
    priority: priorityOrder.regular,
    from: '인사팀',
    title: '7월 급여 명세서 안내',
    preview: '7월 급여 명세서가 확인 가능합니다. 내부 시스템에서 확인해주세요.',
    meetingId: '',
    receivedAt: '2026-07-07T10:00:00',
    isRead: false,
    hasAttachment: true,
  },
  {
    id: 'mail-8',
    type: 'regular',
    priority: priorityOrder.regular,
    from: 'IT운영팀',
    title: '사내 시스템 정기 점검 안내 (7/11)',
    preview: '7월 11일(토) 02:00~06:00까지 주요 시스템 정기 점검이 진행됩니다.',
    meetingId: '',
    receivedAt: '2026-07-05T11:00:00',
    isRead: true,
    hasAttachment: false,
  },
  {
    id: 'mail-9',
    type: 'regular',
    priority: priorityOrder.regular,
    from: '인재개발팀',
    title: '7월 사내 교육 일정 안내',
    preview: '7월 사내 교육 프로그램이 개설되었습니다. 리더십 교육, 커뮤니케이션 스킬 등 다양한 과정을 확인해보세요.',
    meetingId: '',
    receivedAt: '2026-07-04T09:00:00',
    isRead: true,
    hasAttachment: true,
  },
  {
    id: 'mail-10',
    type: 'regular',
    priority: priorityOrder.regular,
    from: '복리후생팀',
    title: '하계 복리후생 프로그램 안내',
    preview: '여름철 복리후생 프로그램을 안내드립니다. 휴양 시설 이용, 건강검진, 자기계발비 지원 등을 신청할 수 있습니다.',
    meetingId: '',
    receivedAt: '2026-07-03T15:00:00',
    isRead: true,
    hasAttachment: true,
  },
  {
    id: 'mail-7',
    type: 'regular',
    priority: priorityOrder.regular,
    from: '경영지원팀',
    title: '보안 정책 변경 사전 안내',
    preview: '내부 정보 보안 정책이 일부 변경될 예정입니다. 변경 사항을 사전에 안내드리오니 확인 후 의견이 있을 경우 회신 부탁드립니다.',
    meetingId: '',
    receivedAt: '2026-07-03T11:00:00',
    isRead: true,
    hasAttachment: false,
  },
]

const typeStyles: Record<MailType, string> = {
  replacement_needed: 'bg-purple-50 text-purple-700 border border-purple-200',
  response_update: 'bg-amber-50 text-amber-700 border border-amber-200',
  meeting_request: 'bg-blue-50 text-blue-700 border border-blue-200',
  meeting_confirmed: 'bg-green-50 text-green-700 border border-green-200',
  regular: 'bg-gray-50 text-gray-400 border border-gray-200',
}

export type Folder = 'all' | 'action_needed' | 'meeting_request' | 'replacement_needed' | 'regular'

const folders: { key: Folder; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'action_needed', label: '확인 필요' },
  { key: 'meeting_request', label: '참석 요청' },
  { key: 'replacement_needed', label: '대체 참석 요청' },
  { key: 'regular', label: '일반 알림' },
]

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '방금 전'
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  const d = date
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function responseStatusPill(status: ResponseStatus) {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'declined':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'pending':
      return <HelpCircle className="h-4 w-4 text-amber-400" />
  }
}

function getMailMeeting(mail: MailItem): Meeting | undefined {
  return mail.meetingId ? meetings.find((m) => m.id === mail.meetingId) : undefined
}

function MeetingMailRow({
  item,
  isSelected,
  onSelect,
}: {
  item: MailItem
  isSelected: boolean
  onSelect: () => void
}) {
  const meeting = getMailMeeting(item)

  return (
    <button
      onClick={onSelect}
      className={`group flex w-full items-stretch border-b border-gray-100 text-left transition-all duration-100 ${
        isSelected ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
      }`}
    >
      {isSelected && <div className="w-0.5 shrink-0 bg-brand-500" />}
      <div className="flex flex-1 items-start gap-3 px-5 py-3.5 min-w-0">
        <div className="flex shrink-0 flex-col items-center pt-1.5" style={{ width: 12 }}>
          {!item.isRead ? (
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          ) : (
            <span className="h-2 w-2 rounded-full border border-gray-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`truncate ${!item.isRead ? 'text-title font-semibold text-gray-900' : 'text-title font-medium text-gray-900'}`}>
              {item.from}
            </span>
            <span className={`inline-flex shrink-0 items-center h-5 rounded-full px-1.5 text-2xs font-medium ${typeStyles[item.type]}`}>
              {mailTypeLabel[item.type]}
            </span>
            <span className="ml-auto shrink-0 text-caption text-gray-400 tabular-nums">
              {formatRelativeDate(item.receivedAt)}
            </span>
          </div>
          <p className={`truncate mt-0.5 ${!item.isRead ? 'text-title font-semibold text-gray-900' : 'text-title text-gray-900'}`}>
            {item.title}
          </p>
          <p className="truncate mt-0.5 text-body-sm text-gray-500">{item.preview}</p>
          <div className="mt-2 flex items-center gap-1.5">
            {!item.isRead && (
              <span className="inline-flex items-center h-5 rounded-full px-1.5 text-2xs font-medium bg-red-50 text-red-600 border border-red-200">
                확인 필요
              </span>
            )}
            {meeting && (
              <span className="inline-flex items-center gap-1 text-2xs text-gray-400 ml-auto">
                <Users className="h-3 w-3" />
                {meeting.participants.filter((p) => p.responseStatus !== 'pending').length}/{meeting.participants.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

function RegularMailRow({
  item,
  isSelected,
  onSelect,
}: {
  item: MailItem
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`group flex w-full items-stretch border-b border-gray-50 text-left transition-all duration-100 ${
        isSelected ? 'bg-gray-50/60' : 'bg-white hover:bg-gray-50/30'
      }`}
    >
      <div className="flex flex-1 items-start gap-3 px-5 py-2 min-w-0 pl-6">
        <span className="shrink-0 pt-0.5">
          <FileText className="h-3.5 w-3.5 text-gray-300" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-body-sm text-gray-500">{item.from}</span>
            <span className="ml-auto shrink-0 text-2xs text-gray-400 tabular-nums">
              {formatRelativeDate(item.receivedAt)}
            </span>
          </div>
          <p className="truncate text-body-sm text-gray-500">{item.title}</p>
        </div>
      </div>
    </button>
  )
}

function MeetingDetailContent({ mail, meeting }: { mail: MailItem; meeting: Meeting }) {
  const participantSummary = useMemo(() => {
    const approved = meeting.participants.filter((p) => p.responseStatus === 'approved').length
    const declined = meeting.participants.filter((p) => p.responseStatus === 'declined').length
    const pending = meeting.participants.filter((p) => p.responseStatus === 'pending').length
    return { approved, declined, pending, total: meeting.participants.length }
  }, [meeting])

  const roleLabel = meeting.myRole === 'organizer' ? '주최자' : '참석자'

  const ctaConfig: Record<MailType, { text: string; href: string; description: string } | null> = {
    meeting_request: {
      text: '참석 요청 응답',
      href: '#',
      description: '참석 여부를 선택해주세요.',
    },
    replacement_needed: {
      text: '대체 참석자 확인',
      href: `/meetings/${mail.meetingId}/replacement`,
      description: '필수 참석자가 불참했습니다. 대체 참석자를 선택해주세요.',
    },
    response_update: {
      text: '응답 현황 보기',
      href: `/meetings/${mail.meetingId}`,
      description: `${participantSummary.pending}명이 아직 응답하지 않았습니다.`,
    },
    meeting_confirmed: {
      text: '확정 일정 확인',
      href: `/meetings/${mail.meetingId}`,
      description: '회의가 확정되었습니다. 일정을 확인해주세요.',
    },
    regular: null,
  }

  const cta = ctaConfig[mail.type]
  const stageLabel = mailStageLabel[mail.type]

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="border-b border-gray-100 px-6 py-5 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex h-6 items-center rounded-full px-2 text-caption font-medium ${typeStyles[mail.type]}`}>
            {mailTypeLabel[mail.type]}
          </span>
          {stageLabel && (
            <span className="text-caption font-medium text-gray-400">{stageLabel}</span>
          )}
        </div>
        <h2 className="mt-4 max-w-3xl text-heading-s font-semibold text-gray-900">{mail.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-body-sm text-gray-500">
          <span className="font-medium text-gray-700">{mail.from}</span>
          {mail.fromOrg && (
            <>
              <span>·</span>
              <span>{mail.fromOrg}</span>
            </>
          )}
          <span>·</span>
          <span>{formatRelativeDate(mail.receivedAt)}</span>
        </div>
      </div>

      <div className="grid gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
        <article className="min-w-0">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-base leading-7 text-gray-800">{mail.preview}</p>
          </div>

          {meeting.participants.length > 0 && (
            <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-title font-semibold text-gray-900">참석자 목록</h4>
                <span className="text-caption text-gray-500">{meeting.participants.length}명</span>
              </div>
              <div className="mt-3 divide-y divide-gray-100">
                {meeting.participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-body-sm font-medium text-gray-900">{p.name}</span>
                        {p.isRequired && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-red-50 px-1 py-0.5 text-2xs font-medium text-red-600">
                            <AlertCircle className="h-3 w-3" />필수
                          </span>
                        )}
                      </div>
                      <p className="truncate text-caption text-gray-500">{p.department} · {p.role}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {responseStatusPill(p.responseStatus)}
                      <span className="text-caption text-gray-500">
                        {p.responseStatus === 'approved' ? '승인' : p.responseStatus === 'declined' ? '불참' : '미응답'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h4 className="text-title font-semibold text-gray-900">회의 정보</h4>
            <div className="mt-3 space-y-3 text-body-sm text-gray-700">
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 text-gray-400" />
                <span>{meeting.organizerName} · {meeting.participants.length}명 참석</span>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 text-gray-400" />
                <span>{meeting.location || '장소 미정'}</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 text-gray-400" />
                <span>{meeting.confirmedTimeSlot
                  ? `${meeting.confirmedTimeSlot.date} ${meeting.confirmedTimeSlot.startTime}~${meeting.confirmedTimeSlot.endTime}`
                  : '일정 조정 중'}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h4 className="text-title font-semibold text-gray-900">참석자 응답</h4>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <span className="inline-flex items-center justify-center gap-1 rounded-md bg-green-50 px-2 py-2 text-caption font-medium text-green-700">
                <CheckCircle className="h-3.5 w-3.5" />{participantSummary.approved}
              </span>
              <span className="inline-flex items-center justify-center gap-1 rounded-md bg-red-50 px-2 py-2 text-caption font-medium text-red-700">
                <XCircle className="h-3.5 w-3.5" />{participantSummary.declined}
              </span>
              <span className="inline-flex items-center justify-center gap-1 rounded-md bg-amber-50 px-2 py-2 text-caption font-medium text-amber-700">
                <HelpCircle className="h-3.5 w-3.5" />{participantSummary.pending}
              </span>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h4 className="text-title font-semibold text-gray-900">내 역할</h4>
            <span className={`mt-3 inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${
              meeting.myRole === 'organizer' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {roleLabel}
            </span>
          </section>

          {cta && (
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <h4 className="text-title font-semibold text-gray-900">다음 행동</h4>
              <p className="mt-2 text-body-sm leading-relaxed text-gray-600">{cta.description}</p>
              <Link
                href={cta.href}
                className="mt-4 inline-flex w-full items-center justify-between rounded-[8px] bg-brand-500 px-4 py-2.5 text-body-sm font-medium text-white transition-colors hover:bg-brand-600"
              >
                <span>{cta.text}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

function RegularDetailContent({ mail }: { mail: MailItem }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="border-b border-gray-100 px-6 py-5 lg:px-8">
        <span className={`inline-flex h-6 items-center rounded-full px-2 text-caption font-medium ${typeStyles.regular}`}>업무 메일</span>
        <h2 className="mt-4 max-w-3xl text-heading-s font-semibold text-gray-900">{mail.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-body-sm text-gray-500">
          <span className="font-medium text-gray-700">{mail.from}</span>
          <span>·</span>
          <span>{formatRelativeDate(mail.receivedAt)}</span>
        </div>
      </div>
      <div className="px-6 py-6 lg:px-8">
        <article className="max-w-3xl rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="text-base leading-7 text-gray-800">{mail.preview}</p>
        </article>
      </div>
    </div>
  )
}

function EmptyStateDetail({ mailItems }: { mailItems: MailItem[] }) {
  const tasks = useMemo(() => {
    const responseNeeded = mailItems.filter(
      (m) => (m.type === 'meeting_request') && !m.isRead,
    ).length
    const replacementNeeded = mailItems.filter(
      (m) => m.type === 'replacement_needed' && !m.isRead,
    ).length
    const organizerCheckNeeded = mailItems.filter(
      (m) => m.type === 'response_update' && !m.isRead,
    ).length
    return { responseNeeded, replacementNeeded, organizerCheckNeeded }
  }, [mailItems])

  const total = tasks.responseNeeded + tasks.replacementNeeded + tasks.organizerCheckNeeded

  if (total === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <Mail className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-title font-semibold text-gray-900">모든 메일을 확인했습니다</h3>
        <p className="mt-2 text-body-sm text-gray-500 leading-relaxed">
          새로운 메일이 도착하면 여기에 표시됩니다.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col px-8 py-10">
      <h3 className="text-title font-semibold text-gray-900">오늘 처리할 메일</h3>
      <p className="mt-1 text-body-sm text-gray-500">메일을 선택하면 상세 내용을 확인할 수 있습니다.</p>
      <div className="mt-5 space-y-2">
        {tasks.responseNeeded > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-l-4 border-gray-200 border-l-info bg-white px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <HelpCircle className="h-4 w-4 text-blue-600" />
            </span>
            <div>
              <p className="text-body-sm font-medium text-gray-900">내 응답 필요</p>
              <p className="text-caption text-gray-500">{tasks.responseNeeded}건의 참석 요청에 응답이 필요합니다.</p>
            </div>
          </div>
        )}
        {tasks.replacementNeeded > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-l-4 border-gray-200 border-l-status-replacement bg-white px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <Users className="h-4 w-4 text-purple-600" />
            </span>
            <div>
              <p className="text-body-sm font-medium text-gray-900">대체 참석 요청</p>
              <p className="text-caption text-gray-500">{tasks.replacementNeeded}건의 대체 참석자 확인이 필요합니다.</p>
            </div>
          </div>
        )}
        {tasks.organizerCheckNeeded > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-l-4 border-gray-200 border-l-warning bg-white px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </span>
            <div>
              <p className="text-body-sm font-medium text-gray-900">주최자 확인 필요</p>
              <p className="text-caption text-gray-500">{tasks.organizerCheckNeeded}건의 응답 현황 확인이 필요합니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MailContent({ initialFolder }: { initialFolder?: Folder }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeFolder, setActiveFolder] = useState<Folder>(initialFolder ?? 'all')

  useEffect(() => {
    if (initialFolder) setActiveFolder(initialFolder)
  }, [initialFolder])

  const meetingMails = useMemo(() => mailItems.filter((m) => m.type !== 'regular').sort((a, b) => a.priority - b.priority), [])
  const regularMails = useMemo(() => mailItems.filter((m) => m.type === 'regular'), [])

  const filtered = useMemo(() => {
    let items = [...mailItems]
    if (activeFolder === 'action_needed') items = items.filter((m) => m.type !== 'regular' && !m.isRead)
    if (activeFolder === 'meeting_request') items = items.filter((m) => m.type === 'meeting_request')
    if (activeFolder === 'replacement_needed') items = items.filter((m) => m.type === 'replacement_needed')
    if (activeFolder === 'regular') items = items.filter((m) => m.type === 'regular')
    items.sort((a, b) => a.priority - b.priority)
    return items
  }, [activeFolder])

  const selected = useMemo(
    () => (selectedId ? mailItems.find((m) => m.id === selectedId) ?? null : null),
    [selectedId],
  )
  const hasSelected = selected !== null

  const actionNeededCount = useMemo(() => meetingMails.filter((m) => !m.isRead).length, [meetingMails])

  function countByType(type: MailType) {
    return mailItems.filter((m) => m.type === type).length
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50 lg:flex-row">
      {/* Mobile */}
      <div className="flex flex-col gap-4 px-5 py-5 lg:hidden">
        <h1 className="text-heading-s font-semibold text-gray-900">받은 편지함</h1>
        <div className="flex gap-2 overflow-x-auto">
          {folders.map((folder) => {
            const isActive = activeFolder === folder.key
            const count =
              folder.key === 'action_needed' ? actionNeededCount
              : folder.key === 'regular' ? regularMails.length
              : folder.key === 'meeting_request' ? countByType('meeting_request')
              : folder.key === 'replacement_needed' ? countByType('replacement_needed')
              : mailItems.length
            return (
              <button
                key={folder.key}
                onClick={() => { setActiveFolder(folder.key); setSelectedId(null) }}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-caption font-medium transition-colors ${
                  isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {folder.label} {count > 0 ? count : ''}
              </button>
            )
          })}
        </div>
        {filtered.map((item) => {
          const isMeeting = item.type !== 'regular'
          return (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${
                selectedId === item.id ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white'
              } ${isMeeting && !item.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
            >
              <div className="flex items-center gap-2">
                {!item.isRead && isMeeting && <span className="inline-block h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                {isMeeting ? (
                  <span className={`inline-flex h-5 items-center rounded-full px-1.5 text-2xs font-medium ${typeStyles[item.type]}`}>
                    {mailTypeLabel[item.type]}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-2xs text-gray-400">
                    <FileText className="h-3 w-3" />일반
                  </span>
                )}
                <span className="ml-auto shrink-0 text-2xs text-gray-400">{formatRelativeDate(item.receivedAt)}</span>
              </div>
              <p className={`mt-1 text-title truncate ${!item.isRead && isMeeting ? 'font-semibold text-gray-900' : 'text-gray-900'}`}>
                {item.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-body-sm text-gray-500">{item.preview}</p>
              {isMeeting && (() => {
                const meeting = getMailMeeting(item)
                if (!meeting) return null
                const approved = meeting.participants.filter((p) => p.responseStatus === 'approved').length
                const declined = meeting.participants.filter((p) => p.responseStatus === 'declined').length
                const pending = meeting.participants.filter((p) => p.responseStatus === 'pending').length
                return (
                  <div className="mt-2 flex gap-1.5">
                    <span className="inline-flex items-center gap-0.5 rounded bg-green-50 px-1.5 py-0.5 text-2xs text-green-700">
                      <CheckCircle className="h-3 w-3" />{approved}
                    </span>
                    {declined > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-red-50 px-1.5 py-0.5 text-2xs text-red-700">
                        <XCircle className="h-3 w-3" />{declined}
                      </span>
                    )}
                    {pending > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-2xs text-amber-700">
                        <HelpCircle className="h-3 w-3" />{pending}
                      </span>
                    )}
                  </div>
                )
              })()}
            </button>
          )
        })}
        {selected && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <DetailContent mail={selected} />
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className={`hidden min-w-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200 lg:flex ${
        hasSelected ? 'w-[360px] shrink-0' : 'flex-1'
      }`}>
        <div className="border-b border-gray-200 px-5 py-4">
          <h1 className="text-heading-s font-semibold text-gray-900">받은 편지함</h1>
          <p className="mt-0.5 text-caption text-gray-400">
            총 {mailItems.length}개 · 확인 필요 {actionNeededCount}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              if (item.type === 'regular') {
                return (
                  <RegularMailRow
                    key={item.id}
                    item={item}
                    isSelected={item.id === selectedId}
                    onSelect={() => setSelectedId(item.id)}
                  />
                )
              }
              return (
                <MeetingMailRow
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedId}
                  onSelect={() => setSelectedId(item.id)}
                />
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <p className="text-body-sm text-gray-500">조건에 맞는 항목이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Detail column */}
      <aside className={`hidden flex-col border-l border-gray-200 bg-white transition-[width] duration-200 lg:flex ${
        hasSelected ? 'min-w-0 flex-1' : 'w-[420px] shrink-0'
      }`}>
        {selected ? (
          <DetailContent mail={selected} />
        ) : (
          <EmptyStateDetail mailItems={mailItems} />
        )}
      </aside>
    </div>
  )
}

function DetailContent({ mail }: { mail: MailItem }) {
  const meeting = getMailMeeting(mail)
  if (mail.type !== 'regular' && meeting) {
    return <MeetingDetailContent mail={mail} meeting={meeting} />
  }
  return <RegularDetailContent mail={mail} />
}
