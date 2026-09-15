import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'

type MeetingDayGroup = {
  label: string
  meetings: MeetingListItem[]
}

function _startOfLocalDay(ms: number): number {
  const date = new Date(ms)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function getMeetingDayGroupLabel(startTimeIso: string, nowMs: number): string {
  const meetingDay = _startOfLocalDay(Date.parse(startTimeIso))
  const today = _startOfLocalDay(nowMs)
  const yesterday = today - 86_400_000

  if (meetingDay === today) {
    return 'Today'
  }
  if (meetingDay === yesterday) {
    return 'Yesterday'
  }

  const daysAgo = Math.round((today - meetingDay) / 86_400_000)
  if (daysAgo > 0 && daysAgo < 7) {
    return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(
      new Date(meetingDay)
    )
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(meetingDay))
}

function formatMeetingCardWeekday(startTimeIso: string): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(
    new Date(startTimeIso)
  )
}

function formatMeetingDurationLabel(startTimeIso: string, endTimeIso: string) {
  const minutes = Math.max(
    1,
    Math.round((Date.parse(endTimeIso) - Date.parse(startTimeIso)) / 60_000)
  )
  return minutes === 1 ? '1 min' : `${minutes} mins`
}

function groupMeetingsByDay(
  meetings: MeetingListItem[],
  nowMs: number
): MeetingDayGroup[] {
  const groups = new Map<string, MeetingDayGroup>()

  for (const meeting of meetings) {
    const label = getMeetingDayGroupLabel(meeting.startTime, nowMs)
    const existing = groups.get(label)
    if (existing) {
      existing.meetings.push(meeting)
      continue
    }
    groups.set(label, { label, meetings: [meeting] })
  }

  return [...groups.values()]
}

export type { MeetingDayGroup }
export {
  formatMeetingCardWeekday,
  formatMeetingDurationLabel,
  getMeetingDayGroupLabel,
  groupMeetingsByDay
}
