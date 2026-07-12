import type { Meeting } from '@/types/meeting'

export function normalizeSearchQuery(query?: string | null) {
  return (query ?? '').trim().toLowerCase()
}

export function matchesSearch(textParts: Array<string | number | null | undefined>, query?: string | null) {
  const normalizedQuery = normalizeSearchQuery(query)
  if (!normalizedQuery) return true

  return textParts
    .filter((part): part is string | number => part !== null && part !== undefined)
    .some((part) => String(part).toLowerCase().includes(normalizedQuery))
}

export function getMeetingSearchParts(meeting: Meeting) {
  return [
    meeting.title,
    meeting.description,
    meeting.noticeMessage,
    meeting.location,
    meeting.organizerName,
    meeting.status,
    meeting.confirmedTimeSlot?.date,
    meeting.confirmedTimeSlot?.startTime,
    meeting.confirmedTimeSlot?.endTime,
    ...meeting.participants.flatMap((participant) => [
      participant.name,
      participant.department,
      participant.role,
      participant.responseStatus,
    ]),
    ...(meeting.replacementCandidates ?? []).flatMap((candidate) => [
      candidate.name,
      candidate.department,
      candidate.role,
      candidate.availability,
      ...candidate.rationale,
    ]),
    ...(meeting.records?.minutes ?? []),
  ]
}
