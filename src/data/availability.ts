import { teamMembers } from '@/data/mock'
import { getTodayString, toDateString } from '@/lib/date'
import type { MeetingDuration, PreferenceConflict, TimeSlotWithAvailability } from '@/types/meeting'

interface BusySlot {
  memberId: string
  dayOfWeek: number
  startHour: number
  endHour: number
}

const BUSY_SLOTS: BusySlot[] = [
  { memberId: 'm1', dayOfWeek: 2, startHour: 10, endHour: 11 },
  { memberId: 'm4', dayOfWeek: 1, startHour: 13, endHour: 15 },
  { memberId: 'm4', dayOfWeek: 3, startHour: 10, endHour: 12 },
  { memberId: 'm6', dayOfWeek: 4, startHour: 14, endHour: 16 },
  { memberId: 'm8', dayOfWeek: 5, startHour: 9, endHour: 11 },
]

function isMemberAvailable(
  memberId: string,
  dayOfWeek: number,
  slotStartMinute: number,
  slotEndMinute: number,
): boolean {
  return !BUSY_SLOTS.some((busy) => {
    if (busy.memberId !== memberId) return false
    if (busy.dayOfWeek !== dayOfWeek) return false
    const busyStart = busy.startHour * 60
    const busyEnd = busy.endHour * 60
    return slotStartMinute < busyEnd && slotEndMinute > busyStart
  })
}

function overlapsLunch(slotStart: number, slotEnd: number): boolean {
  const lunchStart = 12 * 60
  const lunchEnd = 13 * 60
  return slotStart < lunchEnd && slotEnd > lunchStart
}

const DURATION_MINUTES: Record<MeetingDuration, number> = {
  '30m': 30,
  '60m': 60,
  '90m': 90,
  '120m': 120,
}

const WORK_START = 9 * 60
const WORK_END = 18 * 60
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const teamMemberById = new Map(teamMembers.map((member) => [member.id, member]))

function timeToMinutes(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function rangeOverlaps(slotStart: number, slotEnd: number, range: string) {
  const [start, end] = range.split('-')
  const rangeStart = timeToMinutes(start)
  const rangeEnd = timeToMinutes(end)
  return slotStart < rangeEnd && slotEnd > rangeStart
}

function getPreferenceConflicts(
  memberIds: string[],
  dayOfWeek: number,
  slotStartMinute: number,
  slotEndMinute: number,
): PreferenceConflict[] {
  const dayLabel = DAY_LABELS[dayOfWeek]
  const conflicts: PreferenceConflict[] = []

  for (const memberId of memberIds) {
    const member = teamMemberById.get(memberId)
    if (!member) continue

    const avoidDay = member.preferredAvoidDays?.includes(dayLabel)
    if (avoidDay) {
      conflicts.push({
        memberId,
        memberName: member.name,
        reason: `${dayLabel}요일 외근 가능성 있음`,
      })
      continue
    }

    const avoidRange = member.preferredAvoidTimeRanges?.find((range) =>
      rangeOverlaps(slotStartMinute, slotEndMinute, range),
    )
    if (avoidRange) {
      conflicts.push({
        memberId,
        memberName: member.name,
        reason: `${avoidRange} 업무 집중 시간`,
      })
    }
  }

  return conflicts
}

export function generateTimeSlots(
  startDate: string,
  endDate: string,
  duration: MeetingDuration,
  requiredMemberIds: string[],
  optionalMemberIds: string[],
  options: { includeWeekends?: boolean } = {},
): TimeSlotWithAvailability[] {
  const durMin = DURATION_MINUTES[duration]
  const allIds = [...requiredMemberIds, ...optionalMemberIds]
  const slots: TimeSlotWithAvailability[] = []

  const todayStr = getTodayString()
  const today = new Date(todayStr + 'T00:00:00')
  const requestedStart = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  const start = requestedStart < today ? today : requestedStart
  const now = new Date()
  const currentMinute = now.getHours() * 60 + now.getMinutes()

  const current = new Date(start)
  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (options.includeWeekends || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
      const dateStr = toDateString(current)

      for (let minute = WORK_START; minute + durMin <= WORK_END; minute += durMin) {
        if (overlapsLunch(minute, minute + durMin)) continue
        if (dateStr === todayStr && minute <= currentMinute) continue

        const startHour = Math.floor(minute / 60)
        const startMin = minute % 60
        const endMinute = minute + durMin
        const endHour = Math.floor(endMinute / 60)
        const endMin = endMinute % 60

        const availableMemberIds = allIds.filter((mid) =>
          isMemberAvailable(mid, dayOfWeek, minute, minute + durMin),
        )

        const requiredAvailable = requiredMemberIds.filter((mid) =>
          availableMemberIds.includes(mid),
        ).length
        const preferenceConflicts = getPreferenceConflicts(
          availableMemberIds,
          dayOfWeek,
          minute,
          minute + durMin,
        )

        slots.push({
          date: dateStr,
          startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
          endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
          availableMemberIds,
          preferenceConflicts,
          totalMemberCount: allIds.length,
          requiredAvailableCount: requiredAvailable,
          requiredTotalCount: requiredMemberIds.length,
          allRequiredAvailable: requiredAvailable === requiredMemberIds.length,
          hasPreferenceConflict: preferenceConflicts.length > 0,
        })
      }
    }
    current.setDate(current.getDate() + 1)
  }

  return slots
}

export function sortSlots(slots: TimeSlotWithAvailability[]): TimeSlotWithAvailability[] {
  return [...slots].sort((a, b) => {
    if (a.allRequiredAvailable !== b.allRequiredAvailable) {
      return a.allRequiredAvailable ? -1 : 1
    }
    if (a.hasPreferenceConflict !== b.hasPreferenceConflict) {
      return a.hasPreferenceConflict ? 1 : -1
    }
    if (a.preferenceConflicts.length !== b.preferenceConflicts.length) {
      return a.preferenceConflicts.length - b.preferenceConflicts.length
    }
    if (a.availableMemberIds.length !== b.availableMemberIds.length) {
      return b.availableMemberIds.length - a.availableMemberIds.length
    }
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return a.startTime < b.startTime ? -1 : 1
  })
}
