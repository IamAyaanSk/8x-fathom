import type { calendar_v3 } from 'googleapis'

const MEETING_URL_PATTERN =
  /https?:\/\/(?:[\w-]+\.)?(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com|teams\.live\.com)\/[^\s]+/i

function extractMeetingUrlFromGoogleEvent(
  event: calendar_v3.Schema$Event
): string | null {
  const videoEntry = event.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === 'video' && entry.uri
  )
  if (videoEntry?.uri) {
    return videoEntry.uri
  }

  if (event.hangoutLink) {
    return event.hangoutLink
  }

  const location = event.location
  if (location) {
    const match = location.match(MEETING_URL_PATTERN)
    if (match?.[0]) {
      return match[0]
    }
  }

  return null
}

export { extractMeetingUrlFromGoogleEvent }
