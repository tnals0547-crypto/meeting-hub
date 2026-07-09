'use client'

import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, MapPin, Clock, Users, CheckCircle, XCircle, HelpCircle, CalendarDays, Repeat, ExternalLink, Sun, Coffee } from 'lucide-react'
import { teamMembers } from '@/data/mock'
import { generateTimeSlots, sortSlots } from '@/data/availability'
import type { TeamMember, MeetingDuration, TimeSlotWithAvailability, Meeting, Participant, MeetingStatus } from '@/types/meeting'
import Button from '@/components/common/Button'
import MemberSelector from '@/components/MemberSelector'

type EventType = 'meeting' | 'focus' | 'external' | 'vacation' | 'personal'

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
  candidateStartDate: string
  candidateEndDate: string
  participantResponses: { name: string; status: string }[]
}

const WEEKDAY_NAMES = ['월', '화', '수', '목', '금']
const EVENT_TYPE_LABEL: Record<EventType, string> = {
  meeting: '회의',
  focus: '집중 업무',
  external: '외부 일정',
  vacation: '휴가/부재',
  personal: '개인 일정',
}

const typeDot: Record<EventType, string> = {
  meeting: 'bg-brand-500',
  focus: 'bg-green-500',
  external: 'bg-amber-500',
  vacation: 'bg-red-400',
  personal: 'bg-purple-400',
}

const typeBg: Record<EventType, string> = {
  meeting: 'bg-brand-50 border-l-brand-500',
  focus: 'bg-green-50 border-l-green-500',
  external: 'bg-amber-50 border-l-amber-500',
  vacation: 'bg-red-50 border-l-red-400',
  personal: 'bg-purple-50 border-l-purple-400',
}

const HOURS = Array.from({ length: 9 }, (_, i) => i + 9)

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
  for (let i = 0; i < 5; i++) {
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

function slotToTimeKey(dateStr: string, startTime: string) {
  return `${dateStr}-${startTime}`
}

const MOCK_EVENTS: (CalendarEvent | MeetingEvent)[] = [
  { id: 'e1', type: 'meeting', title: '데일리 스크럼', date: '2026-07-07', startTime: '09:00', endTime: '09:30', location: '회의실 A', isRecurring: true },
  { id: 'e2', type: 'meeting', title: '프로젝트 리뷰', date: '2026-07-07', startTime: '11:00', endTime: '12:00', location: '회의실 B' },
  { id: 'e3', type: 'focus', title: '기획 리서치', date: '2026-07-07', startTime: '14:00', endTime: '16:00', description: '신규 프로젝트 기획 리서치' },
  { id: 'e4', type: 'meeting', title: '설비 점검 회의', date: '2026-07-08', startTime: '10:00', endTime: '11:30', location: '회의실 A' },
  { id: 'e5', type: 'external', title: '파트너 미팅', date: '2026-07-08', startTime: '14:30', endTime: '15:30', location: '외부' },
  { id: 'e6', type: 'personal', title: '점심 약속', date: '2026-07-08', startTime: '12:00', endTime: '13:00', location: '근처 식당' },
  { id: 'e7', type: 'meeting', title: '데일리 스크럼', date: '2026-07-09', startTime: '09:00', endTime: '09:30', location: '회의실 A', isRecurring: true },
  { id: 'e8', type: 'external', title: '외부 미팅', date: '2026-07-09', startTime: '10:00', endTime: '11:00', location: '고객사' },
  { id: 'e9', type: 'focus', title: '집중 업무', date: '2026-07-09', startTime: '13:00', endTime: '15:00', description: 'QA 이슈 분석 및 대응' },
  { id: 'e10', type: 'meeting', title: '스프린트 플래닝', date: '2026-07-10', startTime: '10:00', endTime: '12:00', location: '대회의실' },
  { id: 'e11', type: 'meeting', title: '기술 검토', date: '2026-07-10', startTime: '14:00', endTime: '15:00', location: '회의실 A' },
  { id: 'e12', type: 'focus', title: '문서 정리', date: '2026-07-10', startTime: '15:00', endTime: '16:30' },
  { id: 'e13', type: 'vacation', title: '연차', date: '2026-07-10', startTime: '09:00', endTime: '18:00' },
  { id: 'e14', type: 'meeting', title: '데일리 스크럼', date: '2026-07-11', startTime: '09:00', endTime: '09:30', location: '회의실 A', isRecurring: true },
  { id: 'e15', type: 'meeting', title: '주간 회고', date: '2026-07-11', startTime: '11:00', endTime: '12:00', location: '회의실 B' },
  { id: 'e16', type: 'focus', title: '집중 업무', date: '2026-07-11', startTime: '13:00', endTime: '15:00' },
]

const CANDIDATE_SLOTS = [
  { date: '2026-07-08', startTime: '10:00', endTime: '11:00', availableCount: 6, totalCount: 8, status: 'partial' as const },
  { date: '2026-07-08', startTime: '14:00', endTime: '15:00', availableCount: 8, totalCount: 8, status: 'all' as const },
  { date: '2026-07-09', startTime: '14:00', endTime: '15:00', availableCount: 7, totalCount: 8, status: 'partial' as const },
  { date: '2026-07-10', startTime: '09:00', endTime: '10:00', availableCount: 5, totalCount: 8, status: 'partial' as const },
  { date: '2026-07-11', startTime: '14:00', endTime: '15:00', availableCount: 8, totalCount: 8, status: 'all' as const },
]

function EventTimeBlock({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded border-l-2 px-1.5 py-1 text-left text-2xs transition-colors hover:brightness-95 ${typeBg[event.type]}`}
      style={{ minHeight: '20px' }}
    >
      <span className="font-medium text-gray-900">{event.title}</span>
    </button>
  )
}

function isMeetingEvent(event: CalendarEvent): event is MeetingEvent {
  return 'isMeeting' in event && (event as MeetingEvent).isMeeting === true
}

function EventDetailPanel({ event, onClose, onEdit }: { event: CalendarEvent; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-medium ${typeBg[event.type]}`}>
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
                <h4 className="text-caption font-semibold text-gray-500 uppercase tracking-wider">참석자</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.requiredMembers.map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-2xs font-medium text-blue-700">
                      {m.name}
                      <span className="text-blue-400">· 필수</span>
                    </span>
                  ))}
                  {event.optionalMembers.map((m) => (
                    <span key={m.id} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-2xs font-medium text-gray-600">
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-caption font-semibold text-gray-500 uppercase tracking-wider">참석 현황</h4>
                <div className="mt-2 space-y-1.5">
                  {event.participantResponses.map((p, i) => {
                    const icon = p.status === 'approved' ? <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      : p.status === 'declined' ? <XCircle className="h-3.5 w-3.5 text-red-500" />
                      : <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                    const label = p.status === 'approved' ? '참석' : p.status === 'declined' ? '불참' : '미응답'
                    return (
                      <div key={i} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                        <span className="text-body-sm text-gray-900">{p.name}</span>
                        <span className="inline-flex items-center gap-1 text-2xs text-gray-500">{icon}{label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="text-caption font-medium text-amber-800">다음 액션</p>
                <p className="mt-0.5 text-body-sm text-amber-700">참석 요청을 보내고 응답을 기다리고 있어요.</p>
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
  const [meetingDuration, setMeetingDuration] = useState<MeetingDuration>('60m')
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
  }, [title, type, eventDate, startTime, endTime, location, description, isRecurring, myStatus, isMeeting, requiredMembers, optionalMembers, meetingDuration, candidateStartDate, candidateEndDate, editEvent, onSave])

  const DURATION_OPTIONS: { value: MeetingDuration; label: string }[] = [
    { value: '30m', label: '30분' },
    { value: '60m', label: '1시간' },
    { value: '90m', label: '1시간 30분' },
    { value: '120m', label: '2시간' },
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
          <label className="text-caption font-semibold text-gray-500 uppercase tracking-wider">일정 유형</label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {(Object.keys(EVENT_TYPE_LABEL) as EventType[]).map((et) => (
              <button
                key={et}
                onClick={() => setType(et)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-medium transition-colors ${
                  type === et ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${typeDot[et]}`} />
                {EVENT_TYPE_LABEL[et]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-caption font-semibold text-gray-500 uppercase tracking-wider">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="일정 제목"
            className="mt-1.5 w-full rounded-[8px] border border-gray-200 px-4 py-2.5 text-body-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-black"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-caption font-semibold text-gray-500 uppercase tracking-wider">날짜</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1.5 w-full rounded-[8px] border border-gray-200 px-3 py-2.5 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-caption font-semibold text-gray-500 uppercase tracking-wider">시작</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1.5 w-full rounded-[8px] border border-gray-200 px-3 py-2.5 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
            />
          </div>
          <div>
            <label className="text-caption font-semibold text-gray-500 uppercase tracking-wider">종료</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1.5 w-full rounded-[8px] border border-gray-200 px-3 py-2.5 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-caption font-semibold text-gray-500 uppercase tracking-wider">내 상태</label>
            <select
              value={myStatus}
              onChange={(e) => setMyStatus(e.target.value as typeof myStatus)}
              className="mt-1.5 w-full rounded-[8px] border border-gray-200 px-3 py-2.5 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
            >
              {MY_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-caption font-semibold text-gray-500 uppercase tracking-wider">장소</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="장소 또는 온라인 링크"
            className="mt-1.5 w-full rounded-[8px] border border-gray-200 px-4 py-2.5 text-body-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-black"
          />
        </div>

        <div>
          <label className="text-caption font-semibold text-gray-500 uppercase tracking-wider">설명</label>
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
            <div className="space-y-4 rounded-lg border border-brand-100 bg-brand-50/30 p-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-600" />
                <span className="text-body-sm font-semibold text-brand-700">회의 조율</span>
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
                <label className="text-caption font-semibold text-gray-500 uppercase tracking-wider">회의 길이</label>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setMeetingDuration(opt.value)}
                      className={`rounded-[8px] border px-2 py-2 text-caption font-medium transition-colors ${
                        meetingDuration === opt.value ? 'border-black bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-caption font-semibold text-gray-500 uppercase tracking-wider">후보 시작</label>
                  <input
                    type="date"
                    value={candidateStartDate}
                    onChange={(e) => setCandidateStartDate(e.target.value)}
                    className="mt-1.5 w-full rounded-[8px] border border-gray-200 px-3 py-2 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-caption font-semibold text-gray-500 uppercase tracking-wider">후보 종료</label>
                  <input
                    type="date"
                    value={candidateEndDate}
                    onChange={(e) => setCandidateEndDate(e.target.value)}
                    className="mt-1.5 w-full rounded-[8px] border border-gray-200 px-3 py-2 text-body-sm text-gray-900 outline-none transition-colors focus:border-black"
                  />
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

export default function CalendarPage() {
  const today = new Date()
  const [baseDate, setBaseDate] = useState(today)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [events, setEvents] = useState<(CalendarEvent | MeetingEvent)[]>(MOCK_EVENTS)

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate])

  const weekStart = weekDays[0].date
  const weekEnd = weekDays[4].date
  const monthLabel = `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 ~ ${weekEnd.getMonth() + 1}월 ${weekEnd.getDate()}일`

  const weekEvents = useMemo(() => {
    const dateStrs = new Set(weekDays.map((d) => d.dateStr))
    return events.filter((e) => dateStrs.has(e.date))
  }, [events, weekDays])

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
    setBaseDate(today)
    setSelectedEvent(null)
  }, [today])

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
    setSelectedEvent(evt)
    setShowForm(false)
  }, [])

  const handleAddEvent = useCallback(() => {
    setEditEvent(null)
    setShowForm(true)
    setSelectedEvent(null)
  }, [])

  const handleEditEvent = useCallback(() => {
    if (selectedEvent) {
      setEditEvent(selectedEvent)
      setShowForm(true)
    }
  }, [selectedEvent])

  const getEventsForDay = useCallback((dateStr: string) => {
    return weekEvents.filter((e) => e.date === dateStr)
  }, [weekEvents])

  const candidateSlots = useMemo(() => {
    return CANDIDATE_SLOTS.filter((s) => {
      const slotDate = new Date(s.date + 'T00:00:00')
      return slotDate >= weekStart && slotDate <= weekEnd
    })
  }, [weekStart, weekEnd])

  const slotColor = (status: string) => {
    if (status === 'all') return 'border-green-200 bg-green-50 text-green-700'
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  const slotIcon = (status: string) => {
    if (status === 'all') return <CheckCircle className="h-3.5 w-3.5" />
    return <HelpCircle className="h-3.5 w-3.5" />
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={goToday} className="rounded-[8px] border border-gray-200 px-3 py-1.5 text-caption font-medium text-gray-700 hover:bg-gray-50">
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
          <h1 className="text-title font-semibold text-gray-900">{monthLabel}</h1>
        </div>
        <button
          onClick={handleAddEvent}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-gray-900 px-4 py-2 text-body-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          일정 추가
        </button>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Calendar grid area */}
        <div className="flex flex-1 flex-col">
          {/* Desktop: time grid */}
          <div className="hidden flex-1 flex-col lg:flex">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-gray-200 bg-white">
              <div className="px-2 py-2" />
              {weekDays.map((day) => (
                <div key={day.dateStr} className={`px-2 py-2 text-center ${day.isToday ? 'bg-brand-50/50' : ''}`}>
                  <span className="text-caption font-medium text-gray-500">{day.dayName}</span>
                  <span className={`ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-title font-semibold ${
                    day.isToday ? 'bg-gray-900 text-white' : 'text-gray-900'
                  }`}>
                    {day.dayNum}
                  </span>
                </div>
              ))}
            </div>

            {/* Time grid body */}
            <div className="grid grid-cols-[60px_repeat(5,1fr)] flex-1 overflow-y-auto bg-white">
              {HOURS.map((hour) => (
                <div key={hour} className="contents">
                  <div className="relative border-r border-b border-gray-100 px-2 pt-1 text-right">
                    <span className="text-2xs text-gray-400">{formatTimeDisplay(hour, 0)}</span>
                  </div>
                  {weekDays.map((day) => {
                    const dayEvents = getEventsForDay(day.dateStr).filter((e) => {
                      const eh = Number(e.startTime.split(':')[0])
                      return eh === hour
                    })
                    return (
                      <div key={day.dateStr} className="relative min-h-[48px] border-b border-r border-gray-50 p-0.5">
                        {dayEvents.map((evt) => {
                          const dur = eventDurationMinutes(evt.startTime, evt.endTime)
                          const rowSpan = Math.max(1, Math.round(dur / 60))
                          return (
                            <div
                              key={evt.id}
                              className="mb-0.5"
                              style={{ gridRow: `span ${rowSpan}` }}
                            >
                              <EventTimeBlock event={evt} onClick={() => handleSelectEvent(evt)} />
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: date list */}
          <div className="flex flex-col lg:hidden">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(day.dateStr)
              return (
                <div key={day.dateStr} className="border-b border-gray-100 bg-white px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-title font-semibold ${
                      day.isToday ? 'bg-gray-900 text-white' : 'text-gray-900'
                    }`}>
                      {day.dayNum}
                    </span>
                    <span className="text-caption font-medium text-gray-500">{day.dayName}요일</span>
                    {day.isToday && <span className="text-2xs font-medium text-brand-600">오늘</span>}
                  </div>
                  {dayEvents.length === 0 ? (
                    <p className="pl-9 text-caption text-gray-400">일정 없음</p>
                  ) : (
                    <div className="space-y-1 pl-9">
                      {dayEvents.map((evt) => (
                        <button
                          key={evt.id}
                          onClick={() => handleSelectEvent(evt)}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                            selectedEvent?.id === evt.id ? 'bg-brand-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${typeDot[evt.type]}`} />
                          <span className="text-2xs text-gray-500 tabular-nums w-10 shrink-0">{evt.startTime.slice(0, 5)}</span>
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
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4 text-brand-600" />
                <h3 className="text-title font-semibold text-gray-900">이번 주 가능한 회의 시간</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {candidateSlots.map((slot, i) => (
                  <div key={i} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-medium ${slotColor(slot.status)}`}>
                    {slotIcon(slot.status)}
                    <span>{slot.date.slice(5)}</span>
                    <span>{slot.startTime.slice(0, 5)}</span>
                    <span className="opacity-60">·</span>
                    <span>{slot.status === 'all' ? '전원 가능' : '일부 확인 필요'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right detail panel (desktop) / bottom panel (mobile) */}
        {selectedEvent && (
          <div className="border-l border-gray-200 bg-white lg:w-[360px] lg:shrink-0">
            <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} onEdit={handleEditEvent} />
          </div>
        )}

        {/* Event form slide-over */}
        {showForm && (
          <div className="border-l border-gray-200 bg-white lg:w-[400px] lg:shrink-0">
            <EventFormPanel
              onClose={() => { setShowForm(false); setEditEvent(null) }}
              onSave={handleSaveEvent}
              editEvent={editEvent}
            />
          </div>
        )}

        {/* Empty state (when no selection and no form) */}
        {!selectedEvent && !showForm && (
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
