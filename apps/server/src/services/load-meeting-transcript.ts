import { formatMeetingBaasTranscriptTextFromJson } from '@repo/api-contract/meeting-baas-transcript'

import { getR2ObjectUtf8 } from '#src/r2-storage'

async function loadMeetingTranscriptText(
  transcriptR2Key: string
): Promise<string> {
  const rawTranscript = await getR2ObjectUtf8(transcriptR2Key)
  return formatMeetingBaasTranscriptTextFromJson(rawTranscript)
}

export { loadMeetingTranscriptText }
