'use client'

import { Suspense, useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, X, MapPin, Clock, CheckCircle, XCircle, HelpCircle, CalendarDays, Repeat } from 'lucide-react'
import { mockScheduleDates, teamMembers } from '@/data/mock'
import { generateTimeSlots, sortSlots } from '@/data/availability'
import { getCalendarBaseDate } from '@/lib/date'
import { matchesSearch, normalizeSearchQuery } from '@/lib/search'
import type { TeamMember, MeetingDuration } from '@/types/meeting'
import Button from '@/components/common/Button'
import MemberSelector from '@/components/MemberSelector'

type EventType = 'meeting' | 'focus' | 'external' | 'vacation' | 'personal'
type CalendarFilter = EventType | 'all'

interface CalendarEvent {
  id: string
  type: EventType
  title: string
  date: string
  startTime: string
  endTime: string
  location?: string
  description?: string
  isRecurring?: boolean
  myStatus?: 'available' | 'busy' | 'focus' | 'absent'
  meetingId?: string
}

interface MeetingEvent extends CalendarEvent {
  isMeeting: true
  requiredMembers: TeamMember[]
  optionalMembers: TeamMember[]
  duration: MeetingDuration
  customDurationMinutes?: number
  candidateStartDate: string
  candidateEndDate: string
  participantResponses: { name: string; status: string }[]
}

function isMeetingEvent(event: CalendarEvent | MeetingEvent | null | undefined): event is MeetingEvent {
  return Boolean(event && 'isMeeting' in event && event.isMeeting)
}

const WEEKDAY_NAMES = ['월', '화', '수', '목', '금', '토', '일']
const EVENT_TYPE_LABEL: Record<EventType, string> = {
  meeting: '회의',
  focus: '집중 업무',
  external: '외부 일정',
  vacation: '휴가/부재',
  personal: '개인 일정',
}

const FILTER_LABEL: Record<CalendarFilter, string> = {
  all: '전체 일정',
  meeting: '회의',
  focus: '집중 업무',
  external: '외부 일정',
  vacation: '부재',
  personal: '개인 일정',
}

const FILTER_TITLE: Record<CalendarFilter, string> = {
  all: '전체 일정',
  meeting: '회의 일정',
  focus: '집중 업무',
  external: '외부 일정',
  vacation: '부재 일정',
  personal: '개인 일정',
}

const typeDot: Record<EventType, string> = {
  meeting: 'bg-info',
  focus: 'bg-success',
  external: 'bg-warning',
  vacation: 'bg-danger',
  personal: 'bg-status-replacement',
}

const typeBg: Record<EventType, string> = {
  meeting: 'bg-gray-50 border-l-info',
  focus: 'bg-gray-50 border-l-success',
  external: 'bg-gray-50 border-l-warning',
  vacation: 'bg-gray-50 border-l-danger',
  personal: 'bg-gray-50 border-l-status-replacement',
}

const HOURS = Array.from({ length: 9 }, (_, i) => i + 9)
const GRID_HOUR_HEIGHT = 64
const DRAG_SNAP_MINUTES = 15
const DAY_START_MINUTES = 9 * 60
const DAY_END_MINUTES = 18 * 60
const DAY_COLUMN_HEIGHT = ((DAY_END_MINUTES - DAY_START_MINUTES) / 60) * GRID_HOUR_HEIGHT

interface DragState {
  eventId: string
  date: string
  currentDate: string
  startX: number
  startY: number
  originStart: number
  originEnd: number
  currentStart: number
  hasMoved: boolean
}

interface ResizeState {
  eventId: string
  startY: number
  originStart: number
  originEnd: number
  currentEnd: number
}

function formatDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getTodayStr() {
  const d = new Date()
  return formatDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function getWeekDays(baseDate: Date) {
  const day = baseDate.getDay()
  const monOffset = day === 0 ? -6 : 1 - day
  const mon = new Date(baseDate)
  mon.setDate(baseDate.getDate() + monOffset)
  const days: { date: Date; dateStr: string; dayName: string; dayNum: number; isToday: boolean }[] = []
  const todayStr = getTodayStr()
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    const ds = formatDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate())
    days.push({
      date: d,
      dateStr: ds,
      dayName: WEEKDAY_NAMES[i],
      dayNum: d.getDate(),
      isToday: ds === todayStr,
    })
  }
  return days
}

function formatTimeDisplay(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatEventTime(startTime: string, endTime: string) {
  return `${startTime.slice(0, 5)} ~ ${endTime.slice(0, 5)}`
}

function eventDurationMinutes(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function roundToStep(minutes: number) {
  return Math.round(minutes / DRAG_SNAP_MINUTES) * DRAG_SNAP_MINUTES
}

function clampEventStart(start: number, duration: number) {
  return Math.min(Math.max(start, DAY_START_MINUTES), DAY_END_MINUTES - duration)
}

function eventOverlapsSlot(event: CalendarEvent, date: string, startTime: string, endTime: string) {
  if (event.date !== date) return false
  return timeToMinutes(startTime) < timeToMinutes(event.endTime) && timeToMinutes(endTime) > timeToMinutes(event.startTime)
}

function getEventSearchParts(event: CalendarEvent | MeetingEvent) {
  return [
    event.title,
    EVENT_TYPE_LABEL[event.type],
    event.location,
    event.description,
    event.date,
    event.startTime,
    event.endTime,
    event.myStatus,
    ...(isMeetingEvent(event)
      ? [
          ...event.requiredMembers.flatMap((member) => [member.name, member.department, member.role]),
          ...event.optionalMembers.flatMap((member) => [member.name, member.department, member.role]),
          ...event.participantResponses.flatMap((response) => [response.name, response.status]),
        ]
      : []),
  ]
}

function getDisplayInterval(event: CalendarEvent, dragState: DragState | null, resizeState: ResizeState | null) {
  const start = timeToMinutes(event.startTime)
  const end = timeToMinutes(event.endTime)
  if (dragState?.eventId === event.id) {
    const duration = dragState.originEnd - dragState.originStart
    return { start: dragState.currentStart, end: dragState.currentStart + duration }
  }
  if (resizeState?.eventId === event.id) {
    return { start, end: resizeState.currentEnd }
  }
  return { start, end }
}

function getEventLayouts(
  events: CalendarEvent[],
  dragState: DragState | null,
  resizeState: ResizeState | null,
) {
  const intervals = events
    .map((event) => ({ event, ...getDisplayInterval(event, dragState, resizeState) }))
    .sort((a, b) => a.start - b.start || a.end - b.end)
  const layouts = new Map<string, { lane: number; laneCount: number }>()

  let group: typeof intervals = []
  let groupEnd = -1

  function flushGroup() {
    if (group.length === 0) return
    const laneEnds: number[] = []
    const assigned = group.map((item) => {
      const lane = laneEnds.findIndex((end) => item.start >= end)
      const nextLane = lane === -1 ? laneEnds.length : lane
      laneEnds[nextLane] = item.end
      return { id: item.event.id, lane: nextLane }
    })
    const laneCount = Math.max(1, laneEnds.length)
    for (const item of assigned) {
      layouts.set(item.id, { lane: item.lane, laneCount })
    }
    group = []
    groupEnd = -1
  }

  for (const item of intervals) {
    if (group.length > 0 && item.start >= groupEnd) {
      flushGroup()
    }
    group.push(item)
    groupEnd = Math.max(groupEnd, item.end)
  }
  flushGroup()

  return layouts
}

const MOCK_WEEK_DAYS = getWeekDays(getCalendarBaseDate())

const MOCK_EVENTS: (CalendarEvent | MeetingEvent)[] = [
  { id: 'e1', type: 'meeting', title: '데일리 스크럼', date: MOCK_WEEK_DAYS[0].dateStr, startTime: '09:00', endTime: '09:30', location: '회의실 A', isRecurring: true },
  { id: 'e2', type: 'meeting', title: '수율 개선 회의', date: mockScheduleDates.yieldImprovement, startTime: '11:00', endTime: '12:00', location: '회의실 B' },
  { id: 'e3', type: 'focus', title: '기획 리서치', date: MOCK_WEEK_DAYS[0].dateStr, startTime: '14:00', endTime: '16:00', description: '신규 프로젝트 기획 리서치' },
  { id: 'e4', type: 'meeting', title: 'Q2 회고', date: mockScheduleDates.q2Retrospective, startTime: '14:00', endTime: '15:00', location: '대회의실' },
  { id: 'e5', type: 'external', title: '파트너 미팅', date: MOCK_WEEK_DAYS[1].dateStr, startTime: '14:30', endTime: '15:30', location: '외부' },
  { id: 'e6', type: 'personal', title: '점심 약속', date: MOCK_WEEK_DAYS[1].dateStr, startTime: '12:00', endTime: '13:00', location: '근처 식당' },
  { id: 'e7', type: 'meeting', title: '데일리 스크럼', date: MOCK_WEEK_DAYS[2].dateStr, startTime: '09:00', endTime: '09:30', location: '회의실 A', isRecurring: true },
  { id: 'e8', type: 'external', title: '외부 미팅', date: MOCK_WEEK_DAYS[2].dateStr, startTime: '10:00', endTime: '11:00', location: '고객사' },
  { id: 'e9', type: 'focus', title: '집중 업무', date: MOCK_WEEK_DAYS[2].dateStr, startTime: '13:00', endTime: '15:00', description: 'QA 이슈 분석 및 대응' },
  { id: 'e10', type: 'meeting', title: '데일리 스크럼', date: MOCK_WEEK_DAYS[3].dateStr, startTime: '09:00', endTime: '09:30', location: '회의실 A', isRecurring: true },
  { id: 'e11', type: 'meeting', title: '공정 변경 검토', date: mockScheduleDates.processChange, startTime: '14:00', endTime: '15:00', location: '회의실 B' },
  { id: 'e12', type: 'focus', title: '집중 업무', date: MOCK_WEEK_DAYS[3].dateStr, startTime: '13:00', endTime: '15:00' },
  { id: 'e13', type: 'meeting', title: '스프린트 플래닝', date: MOCK_WEEK_DAYS[4].dateStr, startTime: '10:00', endTime: '12:00', location: '대회의실' },
  { id: 'e14', type: 'meeting', title: '기술 검토', date: MOCK_WEEK_DAYS[4].dateStr, startTime: '14:00', endTime: '15:00', location: '회의실 A' },
  { id: 'e15', type: 'focus', title: '문서 정리', date: MOCK_WEEK_DAYS[4].dateStr, startTime: '15:00', endTime: '16:30' },
  { id: 'e16', type: 'vacation', title: '연차', date: MOCK_WEEK_DAYS[4].dateStr, startTime: '09:00', endTime: '18:00' },
  { id: 'e19', type: 'focus', title: '일요일 특근', date: MOCK_WEEK_DAYS[6].dateStr, startTime: '10:00', endTime: '12:00', location: '현장' },
]

function EventTimeBlock({
  event,
  onClick,
  onDragPointerStart,
  onResizeStart,
  isDragging,
  isResizing,
  previewTime,
}: {
  event: CalendarEvent
  onClick: () => void
  onDragPointerStart: (e: ReactMouseEvent<HTMLButtonElement>) => void
  onResizeStart: (e: ReactMouseEvent<HTMLSpanElement>) => void
  isDragging: boolean
  isResizing: boolean
  previewTime?: string
}) {
  return (
    <button
      type="button"
      draggable={false}
      onClick={onClick}
      onMouseDown={onDragPointerStart}
      className={`relative h-full w-full touch-none overflow-hidden rounded border-l-2 px-1.5 py-1 text-left text-caption transition-[box-shadow,opacity,filter] hover:brightness-95 ${typeBg[event.type]} ${
        isDragging || isResizing ? 'z-10 cursor-grabbing opacity-90 shadow-md ring-2 ring-info/20' : 'cursor-grab'
      }`}
    >
      <span className="block font-medium text-gray-900">{event.title}</span>
      {previewTime && (
        <span className="mt-0.5 block text-caption font-medium text-info">{previewTime}</span>
      )}
      <span
        onMouseDown={onResizeStart}
        draggable={false}
        className="absolute inset-x-0 bottom-0 flex h-4 cursor-ns-resize items-end justify-center"
        aria-hidden="true"
      >
        <span className="mb-1 h-0.5 w-8 rounded-full bg-gray-300" />
      </span>
    </button>
  )
}

function EventDetailPanel({ event, onClose, onEdit }: { event: CalendarEvent; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption font-medium ${typeBg[event.type]}`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${typeDot[event.type]}`} />
          {EVENT_TYPE_LABEL[event.type]}
        </span>
        <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <h2 className="text-heading-s font-semibold text-gray-900">{event.title}</h2>

        <div className="mt-4 space-y-2.5">
          <div className="flex items-center gap-2 text-body-sm text-gray-600">
            <Clock className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{formatEventTime(event.startTime, event.endTime)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-body-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          {event.isRecurring && (
            <div className="flex items-center gap-2 text-body-sm text-gray-600">
              <Repeat className="h-4 w-4 text-gray-400 shrink-0" />
              <span>매주 반복</span>
            </div>
          )}
        </div>

        {event.description && (
          <>
            <hr className="my-4 border-gray-100" />
            <p className="text-body-sm text-gray-700 leading-relaxed">{event.description}</p>
          </>
        )}

        {isMeetingEvent(event) && (
          <>
            <hr className="my-4 border-gray-100" />
            <div className="space-y-4">
              <div>
                <h4 className="text-body-sm font-semibold text-gray-500 uppercase tracking-wider">참석자</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.requiredMembers.map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-caption font-medium text-gray-700">
                      {m.name}
                      <span className="text-gray-400">· 필수</span>
                    </span>
                  ))}
                  {event.optionalMembers.map((m) => (
                    <span key={m.id} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-caption font-medium text-gray-600">
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-body-sm font-semibold text-gray-500 uppercase tracking-wider">참석 현황</h4>
                <div className="mt-2 space-y-1.5">
                  {event.participantResponses.map((p, i) => {
                    const icon = p.status === 'approved' ? <CheckCircle className="h-3.5 w-3.5 text-success" />
                      : p.status === 'declined' ? <XCircle className="h-3.5 w-3.5 text-danger" />
                      : <HelpCircle className="h-3.5 w-3.5 text-warning" />
                    const label = p.status === 'approved' ? '참석' : p.status === 'declined' ? '불참' : '미응답'
                    return (
                      <div key={i} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                        <span className="text-body-sm text-gray-900">{p.name}</span>
                        <span className="inline-flex items-center gap-1 text-body-sm text-gray-500">{icon}{label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-l-4 border-gray-200 border-l-warning bg-gray-50 px-4 py-3">
                <p className="text-body-sm font-medium text-gray-700">다음 액션</p>
                <p className="mt-0.5 text-body-sm text-gray-600">참석 요청을 보내고 응답을 기다리고 있어요.</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-gray-100 px-5 py-4">
        <Button onClick={onEdit} variant="secondary" className="w-full">
          일정 수정
        </Button>
      </div>
    </div>
  )
}

function EventFormPanel({
  onClose,
  onSave,
  editEvent,
}: {
  onClose: () => void
  onSave: (event: CalendarEvent) => void
  editEvent?: CalendarEvent | null
}) {
  const [title, setTitle] = useState(editEvent?.title ?? '')
  const [type, setType] = useState<EventType>(editEvent?.type ?? 'meeting')
  const [eventDate, setEventDate] = useState(editEvent?.date ?? getTodayStr())
  const [startTime, setStartTime] = useState(editEvent?.startTime ?? '09:00')
  const [endTime, setEndTime] = useState(editEvent?.endTime ?? '10:00')
  const [location, setLocation] = useState(editEvent?.location ?? '')
  const [description, setDescription] = useState(editEvent?.description ?? '')
  const [isRecurring, setIsRecurring] = useState(editEvent?.isRecurring ?? false)
  const [myStatus, setMyStatus] = useState<'available' | 'busy' | 'focus' | 'absent'>('busy')

  const [requiredMembers, setRequiredMembers] = useState<TeamMember[]>([])
  const [optionalMembers, setOptionalMembers] = useState<TeamMember[]>([])
  const [meetingDuration, setMeetingDuration] = useState<MeetingDuration>(
    isMeetingEvent(editEvent) ? editEvent.duration : '60m',
  )
  const [customDurationMinutes, setCustomDurationMinutes] = useState(
    isMeetingEvent(editEvent) ? editEvent.customDurationMinutes ?? 45 : 45,
  )
  const [candidateStartDate, setCandidateStartDate] = useState(getTodayStr())
  const [candidateEndDate, setCandidateEndDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return formatDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate())
  })

  const isMeeting = type === 'meeting'

  const handleSave = useCallback(() => {
    if (!title.trim()) return
    const base: CalendarEvent = {
      id: editEvent?.id ?? `event-${Date.now()}`,
      type,
      title: title.trim(),
      date: eventDate,
      startTime,
      endTime,
      location: location || undefined,
      description: description || undefined,
      isRecurring,
      myStatus,
    }
    if (isMeeting) {
      const meetingEvent: MeetingEvent = {
        ...base,
        isMeeting: true,
        requiredMembers,
        optionalMembers,
        duration: meetingDuration,
        customDurationMinutes: meetingDuration === 'custom' ? customDurationMinutes : undefined,
        candidateStartDate,
        candidateEndDate,
        participantResponses: [
          ...requiredMembers.map((m) => ({ name: m.name, status: 'pending' })),
          ...optionalMembers.map((m) => ({ name: m.name, status: 'pending' })),
        ],
      }
      onSave(meetingEvent)
    } else {
      onSave(base)
    }
  }, [title, type, eventDate, startTime, endTime, location, description, isRecurring, myStatus, isMeeting, requiredMembers, optionalMembers, meetingDuration, customDurationMinutes, candidateStartDate, candidateEndDate, editEvent, onSave])

  const DURATION_OPTIONS: { value: MeetingDuration; label: string }[] = [
    { value: '30m', label: '30분' },
    { value: '60m', label: '1시간' },
    { value: '90m', label: '1시간 30분' },
    { value: '120m', label: '2시간' },
    { value: 'custom', label: '기타' },
  ]

  const MY_STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'available', label: '가능' },
    { value: 'busy', label: '다른 용무 중' },
    { value: 'focus', label: '집중 업무' },
    { value: 'absent', label: '부재' },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h3 className="text-title font-semibold text-gray-900">{editEvent ? '일정 수정' : '일정 추가'}</h3>
        <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div>
          <label className="text-body-sm font-semibold text-gray-500">일정 유형</label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {(Object.keys(EVENT_TYPE_LABEL) as EventType[]).map((et) => (
              <button
                key={et}
                onClick={() => setType(et)}
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1.5 text-body-sm font-medium transition-colors ${
                  type === et ? 'border-[#9AA8B8] bg-gray-50 text-gray-900' : 'border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${typeDot[et]}`} />
                {EVENT_TYPE_LABEL[et]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-body-sm font-semibold text-gray-500">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="일정 제목"
            className="mt-1.5 w-full rounded-[8px] border border-gray-200 px-4 py-2.5 text-body-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-black"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <div className="min-w-0">
            <label className="text-body-sm font-semibold text-gray-500">날짜</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1.5 w-full min-w-0 rounded-[8px] border border-gray-200 px-3 py-2.5 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <div className="min-w-0">
            <label className="text-body-sm font-semibold text-gray-500">시작</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1.5 w-full min-w-0 rounded-[8px] border border-gray-200 px-3 py-2.5 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
            />
          </div>
          <div className="min-w-0">
            <label className="text-body-sm font-semibold text-gray-500">종료</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1.5 w-full min-w-0 rounded-[8px] border border-gray-200 px-3 py-2.5 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="recurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-gray-900"
          />
          <label htmlFor="recurring" className="text-body-sm text-gray-700">반복 일정</label>
        </div>

        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <div className="min-w-0">
            <label className="text-body-sm font-semibold text-gray-500">내 상태</label>
            <select
              value={myStatus}
              onChange={(e) => setMyStatus(e.target.value as typeof myStatus)}
              className="mt-1.5 w-full min-w-0 rounded-[8px] border border-gray-200 px-3 py-2.5 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
            >
              {MY_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-body-sm font-semibold text-gray-500">장소</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="장소 또는 온라인 링크"
            className="mt-1.5 w-full rounded-[8px] border border-gray-200 px-4 py-2.5 text-body-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-black"
          />
        </div>

        <div>
          <label className="text-body-sm font-semibold text-gray-500">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명을 입력해주세요"
            rows={3}
            className="mt-1.5 w-full resize-none rounded-[8px] border border-gray-200 px-4 py-2.5 text-body-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-black"
          />
        </div>

        {isMeeting && (
          <>
            <hr className="border-gray-100" />
            <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                <span className="text-body-sm font-semibold text-gray-900">회의 조율</span>
              </div>

              <MemberSelector
                allMembers={teamMembers}
                requiredMembers={requiredMembers}
                optionalMembers={optionalMembers}
                onAddRequired={(m) => {
                  if (requiredMembers.length + optionalMembers.length < 6) setRequiredMembers([...requiredMembers, m])
                }}
                onAddOptional={(m) => {
                  if (requiredMembers.length + optionalMembers.length < 6) setOptionalMembers([...optionalMembers, m])
                }}
                onRemove={(m) => {
                  setRequiredMembers(requiredMembers.filter((x) => x.id !== m.id))
                  setOptionalMembers(optionalMembers.filter((x) => x.id !== m.id))
                }}
              />

              <div>
                <label className="text-body-sm font-semibold text-gray-500">회의 길이</label>
                <div className="mt-1.5 grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setMeetingDuration(opt.value)}
                      className={`flex h-11 min-w-20 items-center justify-center whitespace-nowrap rounded-[8px] border px-4 py-2 text-body-sm font-medium transition-colors ${
                        meetingDuration === opt.value ? 'border-[#9AA8B8] bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {meetingDuration === 'custom' && (
                  <div className="mt-3 max-w-[180px]">
                    <label className="text-body-sm font-semibold text-gray-500">직접 입력</label>
                    <div className="mt-1.5 flex items-center gap-2 rounded-[8px] border border-gray-200 px-3 py-2.5 focus-within:border-[#9AA8B8]">
                      <input
                        type="number"
                        min={10}
                        max={240}
                        step={5}
                        value={customDurationMinutes}
                        onChange={(e) => setCustomDurationMinutes(Math.min(Math.max(Number(e.target.value) || 10, 10), 240))}
                        className="w-full bg-transparent text-body-sm text-gray-900 outline-none"
                      />
                      <span className="shrink-0 text-body-sm text-gray-500">분</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-body-sm font-semibold text-gray-500">회의 가능 기간</p>
                <div className="mt-1.5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                  <div className="min-w-0">
                    <label className="text-body-sm font-semibold text-gray-500">시작일</label>
                    <input
                      type="date"
                      value={candidateStartDate}
                      onChange={(e) => setCandidateStartDate(e.target.value)}
                      className="mt-1.5 w-full min-w-0 rounded-[8px] border border-gray-200 px-3 py-2 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="text-body-sm font-semibold text-gray-500">종료일</label>
                    <input
                      type="date"
                      value={candidateEndDate}
                      onChange={(e) => setCandidateEndDate(e.target.value)}
                      className="mt-1.5 w-full min-w-0 rounded-[8px] border border-gray-200 px-3 py-2 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full">가능한 시간 보기</Button>
              <Button variant="secondary" className="w-full">참석 요청 보내기</Button>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-gray-100 px-5 py-4 space-y-2">
        <Button onClick={handleSave} disabled={!title.trim()} className="w-full">
          {editEvent ? '변경 사항 저장' : '일정 추가'}
        </Button>
      </div>
    </div>
  )
}

function CalendarPageContent() {
  const searchParams = useSearchParams()
  const [baseDate, setBaseDate] = useState(() => getCalendarBaseDate())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [events, setEvents] = useState<(CalendarEvent | MeetingEvent)[]>(MOCK_EVENTS)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const dayColumnRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const resizeStateRef = useRef<ResizeState | null>(null)
  const suppressClickRef = useRef<string | null>(null)
  const rawFilter = searchParams.get('filter')
  const searchQuery = searchParams.get('q') ?? ''
  const normalizedSearchQuery = normalizeSearchQuery(searchQuery)
  const hasSearchQuery = Boolean(normalizedSearchQuery)
  const calendarFilter: CalendarFilter = rawFilter === 'meeting'
    || rawFilter === 'focus'
    || rawFilter === 'external'
    || rawFilter === 'vacation'
    || rawFilter === 'personal'
    ? rawFilter
    : 'all'
  const pageModeLabel = calendarFilter !== 'all'
    ? FILTER_TITLE[calendarFilter]
    : '이번 주 일정'

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate])

  const weekStart = weekDays[0].date
  const weekEnd = weekDays[6].date
  const monthLabel = `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 ~ ${weekEnd.getMonth() + 1}월 ${weekEnd.getDate()}일`

  const vacationDateStrs = useMemo(() => {
    const dateStrs = new Set(weekDays.map((d) => d.dateStr))
    return new Set(events.filter((event) => dateStrs.has(event.date) && event.type === 'vacation').map((event) => event.date))
  }, [events, weekDays])

  const weekEvents = useMemo(() => {
    const dateStrs = new Set(weekDays.map((d) => d.dateStr))
    return events.filter((event) => {
      if (!dateStrs.has(event.date)) return false
      if (event.type !== 'vacation' && vacationDateStrs.has(event.date)) return false
      if (calendarFilter !== 'all' && event.type !== calendarFilter) return false
      if (!matchesSearch(getEventSearchParts(event), searchQuery)) return false
      return true
    })
  }, [calendarFilter, events, searchQuery, vacationDateStrs, weekDays])

  const visibleSelectedEvent = selectedEvent && weekEvents.some((event) => event.id === selectedEvent.id)
    ? selectedEvent
    : null

  const goPrevWeek = useCallback(() => {
    const d = new Date(baseDate)
    d.setDate(d.getDate() - 7)
    setBaseDate(d)
    setSelectedEvent(null)
  }, [baseDate])

  const goNextWeek = useCallback(() => {
    const d = new Date(baseDate)
    d.setDate(d.getDate() + 7)
    setBaseDate(d)
    setSelectedEvent(null)
  }, [baseDate])

  const goToday = useCallback(() => {
    setBaseDate(new Date())
    setSelectedEvent(null)
  }, [])

  const handleSaveEvent = useCallback((evt: CalendarEvent) => {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === evt.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = evt
        return next
      }
      return [...prev, evt]
    })
    setShowForm(false)
    setEditEvent(null)
    setSelectedEvent(evt)
  }, [])

  const handleSelectEvent = useCallback((evt: CalendarEvent) => {
    if (suppressClickRef.current === evt.id) {
      suppressClickRef.current = null
      return
    }
    setSelectedEvent(evt)
    setShowForm(false)
  }, [])

  const commitDraggedTime = useCallback((state: DragState) => {
    const duration = state.originEnd - state.originStart
    const nextStart = state.currentStart
    if (!state.hasMoved || (nextStart === state.originStart && state.currentDate === state.date)) return

    const nextStartTime = minutesToTime(nextStart)
    const nextEndTime = minutesToTime(nextStart + duration)
    const originalEvent = events.find((event) => event.id === state.eventId)
    const updatedEvent = originalEvent
      ? { ...originalEvent, date: state.currentDate, startTime: nextStartTime, endTime: nextEndTime }
      : null

    setEvents((prev) => prev.map((event) => {
      if (event.id !== state.eventId) return event
      return { ...event, date: state.currentDate, startTime: nextStartTime, endTime: nextEndTime }
    }))

    setSelectedEvent(updatedEvent)
    setShowForm(false)
    suppressClickRef.current = state.eventId
  }, [events])

  const handleDragPointerStart = useCallback((evt: CalendarEvent, e: ReactMouseEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    const originStart = timeToMinutes(evt.startTime)
    const originEnd = timeToMinutes(evt.endTime)
    const nextDragState = {
      eventId: evt.id,
      date: evt.date,
      currentDate: evt.date,
      startX: e.clientX,
      startY: e.clientY,
      originStart,
      originEnd,
      currentStart: originStart,
      hasMoved: false,
    }
    dragStateRef.current = nextDragState
    setDragState(nextDragState)
  }, [])

  useEffect(() => {
    if (!dragState) return

    function handleMouseMove(e: MouseEvent) {
      const currentDragState = dragStateRef.current
      if (!currentDragState) return

      const targetEntry = Object.entries(dayColumnRefs.current).find(([, element]) => {
        if (!element) return false
        const rect = element.getBoundingClientRect()
        return e.clientX >= rect.left && e.clientX <= rect.right
      })
      if (!targetEntry) return

      const [dateStr, column] = targetEntry
      if (!column) return

      const draggingEvent = events.find((event) => event.id === currentDragState.eventId)
      if (draggingEvent?.type !== 'vacation' && vacationDateStrs.has(dateStr)) return

      const rect = column.getBoundingClientRect()
      const minutesFromStart = roundToStep(((e.clientY - rect.top) / rect.height) * (DAY_END_MINUTES - DAY_START_MINUTES))
      const duration = currentDragState.originEnd - currentDragState.originStart
      const currentStart = clampEventStart(DAY_START_MINUTES + minutesFromStart, duration)
      const hasMoved = currentDragState.hasMoved
        || Math.abs(e.clientX - currentDragState.startX) > 4
        || Math.abs(e.clientY - currentDragState.startY) > 4
        || currentStart !== currentDragState.originStart
        || dateStr !== currentDragState.date
      const nextDragState = {
        ...currentDragState,
        currentDate: dateStr,
        currentStart,
        hasMoved,
      }
      dragStateRef.current = nextDragState
      setDragState(nextDragState)
    }

    function handleMouseUp() {
      const currentDragState = dragStateRef.current
      if (currentDragState?.hasMoved) {
        commitDraggedTime(currentDragState)
      }
      dragStateRef.current = null
      setDragState(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [commitDraggedTime, dragState, events, vacationDateStrs])

  const commitResize = useCallback((state: ResizeState) => {
    if (state.currentEnd === state.originEnd) return
    const nextEndTime = minutesToTime(state.currentEnd)
    const originalEvent = events.find((event) => event.id === state.eventId)
    const updatedEvent = originalEvent
      ? { ...originalEvent, endTime: nextEndTime }
      : null

    setEvents((prev) => prev.map((event) => (
      event.id === state.eventId ? { ...event, endTime: nextEndTime } : event
    )))
    setSelectedEvent(updatedEvent)
    setShowForm(false)
  }, [events])

  const handleResizeStart = useCallback((evt: CalendarEvent, e: ReactMouseEvent<HTMLSpanElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const nextResizeState = {
      eventId: evt.id,
      startY: e.clientY,
      originStart: timeToMinutes(evt.startTime),
      originEnd: timeToMinutes(evt.endTime),
      currentEnd: timeToMinutes(evt.endTime),
    }
    resizeStateRef.current = nextResizeState
    setResizeState(nextResizeState)
  }, [])

  useEffect(() => {
    if (!resizeState) return

    function handleMouseMove(e: MouseEvent) {
      const currentResizeState = resizeStateRef.current
      if (!currentResizeState) return

      const deltaMinutes = roundToStep(((e.clientY - currentResizeState.startY) / GRID_HOUR_HEIGHT) * 60)
      const currentEnd = Math.min(
        Math.max(currentResizeState.originEnd + deltaMinutes, currentResizeState.originStart + DRAG_SNAP_MINUTES),
        DAY_END_MINUTES,
      )
      const nextResizeState = { ...currentResizeState, currentEnd }
      resizeStateRef.current = nextResizeState
      setResizeState(nextResizeState)
    }

    function handleMouseUp() {
      const currentResizeState = resizeStateRef.current
      if (currentResizeState) commitResize(currentResizeState)
      resizeStateRef.current = null
      setResizeState(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [commitResize, resizeState])

  const handleAddEvent = useCallback(() => {
    setEditEvent(null)
    setShowForm(true)
    setSelectedEvent(null)
  }, [])

  const handleEditEvent = useCallback(() => {
    if (visibleSelectedEvent) {
      setEditEvent(visibleSelectedEvent)
      setShowForm(true)
      setSelectedEvent(null)
    }
  }, [visibleSelectedEvent])

  const getEventsForDay = useCallback((dateStr: string) => {
    return weekEvents.filter((e) => e.date === dateStr)
  }, [weekEvents])

  const getRenderableEventsForDay = useCallback((dateStr: string) => {
    const dayEvents = getEventsForDay(dateStr)
    const vacationEvents = dayEvents.filter((event) => event.type === 'vacation')
    if (vacationEvents.length > 0) return vacationEvents
    return dayEvents
  }, [getEventsForDay])

  const candidateSlots = useMemo(() => {
    if (calendarFilter !== 'all' && calendarFilter !== 'meeting') return []
    const requiredIds = teamMembers.slice(0, 4).map((member) => member.id)
    const optionalIds = teamMembers.slice(4, 6).map((member) => member.id)
    return sortSlots(generateTimeSlots(
      weekDays[0].dateStr,
      weekDays[6].dateStr,
      '60m',
      requiredIds,
      optionalIds,
      { includeWeekends: true },
    )).filter((slot) => {
      if (vacationDateStrs.has(slot.date)) return false
      return !events.some((event) =>
        weekDays.some((day) => day.dateStr === event.date) &&
        eventOverlapsSlot(event, slot.date, slot.startTime, slot.endTime),
      )
    }).slice(0, 5)
  }, [calendarFilter, events, vacationDateStrs, weekDays])

  const slotColor = (hasPreferenceConflict: boolean, allRequiredAvailable: boolean) => {
    if (allRequiredAvailable && !hasPreferenceConflict) return 'border-success/20 bg-white text-success'
    return 'border-warning/20 bg-white text-warning'
  }
  const slotIcon = (hasPreferenceConflict: boolean, allRequiredAvailable: boolean) => {
    if (allRequiredAvailable && !hasPreferenceConflict) return <CheckCircle className="h-3.5 w-3.5" />
    return <HelpCircle className="h-3.5 w-3.5" />
  }
  const slotLabel = (hasPreferenceConflict: boolean, allRequiredAvailable: boolean) => {
    if (hasPreferenceConflict) return '일정 조율 권장'
    return allRequiredAvailable ? '전원 가능' : '일부 확인 필요'
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={goToday} className="rounded-[8px] border border-gray-200 px-3 py-1.5 text-body-sm font-medium text-gray-700 hover:bg-gray-50">
            오늘
          </button>
          <div className="flex items-center gap-1">
            <button onClick={goPrevWeek} className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={goNextWeek} className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div>
            <h1 className="text-title font-semibold text-gray-900">{pageModeLabel}</h1>
            <p className="text-body-sm text-gray-500">{monthLabel}</p>
          </div>
        </div>
        <button
          onClick={handleAddEvent}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-info px-4 py-2 text-body-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          일정 추가
        </button>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Calendar grid area */}
        <div className="flex flex-1 flex-col">
          {/* Desktop: time grid */}
          <div className="hidden flex-1 flex-col bg-gray-50 lg:flex">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200 bg-gray-50">
              <div className="border-r border-gray-200 px-2 py-2" />
              {weekDays.map((day) => (
                <div key={day.dateStr} className={`border-r border-gray-100 px-2 py-2 text-center last:border-r-0 ${day.isToday ? 'bg-white' : ''}`}>
                  <span className="text-body-sm font-medium text-gray-500">{day.dayName}</span>
                  <span className={`ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-title font-semibold ${
                    day.isToday ? 'bg-gray-900 text-white' : 'text-gray-900'
                  }`}>
                    {day.dayNum}
                  </span>
                </div>
              ))}
            </div>

            {/* Time grid body */}
            <div className="grid flex-1 grid-cols-[60px_repeat(7,1fr)] overflow-y-auto bg-white">
              <div className="relative border-r border-gray-200 bg-gray-50" style={{ height: DAY_COLUMN_HEIGHT }}>
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 border-t border-gray-100 px-2 pt-1 text-right"
                    style={{ top: (hour - 9) * GRID_HOUR_HEIGHT }}
                  >
                    <span className="text-body-sm text-gray-400">{formatTimeDisplay(hour, 0)}</span>
                  </div>
                ))}
              </div>

              {weekDays.map((day) => {
                const dayEvents = getRenderableEventsForDay(day.dateStr)
                const draggedEvent = dragState
                  ? events.find((event) => event.id === dragState.eventId)
                  : null
                const renderEvents = [
                  ...dayEvents.filter((event) => !(dragState?.eventId === event.id && dragState.currentDate !== day.dateStr)),
                  ...(draggedEvent && dragState?.currentDate === day.dateStr && !dayEvents.some((event) => event.id === draggedEvent.id)
                    ? [draggedEvent]
                    : []),
                ]
                const eventLayouts = getEventLayouts(renderEvents, dragState, resizeState)
                return (
                  <div
                    key={day.dateStr}
                    ref={(element) => {
                      dayColumnRefs.current[day.dateStr] = element
                    }}
                    className={`relative border-r border-gray-100 last:border-r-0 ${
                      dragState?.currentDate === day.dateStr ? 'bg-gray-100/70' : day.isToday ? 'bg-gray-50/60' : 'bg-white'
                    }`}
                    style={{ height: DAY_COLUMN_HEIGHT }}
                  >
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="absolute inset-x-0 border-t border-gray-100"
                        style={{ top: (hour - 9) * GRID_HOUR_HEIGHT }}
                      />
                    ))}

                    {renderEvents.map((evt) => {
                      const start = timeToMinutes(evt.startTime)
                      const end = timeToMinutes(evt.endTime)
                      const activeResizeState = resizeState?.eventId === evt.id ? resizeState : null
                      const isDragging = dragState?.eventId === evt.id
                      const displayStart = isDragging ? dragState.currentStart : start
                      const displayEnd = activeResizeState?.currentEnd ?? end
                      const dur = Math.max(DRAG_SNAP_MINUTES, displayEnd - start)
                      const top = ((displayStart - DAY_START_MINUTES) / 60) * GRID_HOUR_HEIGHT
                      const height = Math.max(28, (dur / 60) * GRID_HOUR_HEIGHT)
                      const isResizing = resizeState?.eventId === evt.id
                      const previewStart = isDragging ? dragState.currentStart : start
                      const previewEnd = isResizing ? displayEnd : previewStart + eventDurationMinutes(evt.startTime, evt.endTime)
                      const previewTime = isDragging || isResizing
                        ? `${minutesToTime(previewStart)} ~ ${minutesToTime(previewEnd)}`
                        : undefined
                      const layout = eventLayouts.get(evt.id) ?? { lane: 0, laneCount: 1 }
                      const horizontalStyle = layout.laneCount > 1
                        ? {
                            left: `calc(${(layout.lane / layout.laneCount) * 100}% + 4px)`,
                            width: `calc(${100 / layout.laneCount}% - 6px)`,
                          }
                        : {
                            left: 4,
                            right: 4,
                          }

                      return (
                        <div
                          key={evt.id}
                          className="absolute"
                          style={{ top, height, ...horizontalStyle }}
                        >
                          <EventTimeBlock
                            event={evt}
                            onClick={() => handleSelectEvent(evt)}
                            onDragPointerStart={(e) => handleDragPointerStart(evt, e)}
                            onResizeStart={(e) => handleResizeStart(evt, e)}
                            isDragging={isDragging}
                            isResizing={isResizing}
                            previewTime={previewTime}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {weekEvents.length === 0 && (
              <div className="border-t border-gray-100 bg-white px-6 py-10 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-body-sm font-medium text-gray-700">
                  {hasSearchQuery ? '검색 결과가 없습니다' : `${pageModeLabel}이 없습니다`}
                </p>
                <p className="mt-1 text-body-sm text-gray-500">
                  {hasSearchQuery ? `"${searchQuery}"에 맞는 일정을 찾지 못했습니다.` : '다른 필터를 선택하거나 새 일정을 추가해보세요.'}
                </p>
              </div>
            )}
          </div>

          {/* Mobile: date list */}
          <div className="flex flex-col lg:hidden">
            {weekEvents.length === 0 ? (
              <div className="bg-white px-6 py-16 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-title font-semibold text-gray-900">
                  {hasSearchQuery ? '검색 결과가 없습니다' : `${pageModeLabel}이 없습니다`}
                </p>
                <p className="mt-1 text-body-sm text-gray-500">
                  {hasSearchQuery ? `"${searchQuery}"에 맞는 일정을 찾지 못했습니다.` : '다른 필터를 선택하거나 새 일정을 추가해보세요.'}
                </p>
              </div>
            ) : weekDays.map((day) => {
              const dayEvents = getRenderableEventsForDay(day.dateStr)
              return (
                <div key={day.dateStr} className="border-b border-gray-100 bg-white px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-title font-semibold ${
                      day.isToday ? 'bg-gray-900 text-white' : 'text-gray-900'
                    }`}>
                      {day.dayNum}
                    </span>
                    <span className="text-body-sm font-medium text-gray-500">{day.dayName}요일</span>
                    {day.isToday && <span className="text-body-sm font-medium text-gray-600">오늘</span>}
                  </div>
                  {dayEvents.length === 0 ? (
                    <p className="pl-9 text-body-sm text-gray-400">
                      {calendarFilter === 'all' ? '일정 없음' : `${FILTER_LABEL[calendarFilter]} 없음`}
                    </p>
                  ) : (
                    <div className="space-y-1 pl-9">
                      {dayEvents.map((evt) => (
                        <button
                          key={evt.id}
                          onClick={() => handleSelectEvent(evt)}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                            visibleSelectedEvent?.id === evt.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${typeDot[evt.type]}`} />
                          <span className="text-body-sm text-gray-500 tabular-nums w-10 shrink-0">{evt.startTime.slice(0, 5)}</span>
                          <span className="text-body-sm font-medium text-gray-900 truncate">{evt.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Weekly candidate slots */}
          {candidateSlots.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                <h3 className="text-title font-semibold text-gray-900">이번 주 가능한 회의 시간</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {candidateSlots.map((slot) => (
                  <div key={`${slot.date}-${slot.startTime}`} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-medium ${slotColor(slot.hasPreferenceConflict, slot.allRequiredAvailable)}`}>
                    {slotIcon(slot.hasPreferenceConflict, slot.allRequiredAvailable)}
                    <span>{slot.date.slice(5)}</span>
                    <span>{slot.startTime.slice(0, 5)}</span>
                    <span className="opacity-60">·</span>
                    <span>{slotLabel(slot.hasPreferenceConflict, slot.allRequiredAvailable)}</span>
                    {slot.preferenceConflicts[0] && (
                      <>
                        <span className="opacity-60">·</span>
                        <span>{slot.preferenceConflicts[0].memberName}님</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right detail panel (desktop) / bottom sheet (mobile) */}
        {visibleSelectedEvent && (
          <>
            <div className="hidden border-l border-gray-200 bg-white lg:block lg:w-[360px] lg:shrink-0">
              <EventDetailPanel event={visibleSelectedEvent} onClose={() => setSelectedEvent(null)} onEdit={handleEditEvent} />
            </div>
            <div className="fixed inset-0 z-50 flex items-end bg-gray-900/35 lg:hidden" role="dialog" aria-modal="true">
              <button
                type="button"
                aria-label="일정 상세 닫기"
                onClick={() => setSelectedEvent(null)}
                className="absolute inset-0"
              />
              <div className="relative flex h-[78dvh] max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-t-[16px] bg-white shadow-2xl">
                <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-200" />
                <EventDetailPanel event={visibleSelectedEvent} onClose={() => setSelectedEvent(null)} onEdit={handleEditEvent} />
              </div>
            </div>
          </>
        )}

        {/* Event form slide-over */}
        {showForm && (
          <>
            <div className="hidden border-l border-gray-200 bg-white lg:block lg:w-[400px] lg:shrink-0">
              <EventFormPanel
                onClose={() => { setShowForm(false); setEditEvent(null) }}
                onSave={handleSaveEvent}
                editEvent={editEvent}
              />
            </div>
            <div className="fixed inset-0 z-50 flex items-end bg-gray-900/35 lg:hidden" role="dialog" aria-modal="true">
              <button
                type="button"
                aria-label="일정 추가 닫기"
                onClick={() => { setShowForm(false); setEditEvent(null) }}
                className="absolute inset-0"
              />
              <div className="relative flex h-[88dvh] max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-t-[16px] bg-white shadow-2xl">
                <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-200" />
                <EventFormPanel
                  onClose={() => { setShowForm(false); setEditEvent(null) }}
                  onSave={handleSaveEvent}
                  editEvent={editEvent}
                />
              </div>
            </div>
          </>
        )}

        {/* Empty state (when no selection and no form) */}
        {!visibleSelectedEvent && !showForm && (
          <div className="hidden items-center justify-center border-l border-gray-200 bg-white p-8 lg:flex lg:w-[360px] lg:shrink-0">
            <div className="text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-body-sm text-gray-500">일정을 선택하거나 추가해보세요.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="flex min-h-0 w-full flex-1 bg-gray-50" />}>
      <CalendarPageContent />
    </Suspense>
  )
}
