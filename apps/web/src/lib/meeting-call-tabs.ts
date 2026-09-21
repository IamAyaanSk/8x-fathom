import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import { isMeetingEnded } from '@repo/shared-utils/meeting'
import { DateTime } from 'luxon'

type MeetingCallTab = 'upcoming' | 'live' | 'my-calls'

type CategorizedMeetings = {
  upcoming: MeetingListItem[]
  live: MeetingListItem[]
  myCalls: MeetingListItem[]
}

function isLiveCall(meeting: MeetingListItem): boolean {
  return meeting.uiPhase === 'in_call_recording'
}

function isReadyCall(meeting: MeetingListItem): boolean {
  return meeting.uiPhase === 'ready'
}

function isTranscribingCall(meeting: MeetingListItem): boolean {
  return meeting.uiPhase === 'transcribing'
}

function isPastCall(meeting: MeetingListItem, nowMs: number): boolean {
  return isMeetingEnded(meeting.endTime, nowMs)
}

function isMyCall(meeting: MeetingListItem, nowMs: number): boolean {
  if (isLiveCall(meeting)) {
    return false
  }
  return (
    isReadyCall(meeting) ||
    isTranscribingCall(meeting) ||
    isPastCall(meeting, nowMs)
  )
}

function isUpcomingCall(meeting: MeetingListItem, nowMs: number): boolean {
  if (isLiveCall(meeting) || isMyCall(meeting, nowMs)) {
    return false
  }
  return !isMeetingEnded(meeting.endTime, nowMs)
}

function categorizeMeetingsForTabs({
  openMeetings,
  pastMeetings,
  nowMs
}: {
  openMeetings: MeetingListItem[]
  pastMeetings: MeetingListItem[]
  nowMs: number
}): CategorizedMeetings {
  const live: MeetingListItem[] = []
  const upcoming: MeetingListItem[] = []

  for (const meeting of openMeetings) {
    if (isLiveCall(meeting)) {
      live.push(meeting)
      continue
    }
    if (isUpcomingCall(meeting, nowMs)) {
      upcoming.push(meeting)
    }
  }

  const myCallsById = new Map<string, MeetingListItem>()
  for (const meeting of pastMeetings) {
    myCallsById.set(meeting.id, meeting)
  }
  for (const meeting of openMeetings) {
    if (isMyCall(meeting, nowMs)) {
      myCallsById.set(meeting.id, meeting)
    }
  }

  const myCalls = [...myCallsById.values()].sort(
    (left, right) =>
      DateTime.fromISO(right.startTime).toMillis() -
      DateTime.fromISO(left.startTime).toMillis()
  )

  return { upcoming, live, myCalls }
}

export type { CategorizedMeetings, MeetingCallTab }
export {
  categorizeMeetingsForTabs,
  isLiveCall,
  isMyCall,
  isPastCall,
  isReadyCall,
  isTranscribingCall,
  isUpcomingCall
}
