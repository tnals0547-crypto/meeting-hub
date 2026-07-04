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
}
