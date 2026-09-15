const CALENDAR_SCOPE_MARKERS = [
  'calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.events'
]

function hasCalendarScope(scope: string | null | undefined): boolean {
  if (!scope) {
    return false
  }

  return CALENDAR_SCOPE_MARKERS.some((marker) => scope.includes(marker))
}

export { hasCalendarScope }
