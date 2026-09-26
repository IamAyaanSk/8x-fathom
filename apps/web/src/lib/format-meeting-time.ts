import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'

import {
  formatMeetingCardWeekday,
  getMeetingDayGroupLabel
} from '#lib/meeting-day-groups'

type MeetingRelativeStatus = {
  label: string
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive'
  isLive: boolean
}

type MeetingPlatform = {
  name: string
  kind: 'google_meet' | 'zoom' | 'teams' | 'generic'
}

function formatMeetingStartTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

function formatMeetingEndTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

function formatMeetingTimeRange(
  startTimeIso: string,
  endTimeIso: string
): string {
  const start = formatMeetingStartTime(startTimeIso)
  const end = formatMeetingEndTime(endTimeIso)
  return `${start} - ${end}`
}

function getGreeting(date: Date): string {
  const hour = date.getHours()
  if (hour < 12) {
    return 'Good morning'
  }
  if (hour < 17) {
    return 'Good afternoon'
  }
  return 'Good evening'
}

function getMeetingRelativeStatus(
  meeting: MeetingListItem,
  nowMs: number
): MeetingRelativeStatus {
  if (
    meeting.uiPhase === 'in_call_recording' ||
    meeting.baasStatus === 'in_call_recording'
  ) {
    return {
      label: 'Recording in progress',
      badgeVariant: 'default',
      isLive: true
    }
  }

  if (
    meeting.uiPhase === 'in_waiting_room' ||
    meeting.baasStatus === 'in_waiting_room'
  ) {
    return {
      label: 'In waiting room…',
      badgeVariant: 'secondary',
      isLive: false
    }
  }

  if (meeting.uiPhase === 'joining' || meeting.baasStatus === 'joining') {
    return {
      label: 'Bot is joining…',
      badgeVariant: 'secondary',
      isLive: false
    }
  }

  if (
    meeting.uiPhase === 'transcribing' ||
    meeting.baasStatus === 'transcribing'
  ) {
    return {
      label: 'Transcribing call…',
      badgeVariant: 'secondary',
      isLive: false
    }
  }

  if (meeting.uiPhase === 'call_ended_processing') {
    return {
      label: 'Processing recording…',
      badgeVariant: 'secondary',
      isLive: false
    }
  }

  if (meeting.uiPhase === 'failed_to_join') {
    return {
      label: 'Failed to join',
      badgeVariant: 'destructive',
      isLive: false
    }
  }

  if (meeting.uiPhase === 'failed_processing') {
    return {
      label: 'Processing failed',
      badgeVariant: 'destructive',
      isLive: false
    }
  }

  const startMs = Date.parse(meeting.startTime)
  const endMs = Date.parse(meeting.endTime)

  if (nowMs >= startMs && nowMs < endMs) {
    return {
      label: 'Happening now',
      badgeVariant: 'default',
      isLive: true
    }
  }

  if (nowMs >= endMs) {
    return {
      label: 'Call ended',
      badgeVariant: 'outline',
      isLive: false
    }
  }

  const diffMs = startMs - nowMs
  const diffMinutes = Math.round(diffMs / 60_000)

  if (diffMs <= 60_000 && diffMs > 0) {
    return {
      label: 'Starting now',
      badgeVariant: 'default',
      isLive: true
    }
  }

  if (diffMinutes < 60) {
    return {
      label: `Starts in ${diffMinutes} min${diffMinutes === 1 ? '' : 's'}`,
      badgeVariant: diffMinutes <= 15 ? 'default' : 'secondary',
      isLive: diffMinutes <= 5
    }
  }

  const dayLabel = getMeetingDayGroupLabel(meeting.startTime, nowMs)
  const formattedTime = formatMeetingStartTime(meeting.startTime)

  if (dayLabel === 'Today') {
    const hours = Math.floor(diffMinutes / 60)
    const mins = diffMinutes % 60
    const timeText =
      hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`
    return {
      label: `Today at ${formattedTime} (in ${timeText})`,
      badgeVariant: 'secondary',
      isLive: false
    }
  }

  if (dayLabel === 'Tomorrow') {
    return {
      label: `Tomorrow at ${formattedTime}`,
      badgeVariant: 'outline',
      isLive: false
    }
  }

  const weekday = formatMeetingCardWeekday(meeting.startTime)
  return {
    label: `${weekday} at ${formattedTime}`,
    badgeVariant: 'outline',
    isLive: false
  }
}

function getMeetingPlatform(url: string): MeetingPlatform {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.includes('meet.google.com') || host.includes('google.com')) {
      return { name: 'Google Meet', kind: 'google_meet' }
    }
    if (host.includes('zoom.us') || host.includes('zoom.com')) {
      return { name: 'Zoom', kind: 'zoom' }
    }
    if (
      host.includes('teams.microsoft.com') ||
      host.includes('teams.live.com')
    ) {
      return { name: 'Microsoft Teams', kind: 'teams' }
    }
  } catch {
    // fallback
  }
  return { name: 'Video Call', kind: 'generic' }
}

function formatMeetingStartingIn(
  startTimeIso: string,
  endTimeIso: string,
  nowMs: number,
  uiPhase?: string | null,
  baasStatus?: string | null
): string {
  if (uiPhase === 'in_call_recording' || baasStatus === 'in_call_recording') {
    return 'In call · Recording'
  }
  if (uiPhase === 'in_waiting_room' || baasStatus === 'in_waiting_room') {
    return 'In waiting room'
  }
  if (uiPhase === 'joining' || baasStatus === 'joining') {
    return 'Bot joining…'
  }
  if (uiPhase === 'failed_to_join') {
    return 'Failed to join'
  }

  const startMs = Date.parse(startTimeIso)
  const endMs = Date.parse(endTimeIso)

  if (nowMs >= startMs && nowMs < endMs) {
    return 'Happening now'
  }
  if (nowMs >= endMs) {
    return 'Call ended'
  }

  const diffMs = Math.max(0, startMs - nowMs)
  const totalMinutes = Math.floor(diffMs / 60_000)

  if (totalMinutes < 1) {
    return 'Starts in < 1m'
  }

  if (totalMinutes < 60) {
    return `Starts in ${totalMinutes}m`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (minutes === 0) {
    return `Starts in ${hours}h`
  }

  return `Starts in ${hours}h ${minutes}m`
}

function getUpcomingMeetingStatus(
  meeting: MeetingListItem,
  nowMs: number
): string {
  if (
    meeting.uiPhase === 'in_call_recording' ||
    meeting.baasStatus === 'in_call_recording'
  ) {
    return 'In call — recording'
  }

  if (
    meeting.uiPhase === 'in_waiting_room' ||
    meeting.baasStatus === 'in_waiting_room'
  ) {
    return 'In waiting room…'
  }

  if (meeting.uiPhase === 'joining' || meeting.baasStatus === 'joining') {
    return 'Joining… · May take up to 5 minutes to join'
  }

  if (
    meeting.uiPhase === 'transcribing' ||
    meeting.baasStatus === 'transcribing'
  ) {
    return 'Transcribing…'
  }

  if (meeting.uiPhase === 'call_ended_processing') {
    return 'Call ended, processing…'
  }

  if (meeting.uiPhase === 'failed_to_join') {
    return 'Failed to join'
  }

  if (meeting.uiPhase === 'failed_processing') {
    return 'Failed processing'
  }

  const startMs = Date.parse(meeting.startTime)
  const endMs = Date.parse(meeting.endTime)

  if (nowMs >= startMs && nowMs < endMs) {
    return 'Happening now'
  }

  if (nowMs >= endMs) {
    return 'Call ended'
  }

  const diffMs = Math.max(0, startMs - nowMs)
  const totalMinutes = Math.floor(diffMs / 60_000)

  if (totalMinutes < 1) {
    return 'Starts in < 1m'
  }

  if (totalMinutes < 60) {
    return `Starts in ${totalMinutes}m`
  }

  const dayLabel = getMeetingDayGroupLabel(meeting.startTime, nowMs)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (dayLabel === 'Today') {
    if (minutes === 0) {
      return `Starts in ${hours}h`
    }
    return `Starts in ${hours}h ${minutes}m`
  }

  if (dayLabel === 'Tomorrow') {
    return 'Scheduled for tomorrow'
  }

  return 'Scheduled'
}

export type { MeetingPlatform, MeetingRelativeStatus }
export {
  formatMeetingEndTime,
  formatMeetingStartTime,
  formatMeetingStartingIn,
  formatMeetingTimeRange,
  getGreeting,
  getMeetingPlatform,
  getMeetingRelativeStatus,
  getUpcomingMeetingStatus
}
