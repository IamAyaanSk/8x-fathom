import {
  meetingTranscriptDurationSec,
  meetingTranscriptLinesFromJson,
  parseMeetingBaasOutputTranscriptionFromJson
} from '@repo/api-contract/meeting-baas-transcript'

import { getR2ObjectUtf8 } from '#src/r2-storage'
import { HttpError } from '#src/v1/errors/http-error'

async function loadMeetingTranscriptData(transcriptR2Key: string | null) {
  if (!transcriptR2Key) {
    throw new HttpError(409, 'Meeting transcript is not available yet')
  }

  let rawTranscript: string
  try {
    rawTranscript = await getR2ObjectUtf8(transcriptR2Key)
  } catch {
    throw new HttpError(502, 'Failed to load meeting transcript')
  }

  try {
    const lines = meetingTranscriptLinesFromJson(rawTranscript)
    const transcription =
      parseMeetingBaasOutputTranscriptionFromJson(rawTranscript)
    const durationSec = meetingTranscriptDurationSec(transcription)
    return { lines, durationSec }
  } catch {
    throw new HttpError(502, 'Failed to parse meeting transcript')
  }
}

export { loadMeetingTranscriptData }
