export type MeetingStatus = 'pending' | 'response_collecting' | 'response_complete' | 'confirmed'

export type ResponseStatus = 'pending' | 'approved' | 'declined'

export interface TimeSlot {
  date: string
  startTime: string
  endTime: string
}

export interface Participant {
  id: string
  name: string
  department: string
  role: string
  responseStatus: ResponseStatus
  respondedAt: string | null
  isRequired: boolean
}

export type AvailabilityStatus = 'available' | 'in_meeting' | 'focused' | 'on_leave'

export type MeetingDuration = '30m' | '60m' | '90m' | '120m'

export interface TimeSlotWithAvailability {
  date: string
  startTime: string
  endTime: string
  availableMemberIds: string[]
  totalMemberCount: number
  requiredAvailableCount: number
  requiredTotalCount: number
  allRequiredAvailable: boolean
}

export interface TeamMember {
  id: string
  name: string
  department: string
  role: string
}

export interface ReplacementCandidate {
  id: string
  name: string
  department: string
  role: string
  rationale: string[]
  availability: AvailabilityStatus
}

export interface Meeting {
  id: string
  title: string
  description: string
  location: string
  createdAt: string
  organizerName: string
  participants: Participant[]
  requiredAttendanceRate: number
  status: MeetingStatus
  confirmedTimeSlot: TimeSlot | null
  replacementCandidates?: ReplacementCandidate[]
}
