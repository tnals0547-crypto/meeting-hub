'use client'

import { useState, useMemo, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Mail, CalendarDays, Users, Clock, CheckCircle, XCircle, HelpCircle, AlertCircle, FileText } from 'lucide-react'
import { meetings } from '@/data/mock'
import type { ResponseStatus, Meeting } from '@/types/meeting'
import { getMeetingSearchParts, matchesSearch, normalizeSearchQuery } from '@/lib/search'
import {
  getStoredMailStatesServerSnapshot,
  getStoredMailStatesSnapshot,
  mergeStoredMailStates,
  subscribeStoredMailStates,
  writeStoredMailState,
} from '@/lib/mailStore'
import type { MailActionState } from '@/lib/mailStore'

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
  actionState?: MailActionState
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

const mailActionLabel: Record<MailActionState, string> = {
  pending: '',
  response_waiting: '응답대기',
  processed: '처리됨',
}

const mailItems: MailItem[] = [
  {
    id: 'mail-2',
    type: 'replacement_needed',
    priority: priorityOrder.replacement_needed,
    from: '정서연',
    fromOrg: '생산 관리 · 책임',
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
    from: '이지은',
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
    from: '김민수',
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
    from: '이지은',
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
  replacement_needed: 'bg-status-replacement-bg text-status-replacement border border-status-replacement/15',
  response_update: 'bg-warning-bg text-warning border border-warning/15',
  meeting_request: 'bg-info-bg text-info border border-info/15',
  meeting_confirmed: 'bg-success-bg text-success border border-success/15',
  regular: 'bg-gray-50 text-gray-400 border border-gray-200',
}

const actionStateStyles: Record<MailActionState, string> = {
  pending: '',
  response_waiting: 'bg-info-bg text-info border border-info/15',
  processed: 'bg-gray-100 text-gray-600 border border-gray-200',
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
      return <CheckCircle className="h-4 w-4 text-success" />
    case 'declined':
      return <XCircle className="h-4 w-4 text-danger" />
    case 'pending':
      return <HelpCircle className="h-4 w-4 text-warning" />
  }
}

function getMailMeeting(mail: MailItem): Meeting | undefined {
  return mail.meetingId ? meetings.find((m) => m.id === mail.meetingId) : undefined
}

function getMailActionState(mail: MailItem): MailActionState {
  if (mail.type === 'regular') return 'processed'
  return mail.actionState ?? 'pending'
}

function isActionPending(mail: MailItem) {
  return mail.type !== 'regular' && mail.type !== 'meeting_confirmed' && getMailActionState(mail) === 'pending'
}

function mailBadgeLabel(mail: MailItem) {
  const state = getMailActionState(mail)
  return state === 'pending' ? mailTypeLabel[mail.type] : mailActionLabel[state]
}

function mailBadgeClassName(mail: MailItem) {
  const state = getMailActionState(mail)
  return state === 'pending' ? typeStyles[mail.type] : actionStateStyles[state]
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
      {isSelected && <div className="w-0.5 shrink-0 bg-info" />}
      <div className="flex flex-1 items-start gap-3 px-5 py-3.5 min-w-0">
        <div className="flex shrink-0 flex-col items-center pt-1.5" style={{ width: 12 }}>
          {!item.isRead ? (
            <span className="h-2 w-2 rounded-full bg-info" />
          ) : (
            <span className="h-2 w-2 rounded-full border border-gray-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`truncate ${!item.isRead ? 'text-title font-semibold text-gray-900' : 'text-title font-medium text-gray-900'}`}>
              {item.from}
            </span>
            <span className={`inline-flex h-6 shrink-0 items-center rounded-full px-2 text-caption font-medium ${mailBadgeClassName(item)}`}>
              {mailBadgeLabel(item)}
            </span>
            <span className="ml-auto shrink-0 text-body-sm text-gray-400 tabular-nums">
              {formatRelativeDate(item.receivedAt)}
            </span>
          </div>
          <p className={`truncate mt-0.5 ${!item.isRead ? 'text-title font-semibold text-gray-900' : 'text-title text-gray-900'}`}>
            {item.title}
          </p>
          <p className="truncate mt-0.5 text-body-sm text-gray-500">{item.preview}</p>
          <div className="mt-2 flex items-center gap-1.5">
            {isActionPending(item) && (
              <span className="inline-flex h-6 items-center rounded-full border border-warning/15 bg-warning-bg px-2 text-caption font-medium text-warning">
                확인 필요
              </span>
            )}
            {meeting && (
              <span className="inline-flex items-center gap-1 text-body-sm text-gray-400 ml-auto">
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
            <span className="ml-auto shrink-0 text-body-sm text-gray-400 tabular-nums">
              {formatRelativeDate(item.receivedAt)}
            </span>
          </div>
          <p className="truncate text-body-sm text-gray-500">{item.title}</p>
        </div>
      </div>
    </button>
  )
}

function MeetingDetailContent({
  mail,
  meeting,
  onBack,
  returnTo,
  showBack = true,
}: {
  mail: MailItem
  meeting: Meeting
  onBack: () => void
  returnTo: string
  showBack?: boolean
}) {
  const participantSummary = useMemo(() => {
    const approved = meeting.participants.filter((p) => p.responseStatus === 'approved').length
    const declined = meeting.participants.filter((p) => p.responseStatus === 'declined').length
    const pending = meeting.participants.filter((p) => p.responseStatus === 'pending').length
    return { approved, declined, pending, total: meeting.participants.length }
  }, [meeting])

  const roleLabel = mail.type === 'response_update'
    ? '응답 확인'
    : mail.type === 'meeting_request' ? '참석자'
    : meeting.myRole === 'organizer' ? '주최자' : '참석자'
  const encodedReturnTo = encodeURIComponent(returnTo)

  const ctaConfig: Record<MailType, { text: string; href: string; description: string } | null> = {
    meeting_request: {
      text: '참석 요청 응답',
      href: `/meetings/${mail.meetingId}?view=respond&mail=${mail.id}&returnTo=${encodedReturnTo}`,
      description: '참석 여부를 선택해주세요.',
    },
    replacement_needed: {
      text: '대체 참석자 확인',
      href: `/meetings/${mail.meetingId}/replacement?mail=${mail.id}&returnTo=${encodedReturnTo}`,
      description: '필수 참석자가 불참했습니다. 대체 참석자를 선택해주세요.',
    },
    response_update: {
      text: '응답 현황 보기',
      href: `/meetings/${mail.meetingId}?view=response-status&mail=${mail.id}&returnTo=${encodedReturnTo}`,
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
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1.5 text-body-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            받은 편지함
          </button>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex h-6 items-center rounded-full px-2 text-caption font-medium ${typeStyles[mail.type]}`}>
            {mailTypeLabel[mail.type]}
          </span>
          {stageLabel && (
            <span className="text-body-sm font-medium text-gray-400">{stageLabel}</span>
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
                <span className="text-body-sm text-gray-500">{meeting.participants.length}명</span>
              </div>
              <div className="mt-3 divide-y divide-gray-100">
                {meeting.participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-body-sm font-medium text-gray-900">{p.name}</span>
                        {p.isRequired && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-danger-bg px-1 py-0.5 text-caption font-medium text-danger">
                            <AlertCircle className="h-3 w-3" />필수
                          </span>
                        )}
                      </div>
                      <p className="truncate text-body-sm text-gray-500">{p.department} · {p.role}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {responseStatusPill(p.responseStatus)}
                      <span className="text-body-sm text-gray-500">
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
              <span className="inline-flex items-center justify-center gap-1 rounded-md bg-success-bg px-2 py-2 text-caption font-medium text-success">
                <CheckCircle className="h-3.5 w-3.5" />{participantSummary.approved}
              </span>
              <span className="inline-flex items-center justify-center gap-1 rounded-md bg-danger-bg px-2 py-2 text-caption font-medium text-danger">
                <XCircle className="h-3.5 w-3.5" />{participantSummary.declined}
              </span>
              <span className="inline-flex items-center justify-center gap-1 rounded-md bg-warning-bg px-2 py-2 text-caption font-medium text-warning">
                <HelpCircle className="h-3.5 w-3.5" />{participantSummary.pending}
              </span>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h4 className="text-title font-semibold text-gray-900">내 역할</h4>
            <span className="mt-3 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-caption font-medium text-gray-700">
              {roleLabel}
            </span>
          </section>

          {cta && (
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <h4 className="text-title font-semibold text-gray-900">다음 행동</h4>
              <p className="mt-2 text-body-sm leading-relaxed text-gray-600">{cta.description}</p>
              <Link
                href={cta.href}
                className="mt-4 inline-flex w-full items-center justify-between rounded-[8px] bg-info px-4 py-2.5 text-body-sm font-medium text-white transition-opacity hover:opacity-90"
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

function RegularDetailContent({
  mail,
  onBack,
  showBack = true,
}: {
  mail: MailItem
  onBack: () => void
  showBack?: boolean
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="border-b border-gray-100 px-6 py-5 lg:px-8">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1.5 text-body-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            받은 편지함
          </button>
        )}
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

function EmptyStateDetail({
  mailItems,
  onSelectMail,
}: {
  mailItems: MailItem[]
  onSelectMail: (mailId: string) => void
}) {
  const tasks = useMemo(() => {
    const responseNeeded = mailItems.filter((m) => m.type === 'meeting_request' && isActionPending(m))
    const replacementNeeded = mailItems.filter((m) => m.type === 'replacement_needed' && isActionPending(m))
    const organizerCheckNeeded = mailItems.filter((m) => m.type === 'response_update' && isActionPending(m))
    return { responseNeeded, replacementNeeded, organizerCheckNeeded }
  }, [mailItems])

  const total = tasks.responseNeeded.length + tasks.replacementNeeded.length + tasks.organizerCheckNeeded.length

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
        {tasks.responseNeeded.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectMail(tasks.responseNeeded[0].id)}
            className="group flex w-full items-center gap-3 rounded-lg border border-l-4 border-gray-200 border-l-info bg-white px-4 py-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-info/20"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <HelpCircle className="h-4 w-4 text-info" />
            </span>
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-gray-900">내 응답 필요</p>
              <p className="text-body-sm text-gray-500">{tasks.responseNeeded.length}건의 참석 요청에 응답이 필요합니다.</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-600" />
          </button>
        )}
        {tasks.replacementNeeded.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectMail(tasks.replacementNeeded[0].id)}
            className="group flex w-full items-center gap-3 rounded-lg border border-l-4 border-gray-200 border-l-status-replacement bg-white px-4 py-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-status-replacement/20"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <Users className="h-4 w-4 text-status-replacement" />
            </span>
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-gray-900">대체 참석 요청</p>
              <p className="text-body-sm text-gray-500">{tasks.replacementNeeded.length}건의 대체 참석자 확인이 필요합니다.</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-600" />
          </button>
        )}
        {tasks.organizerCheckNeeded.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectMail(tasks.organizerCheckNeeded[0].id)}
            className="group flex w-full items-center gap-3 rounded-lg border border-l-4 border-gray-200 border-l-warning bg-white px-4 py-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-warning/20"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <AlertCircle className="h-4 w-4 text-warning" />
            </span>
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-gray-900">주최자 확인 필요</p>
              <p className="text-body-sm text-gray-500">{tasks.organizerCheckNeeded.length}건의 응답 현황 확인이 필요합니다.</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-600" />
          </button>
        )}
      </div>
    </div>
  )
}

function getMailSearchParts(mail: MailItem) {
  const meeting = getMailMeeting(mail)
  return [
    mail.from,
    mail.fromOrg,
    mail.title,
    mail.preview,
    mailTypeLabel[mail.type],
    mailStageLabel[mail.type],
    ...(meeting ? getMeetingSearchParts(meeting) : []),
  ]
}

function MailContentInner({
  initialFolder,
  initialMailId,
  searchQuery = '',
}: {
  initialFolder?: Folder
  initialMailId?: string
  searchQuery?: string
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialMailId ?? null)
  const [activeFolder, setActiveFolder] = useState<Folder>(initialFolder ?? 'all')
  const storedMailStates = useSyncExternalStore(
    subscribeStoredMailStates,
    getStoredMailStatesSnapshot,
    getStoredMailStatesServerSnapshot,
  )
  const mailList = useMemo(() => mergeStoredMailStates(mailItems, storedMailStates), [storedMailStates])
  const normalizedSearchQuery = normalizeSearchQuery(searchQuery)
  const hasSearchQuery = Boolean(normalizedSearchQuery)

  const meetingMails = useMemo(() => mailList.filter((m) => m.type !== 'regular').sort((a, b) => a.priority - b.priority), [mailList])
  const regularMails = useMemo(() => mailList.filter((m) => m.type === 'regular'), [mailList])

  const filtered = useMemo(() => {
    let items = [...mailList]
    if (activeFolder === 'action_needed') items = items.filter((m) => isActionPending(m))
    if (activeFolder === 'meeting_request') items = items.filter((m) => m.type === 'meeting_request' && isActionPending(m))
    if (activeFolder === 'replacement_needed') items = items.filter((m) => m.type === 'replacement_needed' && isActionPending(m))
    if (activeFolder === 'regular') items = items.filter((m) => m.type === 'regular')
    items = items.filter((mail) => matchesSearch(getMailSearchParts(mail), searchQuery))
    items.sort((a, b) => a.priority - b.priority)
    return items
  }, [activeFolder, mailList, searchQuery])

  const selected = useMemo(
    () => (selectedId ? filtered.find((m) => m.id === selectedId) ?? null : null),
    [filtered, selectedId],
  )
  const hasSelected = selected !== null

  const actionNeededCount = useMemo(() => meetingMails.filter((m) => isActionPending(m)).length, [meetingMails])

  function selectMail(mailId: string | null) {
    setSelectedId(mailId)
    if (!mailId) return
    const mail = mailList.find((item) => item.id === mailId)
    if (!mail || mail.isRead) return
    writeStoredMailState(mailId, { isRead: true })
  }

  function countByType(type: MailType) {
    return mailList.filter((m) => m.type === type && (type === 'regular' || isActionPending(m))).length
  }

  function getMailReturnPath(mailId: string) {
    const params = new URLSearchParams()
    if (activeFolder !== 'all') params.set('folder', activeFolder)
    if (searchQuery) params.set('q', searchQuery)
    params.set('mail', mailId)
    const query = params.toString()
    return query ? `/?${query}` : '/'
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
              : mailList.length
            return (
              <button
                key={folder.key}
                onClick={() => { setActiveFolder(folder.key); selectMail(null) }}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-body-sm font-medium transition-colors ${
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
              onClick={() => selectMail(item.id === selectedId ? null : item.id)}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${
                selectedId === item.id ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white'
              } ${isMeeting && !item.isRead ? 'border-l-4 border-l-info' : ''}`}
            >
              <div className="flex items-center gap-2">
                {!item.isRead && isMeeting && <span className="inline-block h-2 w-2 rounded-full bg-info shrink-0" />}
                {isMeeting ? (
                  <span className={`inline-flex h-6 items-center rounded-full px-2 text-caption font-medium ${mailBadgeClassName(item)}`}>
                    {mailBadgeLabel(item)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-body-sm text-gray-400">
                    <FileText className="h-3 w-3" />일반
                  </span>
                )}
                <span className="ml-auto shrink-0 text-body-sm text-gray-400">{formatRelativeDate(item.receivedAt)}</span>
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
                    <span className="inline-flex items-center gap-0.5 rounded bg-success-bg px-1.5 py-0.5 text-caption text-success">
                      <CheckCircle className="h-3 w-3" />{approved}
                    </span>
                    {declined > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-danger-bg px-1.5 py-0.5 text-caption text-danger">
                        <XCircle className="h-3 w-3" />{declined}
                      </span>
                    )}
                    {pending > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-warning-bg px-1.5 py-0.5 text-caption text-warning">
                        <HelpCircle className="h-3 w-3" />{pending}
                      </span>
                    )}
                  </div>
                )
              })()}
            </button>
          )
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white px-5 py-12 text-center">
            <Mail className="h-8 w-8 text-gray-300" />
            <p className="mt-3 text-title font-semibold text-gray-900">검색 결과가 없습니다</p>
            <p className="mt-1 text-body-sm text-gray-500">
              {hasSearchQuery ? `"${searchQuery}"에 맞는 메일을 찾지 못했습니다.` : '조건에 맞는 항목이 없습니다.'}
            </p>
          </div>
        )}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end bg-gray-900/35 lg:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              aria-label="메일 상세 닫기"
              onClick={() => setSelectedId(null)}
              className="absolute inset-0"
            />
            <div className="relative flex h-[88dvh] max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-t-[16px] bg-white shadow-2xl">
              <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-200" />
              <div className="min-h-0 flex-1 overflow-y-auto">
                <DetailContent mail={selected} onBack={() => selectMail(null)} returnTo={getMailReturnPath(selected.id)} showBack={false} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className={`hidden min-w-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200 lg:flex ${
        hasSelected ? 'w-[360px] shrink-0' : 'flex-1'
      }`}>
        <div className="border-b border-gray-200 px-5 py-4">
          <h1 className="text-heading-s font-semibold text-gray-900">받은 편지함</h1>
          <p className="mt-0.5 text-body-sm text-gray-400">
            총 {mailList.length}개 · 확인 필요 {actionNeededCount}
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
                    onSelect={() => selectMail(item.id)}
                  />
                )
              }
              return (
                <MeetingMailRow
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedId}
                  onSelect={() => selectMail(item.id)}
                />
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <Mail className="mb-3 h-8 w-8 text-gray-300" />
              <p className="text-title font-semibold text-gray-900">
                {hasSearchQuery ? '검색 결과가 없습니다' : '조건에 맞는 항목이 없습니다'}
              </p>
              <p className="mt-1 text-body-sm text-gray-500">
                {hasSearchQuery ? `"${searchQuery}"에 맞는 메일을 찾지 못했습니다.` : '다른 필터를 선택해보세요.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Detail column */}
      <aside className={`hidden flex-col border-l border-gray-200 bg-white transition-[width] duration-200 lg:flex ${
        hasSelected ? 'min-w-0 flex-1' : 'w-[420px] shrink-0'
      }`}>
        {selected ? (
          <DetailContent mail={selected} onBack={() => selectMail(null)} returnTo={getMailReturnPath(selected.id)} />
        ) : (
          <EmptyStateDetail mailItems={mailList} onSelectMail={selectMail} />
        )}
      </aside>
    </div>
  )
}

export default function MailContent({
  initialFolder,
  initialMailId,
  searchQuery,
}: {
  initialFolder?: Folder
  initialMailId?: string
  searchQuery?: string
}) {
  return (
    <MailContentInner
      key={`${initialFolder ?? 'all'}-${initialMailId ?? 'none'}`}
      initialFolder={initialFolder}
      initialMailId={initialMailId}
      searchQuery={searchQuery}
    />
  )
}

function DetailContent({
  mail,
  onBack,
  returnTo,
  showBack = true,
}: {
  mail: MailItem
  onBack: () => void
  returnTo: string
  showBack?: boolean
}) {
  const meeting = getMailMeeting(mail)
  if (mail.type !== 'regular' && meeting) {
    return <MeetingDetailContent mail={mail} meeting={meeting} onBack={onBack} returnTo={returnTo} showBack={showBack} />
  }
  return <RegularDetailContent mail={mail} onBack={onBack} showBack={showBack} />
}
