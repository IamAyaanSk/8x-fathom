import type { calendar_v3 } from 'googleapis'

import { presignR2GetObjectUrl } from '#src/r2-storage'
import { RECORDING_PLAYBACK_PRESIGN_SECONDS } from '#src/services/meeting/constants'

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

async function getMeetingPlaybackUrl(recordingR2Key: string | null) {
  if (!recordingR2Key) {
    return null
  }

  const expiresAt = new Date(
    Date.now() + RECORDING_PLAYBACK_PRESIGN_SECONDS * 1000
  )
  const url = await presignR2GetObjectUrl(
    recordingR2Key,
    RECORDING_PLAYBACK_PRESIGN_SECONDS
  )

  return {
    url,
    expiresAt: expiresAt.toISOString()
  }
}

export {
  extractMeetingUrlFromGoogleEvent,
  isParticipantBot,
  getMeetingPlaybackUrl
}
