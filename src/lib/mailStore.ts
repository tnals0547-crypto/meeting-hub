export type MailActionState = 'pending' | 'response_waiting' | 'processed'

export interface StoredMailState {
  isRead?: boolean
  actionState?: MailActionState
}

const STORAGE_KEY = 'relay-mail-states'
const CHANGE_EVENT = 'relay-mail-states-change'
const MAIL_TOTAL_COUNT = 10
const ACTIONABLE_MAIL_IDS = ['mail-2', 'mail-3', 'mail-1', 'mail-4'] as const
const EMPTY_MAIL_STATES: Record<string, StoredMailState> = {}
let cachedMailStatesRaw = ''
let cachedMailStatesSnapshot: Record<string, StoredMailState> = EMPTY_MAIL_STATES

export function readStoredMailStates() {
  if (typeof window === 'undefined') return {} as Record<string, StoredMailState>

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as Record<string, StoredMailState> : {}
  } catch {
    return {}
  }
}

export function writeStoredMailState(mailId: string, patch: StoredMailState) {
  if (typeof window === 'undefined') return

  const current = readStoredMailStates()
  const next = {
    ...current,
    [mailId]: {
      ...current[mailId],
      ...patch,
    },
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function mergeStoredMailStates<T extends { id: string; isRead: boolean; actionState?: MailActionState }>(
  items: T[],
  states: Record<string, StoredMailState> = readStoredMailStates(),
) {
  return items.map((item) => ({
    ...item,
    ...states[item.id],
  }))
}

export function subscribeStoredMailStates(listener: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function getStoredMailStatesSnapshot() {
  if (typeof window === 'undefined') return EMPTY_MAIL_STATES

  const raw = sessionStorage.getItem(STORAGE_KEY) ?? ''
  if (raw === cachedMailStatesRaw) return cachedMailStatesSnapshot

  cachedMailStatesRaw = raw
  cachedMailStatesSnapshot = readStoredMailStates()
  return cachedMailStatesSnapshot
}

export function getStoredMailStatesServerSnapshot() {
  return EMPTY_MAIL_STATES
}

export function getPendingMailActionCount(states: Record<string, StoredMailState>) {
  return ACTIONABLE_MAIL_IDS.filter((id) => {
    const actionState = states[id]?.actionState ?? 'pending'
    return actionState === 'pending'
  }).length
}

export function getMailTotalCount() {
  return MAIL_TOTAL_COUNT
}
