import { z } from 'zod/v4'

const baasSignedArtifactUrlsSchema = z.object({
  video: z.url().optional(),
  transcription: z.url().optional(),
  rawTranscription: z.url().optional(),
  audio: z.url().optional(),
  chatMessages: z.url().optional()
})

type BaasSignedArtifactUrls = z.infer<typeof baasSignedArtifactUrlsSchema>

type MeetingBaasCompletedArtifactFields = {
  video?: string | null
  transcription?: string | null
  raw_transcription?: string | null
  audio?: string | null
  chat_messages?: string | null
}

function _optionalUrl(value: string | null | undefined): string | undefined {
  if (value == null || value.length === 0) {
    return undefined
  }
  return value
}

function signedArtifactUrlsFromCompletedData(
  data: MeetingBaasCompletedArtifactFields
): BaasSignedArtifactUrls {
  return baasSignedArtifactUrlsSchema.parse({
    video: _optionalUrl(data.video),
    transcription: _optionalUrl(data.transcription),
    rawTranscription: _optionalUrl(data.raw_transcription),
    audio: _optionalUrl(data.audio),
    chatMessages: _optionalUrl(data.chat_messages)
  })
}

function mergeBaasSignedArtifactUrls(
  existing: unknown,
  incoming: BaasSignedArtifactUrls
): BaasSignedArtifactUrls {
  const parsed = baasSignedArtifactUrlsSchema.safeParse(existing)
  const base = parsed.success ? parsed.data : {}

  return baasSignedArtifactUrlsSchema.parse({
    ...base,
    ...Object.fromEntries(
      Object.entries(incoming).filter(([, value]) => value != null)
    )
  })
}

function transcriptionSignedUrl(
  urls: BaasSignedArtifactUrls
): string | undefined {
  return urls.transcription ?? urls.rawTranscription
}

export type { BaasSignedArtifactUrls }
export {
  baasSignedArtifactUrlsSchema,
  mergeBaasSignedArtifactUrls,
  signedArtifactUrlsFromCompletedData,
  transcriptionSignedUrl
}
