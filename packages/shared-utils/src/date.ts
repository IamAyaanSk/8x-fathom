function calendarDurationSec(startTime: Date, endTime: Date): number | null {
  const calendarSeconds = Math.max(
    0,
    Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
  )
  return calendarSeconds > 0 ? calendarSeconds : null
}

export { calendarDurationSec }
