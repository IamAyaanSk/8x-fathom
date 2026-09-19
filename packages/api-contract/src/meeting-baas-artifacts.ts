import { z } from 'zod/v4'

const baasSignedArtifactUrlsSchema = z.object({
  video: z.url().optional(),
  transcription: z.url().optional(),
  rawTranscription: z.url().optional(),
  audio: z.url().optional(),
  chatMessages: z.url().optional()
})

type BaasSignedArtifactUrls = z.infer<typeof baasSignedArtifactUrlsSchema>

function transcriptionSignedUrl(
  urls: BaasSignedArtifactUrls
): string | undefined {
  return urls.transcription ?? urls.rawTranscription
}

export type { BaasSignedArtifactUrls }
export { baasSignedArtifactUrlsSchema, transcriptionSignedUrl }
