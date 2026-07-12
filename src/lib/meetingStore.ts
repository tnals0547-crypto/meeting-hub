import type { Meeting } from '@/types/meeting'

const STORAGE_PREFIX = 'meeting-'
const FORM_STORAGE_KEY = 'newMeetingForm'
const CHANGE_EVENT = 'relay-meeting-states-change'
const EMPTY_MEETINGS: Meeting[] = []
let cachedMeetingsSignature = ''
let cachedMeetingsSnapshot: Meeting[] = EMPTY_MEETINGS

export function getMeetingStorageKey(id: string) {
  return `${STORAGE_PREFIX}${id}`
}

export function readStoredMeeting(id: string): Meeting | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = sessionStorage.getItem(getMeetingStorageKey(id))
    if (!stored) return null
    const meeting = JSON.parse(stored) as Meeting
    if (!meeting.myRole) meeting.myRole = 'organizer'
    return meeting
  } catch {
    return null
  }
}

export function writeStoredMeeting(meeting: Meeting) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(getMeetingStorageKey(meeting.id), JSON.stringify(meeting))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function readStoredMeetings() {
  const stored: Meeting[] = []
  if (typeof window === 'undefined') return stored

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX) && key !== FORM_STORAGE_KEY) {
      const id = key.slice(STORAGE_PREFIX.length)
      const meeting = readStoredMeeting(id)
      if (meeting) stored.push(meeting)
    }
  }

  return stored
}

export function mergeMeetings(baseMeetings: Meeting[], storedMeetings: Meeting[]) {
  const merged = new Map<string, Meeting>()
  baseMeetings.forEach((meeting) => merged.set(meeting.id, meeting))
  storedMeetings.forEach((meeting) => merged.set(meeting.id, meeting))
  return Array.from(merged.values())
}

export function subscribeStoredMeetings(listener: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function getStoredMeetingsSnapshot() {
  if (typeof window === 'undefined') return EMPTY_MEETINGS

  const entries: string[] = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX) && key !== FORM_STORAGE_KEY) {
      entries.push(`${key}:${sessionStorage.getItem(key) ?? ''}`)
    }
  }
  const signature = entries.sort().join('|')
  if (signature === cachedMeetingsSignature) return cachedMeetingsSnapshot

  cachedMeetingsSignature = signature
  cachedMeetingsSnapshot = readStoredMeetings()
  return cachedMeetingsSnapshot
}

export function getStoredMeetingsServerSnapshot() {
  return EMPTY_MEETINGS
}
