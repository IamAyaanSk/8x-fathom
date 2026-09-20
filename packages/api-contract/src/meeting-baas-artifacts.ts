import { z } from 'zod/v4'

const baasSignedArtifactUrlsSchema = z.object({
  video: z.url().optional().nullable(),
  transcription: z.url().optional().nullable(),
  rawTranscription: z.url().optional().nullable(),
  audio: z.url().optional().nullable(),
  chatMessages: z.url().optional().nullable()
})

type BaasSignedArtifactUrls = z.infer<typeof baasSignedArtifactUrlsSchema>

function transcriptionSignedUrl(urls: BaasSignedArtifactUrls) {
  return urls.transcription ?? urls.rawTranscription
}

export type { BaasSignedArtifactUrls }
export { baasSignedArtifactUrlsSchema, transcriptionSignedUrl }
