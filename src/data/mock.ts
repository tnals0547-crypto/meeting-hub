import type { Meeting, TeamMember } from '@/types/meeting'
import { addDays, getCalendarBaseDate, toDateString } from '@/lib/date'

export const teamMembers: TeamMember[] = [
  { id: 'm1', name: '김철수', department: '설비 기술', role: '엔지니어', preferredAvoidTimeRanges: ['13:00-14:00'] },
  { id: 'm2', name: '이영희', department: '공정 기술', role: '기술원', preferredAvoidDays: ['수'] },
  { id: 'm3', name: '박민준', department: '품질 관리', role: '엔지니어' },
  { id: 'm4', name: '정서연', department: '생산 관리', role: '책임', preferredAvoidTimeRanges: ['15:00-16:00'] },
  { id: 'm5', name: '최동훈', department: '수율 분석', role: '분석원', preferredAvoidDays: ['월'] },
  { id: 'm6', name: '한지우', department: '협력사 관리', role: '담당', preferredAvoidTimeRanges: ['09:00-10:00'] },
  { id: 'm7', name: '강수진', department: '설비 기술', role: '엔지니어' },
  { id: 'm8', name: '윤태호', department: '공정 기술', role: '기술원', preferredAvoidDays: ['금'] },
]

function addBusinessDays(date: Date, days: number) {
  const next = new Date(date)
  let remaining = days

  while (remaining > 0) {
    next.setDate(next.getDate() + 1)
    const day = next.getDay()
    if (day !== 0 && day !== 6) remaining -= 1
  }

  return next
}

const scheduleBaseDate = getCalendarBaseDate()

export const mockScheduleDates = {
  yieldImprovement: toDateString(addBusinessDays(scheduleBaseDate, 1)),
  q2Retrospective: toDateString(addBusinessDays(scheduleBaseDate, 2)),
  processChange: toDateString(addBusinessDays(scheduleBaseDate, 3)),
}

const replacementMeetingDate = mockScheduleDates.q2Retrospective
const replacementFollowUpDate = toDateString(addDays(new Date(replacementMeetingDate + 'T00:00:00'), 1))

export const meetings: Meeting[] = [
  {
    id: 'meeting-1',
    title: '수율 개선 회의',
    description:
      '설비 수율 개선 방안을 검토하고 주요 액션 항목을 논의합니다.',
    location: '회의실 A',
    createdAt: `${mockScheduleDates.yieldImprovement}T09:00:00`,
    organizerName: '김공정',
    myRole: 'organizer',
    requiredAttendanceRate: 60,
    status: 'pending',
    confirmedTimeSlot: null,
    participants: [
      {
        id: 'p1',
        name: '이서비스',
        department: '공정 기술',
        role: '기술원',
        responseStatus: 'pending',
        respondedAt: null,
        isRequired: false,
      },
      {
        id: 'p2',
        name: '박설비',
        department: '설비 기술',
        role: '엔지니어',
        responseStatus: 'pending',
        respondedAt: null,
        isRequired: false,
      },
      {
        id: 'p3',
        name: '최생산',
        department: '생산 관리',
        role: '책임',
        responseStatus: 'pending',
        respondedAt: null,
        isRequired: false,
      },
      {
        id: 'p4',
        name: '정분석',
        department: '수율 분석',
        role: '분석원',
        responseStatus: 'pending',
        respondedAt: null,
        isRequired: false,
      },
    ],
  },
  {
    id: 'meeting-2',
    title: '공정 변경 검토',
    description:
      '신규 공정 변경 사항을 검토하고 적용 일정을 논의합니다.',
    location: '회의실 B',
    createdAt: `${mockScheduleDates.processChange}T14:00:00`,
    organizerName: '박공정',
    myRole: 'participant',
    requiredAttendanceRate: 70,
    status: 'response_collecting',
    confirmedTimeSlot: null,
    participants: [
      {
        id: 'p5',
        name: '김기술',
        department: '공정 기술',
        role: '기술원',
        responseStatus: 'approved',
        respondedAt: `${mockScheduleDates.processChange}T10:00:00`,
        isRequired: false,
      },
      {
        id: 'p6',
        name: '이엔지',
        department: '설비 기술',
        role: '엔지니어',
        responseStatus: 'approved',
        respondedAt: `${mockScheduleDates.processChange}T11:00:00`,
        isRequired: false,
      },
      {
        id: 'p7',
        name: '박공정',
        department: '생산 관리',
        role: '책임',
        responseStatus: 'approved',
        respondedAt: `${mockScheduleDates.processChange}T09:00:00`,
        isRequired: false,
      },
      {
        id: 'p8',
        name: '최협력',
        department: '협력사 관리',
        role: '담당',
        responseStatus: 'declined',
        respondedAt: `${mockScheduleDates.processChange}T15:00:00`,
        isRequired: false,
      },
      {
        id: 'p9',
        name: '정분석',
        department: '수율 분석',
        role: '분석원',
        responseStatus: 'pending',
        respondedAt: null,
        isRequired: false,
      },
    ],
  },
  {
    id: 'meeting-3',
    title: 'Q2 회고',
    description:
      '2분기 목표 달성 현황을 점검하고 팀별 회고를 진행합니다.',
    location: '대회의실',
    createdAt: `${mockScheduleDates.q2Retrospective}T10:00:00`,
    organizerName: '최리더',
    myRole: 'organizer',
    requiredAttendanceRate: 75,
    status: 'response_complete',
    confirmedTimeSlot: {
      date: replacementMeetingDate,
      startTime: '14:00',
      endTime: '15:00',
    },
    participants: [
      {
        id: 'p10',
        name: '최리더',
        department: '공정 기술',
        role: '공정 리드',
        responseStatus: 'approved',
        respondedAt: `${mockScheduleDates.q2Retrospective}T08:00:00`,
        isRequired: true,
      },
      {
        id: 'p11',
        name: '김기술',
        department: '공정 기술',
        role: '기술원',
        responseStatus: 'approved',
        respondedAt: `${mockScheduleDates.q2Retrospective}T09:30:00`,
        isRequired: false,
      },
      {
        id: 'p12',
        name: '이서비스',
        department: '공정 기술',
        role: '기술원',
        responseStatus: 'approved',
        respondedAt: `${mockScheduleDates.q2Retrospective}T13:00:00`,
        isRequired: false,
      },
      {
        id: 'p13',
        name: '박설비',
        department: '설비 기술',
        role: '엔지니어',
        responseStatus: 'declined',
        respondedAt: `${mockScheduleDates.q2Retrospective}T10:00:00`,
        isRequired: true,
      },
    ],
    replacementCandidates: [
      {
        id: 'c1',
        name: '김하준',
        department: '설비 기술',
        role: '엔지니어',
        rationale: ['같은 팀', '같은 역할', '설비 운영 프로젝트 경험'],
        availability: 'available',
        calendarEvents: [
          {
            date: replacementMeetingDate,
            startTime: '13:30',
            endTime: '15:00',
          },
        ],
      },
      {
        id: 'c2',
        name: '이서연',
        department: '설비 기술',
        role: '엔지니어',
        rationale: ['같은 팀', '같은 역할'],
        availability: 'in_meeting',
        calendarEvents: [
          {
            date: replacementMeetingDate,
            startTime: '16:00',
            endTime: '17:00',
          },
        ],
      },
      {
        id: 'c3',
        name: '최민재',
        department: '공정 기술',
        role: '기술원',
        rationale: ['같은 공정 기술 파트', '유사 업무 경험'],
        availability: 'focused',
        calendarEvents: [
          {
            date: replacementFollowUpDate,
            startTime: '10:00',
            endTime: '11:00',
          },
        ],
      },
    ],
  },
  {
    id: 'meeting-4',
    title: '상반기 품질 개선 리뷰',
    description:
      '상반기 품질 지표를 검토하고 재발 방지 액션의 담당자를 확정했습니다.',
    location: '회의실 C',
    createdAt: '2026-06-20T13:00:00',
    organizerName: '정품질',
    myRole: 'organizer',
    requiredAttendanceRate: 80,
    status: 'completed',
    confirmedTimeSlot: {
      date: '2026-06-25',
      startTime: '14:00',
      endTime: '15:00',
    },
    participants: [
      {
        id: 'p14',
        name: '정품질',
        department: '품질 관리',
        role: '책임',
        responseStatus: 'approved',
        respondedAt: '2026-06-21T09:00:00',
        isRequired: true,
      },
      {
        id: 'p15',
        name: '김공정',
        department: '공정 기술',
        role: '공정 리드',
        responseStatus: 'approved',
        respondedAt: '2026-06-21T10:20:00',
        isRequired: true,
      },
      {
        id: 'p16',
        name: '박설비',
        department: '설비 기술',
        role: '엔지니어',
        responseStatus: 'approved',
        respondedAt: '2026-06-21T11:10:00',
        isRequired: false,
      },
      {
        id: 'p17',
        name: '최생산',
        department: '생산 관리',
        role: '책임',
        responseStatus: 'approved',
        respondedAt: '2026-06-21T13:40:00',
        isRequired: false,
      },
    ],
    records: {
      minutes: [
        '불량률 상승 원인은 2라인 온도 편차와 원자재 입고 지연 영향으로 정리했습니다.',
        '온도 보정 기준을 7월 12일까지 재점검하고, 설비팀이 점검 결과를 공유합니다.',
        '품질팀은 다음 리뷰 전까지 개선 액션별 재발률 변화를 추적합니다.',
      ],
      recording: {
        title: '상반기 품질 개선 리뷰 음성 기록',
        duration: '58분',
        status: 'available',
      },
      video: {
        title: '상반기 품질 개선 리뷰 화상회의 녹화',
        duration: '58분',
        status: 'available',
      },
    },
  },
  {
    id: 'meeting-5',
    title: '신규 설비 도입 회고',
    description:
      '신규 설비 도입 이후 운영 이슈와 후속 개선 항목을 정리했습니다.',
    location: '온라인',
    createdAt: '2026-06-12T10:00:00',
    organizerName: '박설비',
    myRole: 'participant',
    requiredAttendanceRate: 70,
    status: 'completed',
    confirmedTimeSlot: {
      date: '2026-06-18',
      startTime: '10:30',
      endTime: '11:30',
    },
    participants: [
      {
        id: 'p18',
        name: '박설비',
        department: '설비 기술',
        role: '엔지니어',
        responseStatus: 'approved',
        respondedAt: '2026-06-13T09:20:00',
        isRequired: true,
      },
      {
        id: 'p19',
        name: '이서비스',
        department: '공정 기술',
        role: '기술원',
        responseStatus: 'approved',
        respondedAt: '2026-06-13T10:10:00',
        isRequired: false,
      },
      {
        id: 'p20',
        name: '최동훈',
        department: '수율 분석',
        role: '분석원',
        responseStatus: 'approved',
        respondedAt: '2026-06-13T14:30:00',
        isRequired: false,
      },
    ],
    records: {
      minutes: [
        '초기 알람 빈도가 높았던 원인은 센서 민감도 기본값으로 확인했습니다.',
        '설비팀은 운영 표준서를 업데이트하고 교육 자료를 이번 주 안에 배포합니다.',
        '수율 분석팀은 2주 뒤 안정화 지표를 다시 공유합니다.',
      ],
      recording: {
        title: '신규 설비 도입 회고 음성 기록',
        duration: '62분',
        status: 'available',
      },
      video: {
        title: '신규 설비 도입 회고 화상회의 녹화',
        duration: '62분',
        status: 'processing',
      },
    },
  },
]
