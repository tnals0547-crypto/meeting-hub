const DAY_MS = 24 * 60 * 60 * 1000

export function toDateString(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function getTodayString() {
  return toDateString(new Date())
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function getDaysBetween(startDate: string, endDate: string) {
  return (
    Math.ceil(
      (new Date(endDate + 'T00:00:00').getTime() -
        new Date(startDate + 'T00:00:00').getTime()) /
        DAY_MS,
    ) + 1
  )
}

export function getWeekLaterString(days = 7) {
  return toDateString(addDays(new Date(), days))
}

export function getCalendarBaseDate(date = new Date()) {
  const next = new Date(date)
  const day = next.getDay()
  if (day === 6) next.setDate(next.getDate() + 2)
  if (day === 0) next.setDate(next.getDate() + 1)
  return next
}
