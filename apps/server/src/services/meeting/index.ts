import type { calendar_v3 } from 'googleapis'

function extractMeetingUrlFromGoogleEvent(event: calendar_v3.Schema$Event) {
  const videoEntry = event.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === 'video' && entry.uri
  )

  if (videoEntry?.uri) {
    return videoEntry.uri
  }

  if (event.hangoutLink) {
    return event.hangoutLink
  }

  return null
}

function isParticipantBot(name: string) {
  const isNoteTakerInName = name.includes('notetaker')
  const isBotInName =
    name.includes('8x') || name.includes('bot') || name.includes('meetingbaas')

  if (isNoteTakerInName || isBotInName) return true

  return false
}

export { extractMeetingUrlFromGoogleEvent, isParticipantBot }
