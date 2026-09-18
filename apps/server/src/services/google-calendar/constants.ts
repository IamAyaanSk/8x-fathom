export const CALENDAR_SCOPE_MARKERS = [
  'calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.events'
]

export const GOOGLE_CALENDAR_EVENTS_READONLY_SCOPE =
  'https://www.googleapis.com/auth/calendar.events.readonly'

export const CALENDAR_SYNC_WINDOW_DAYS = 2

export const PRIMARY_CALENDAR_ID = 'primary'

export const CALENDAR_WEBHOOK_PATH = '/calendar/webhook'

export const CALENDAR_WATCH_RENEW_BEFORE_MS = 24 * 60 * 60 * 1000
export const CALENDAR_WATCH_DURATION_MS = 7 * 24 * 60 * 60 * 1000 - 60_000
