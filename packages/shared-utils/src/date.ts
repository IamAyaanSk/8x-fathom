import { DateTime } from 'luxon'

function calendarDurationSec(startTime: Date, endTime: Date): number | null {
  const start = DateTime.fromJSDate(startTime)
  const end = DateTime.fromJSDate(endTime)
  const durationSec = Math.floor(end.diff(start, 'seconds').seconds)
  return durationSec > 0 ? durationSec : null
}

export { calendarDurationSec }
