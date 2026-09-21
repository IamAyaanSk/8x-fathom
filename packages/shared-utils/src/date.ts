import { DateTime } from 'luxon'

function calendarDurationSec(startTime: Date, endTime: Date): number | null {
  const start = DateTime.fromJSDate(startTime)
  const end = DateTime.fromJSDate(endTime)
  const durationSec = Math.floor(end.diff(start, 'seconds').seconds)
  return durationSec > 0 ? durationSec : null
}

function parseValidDate(
  value: string | number | Date | null | undefined
): Date | null {
  if (value === null || value === undefined) {
    return null
  }

  const date =
    value instanceof Date
      ? value
      : typeof value === 'number'
        ? new Date(value < 1e12 ? value * 1000 : value)
        : new Date(value)

  return isNaN(date.getTime()) ? null : date
}

function parseSafeDate(
  value: string | number | Date | null | undefined,
  fallback = new Date()
): Date {
  return parseValidDate(value) ?? fallback
}

function dateToSafeIso(
  value: string | number | Date | null | undefined
): string | null {
  const date = parseValidDate(value)
  return date ? date.toISOString() : null
}

export { calendarDurationSec, dateToSafeIso, parseSafeDate, parseValidDate }
