import { presignR2GetObjectUrl } from '#src/r2-storage'

const RECORDING_PLAYBACK_PRESIGN_SECONDS = 3600

async function loadRecordingPlayback(recordingR2Key: string | null) {
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

function calendarDurationSec(startTime: Date, endTime: Date): number | null {
  const calendarSeconds = Math.max(
    0,
    Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
  )
  return calendarSeconds > 0 ? calendarSeconds : null
}

export { calendarDurationSec, loadRecordingPlayback }
