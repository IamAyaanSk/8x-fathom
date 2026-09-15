import '#src/env'
import { randomUUID } from 'node:crypto'

import { generateEmbeddings } from '@repo/ai'
import { parseMeetingBaasOutputTranscriptionFromJson } from '@repo/api-contract/meeting-baas-transcript'
import {
  buildTranscriptEmbeddingChunks,
  TRANSCRIPT_EMBEDDING_VECTOR_DIMENSIONS
} from '@repo/api-contract/transcript-embedding-chunks'
import { prisma } from '@repo/db'

import {
  extendMeetingProcessingLease,
  failMeetingProcessing,
  isUnrecoverableTranscriptArtifactError
} from '#src/meeting-processing-lifecycle'
import { getR2ObjectUtf8 } from '#src/r2-client'

function _errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

function _embeddingToPgVectorLiteral(embedding: readonly number[]): string {
  if (embedding.length !== TRANSCRIPT_EMBEDDING_VECTOR_DIMENSIONS) {
    throw new Error(
      `Expected embedding length ${TRANSCRIPT_EMBEDDING_VECTOR_DIMENSIONS}, received ${embedding.length}`
    )
  }

  return `[${embedding.join(',')}]`
}

async function ingestMeetingEmbeddings(meetingId: string): Promise<void> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      transcriptR2Key: true,
      transcriptEmbeddingsExtractedAt: true
    }
  })

  if (!meeting || meeting.transcriptEmbeddingsExtractedAt !== null) {
    return
  }

  if (!meeting.transcriptR2Key) {
    console.error(
      `Transcript embeddings skipped for ${meetingId}: missing transcriptR2Key`
    )
    await failMeetingProcessing(
      meetingId,
      'Missing transcript artifact in storage'
    )
    return
  }

  try {
    await extendMeetingProcessingLease(meetingId)
    const rawTranscript = await getR2ObjectUtf8(meeting.transcriptR2Key)
    const transcription =
      parseMeetingBaasOutputTranscriptionFromJson(rawTranscript)
    const chunks = buildTranscriptEmbeddingChunks({
      meetingId: meeting.id,
      transcription
    })

    const { embeddings } = await generateEmbeddings(
      chunks.map((chunk) => chunk.text)
    )

    if (embeddings.length !== chunks.length) {
      throw new Error('Embedding count does not match transcript chunk count')
    }

    await prisma.$transaction(async (tx) => {
      await tx.transcriptChunk.deleteMany({
        where: { meetingId: meeting.id }
      })

      for (let index = 0; index < chunks.length; index += 1) {
        const chunk = chunks[index]
        const embedding = embeddings[index]
        if (!chunk || !embedding) {
          throw new Error('Missing chunk or embedding at index')
        }

        const id = randomUUID()
        const vectorLiteral = _embeddingToPgVectorLiteral(embedding)

        await tx.$executeRawUnsafe(
          `INSERT INTO "transcript_chunk" ("id", "meetingId", "startSec", "endSec", "speaker", "text", "embedding", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7::vector, NOW())`,
          id,
          chunk.meetingId,
          chunk.startSec,
          chunk.endSec,
          chunk.speaker,
          chunk.text,
          vectorLiteral
        )
      }

      await tx.meeting.update({
        where: { id: meeting.id },
        data: { transcriptEmbeddingsExtractedAt: new Date() }
      })
    })
  } catch (error) {
    console.error(
      `Transcript embeddings ingest failed for ${meetingId}: ${_errorMessage(error)}`
    )
    if (isUnrecoverableTranscriptArtifactError(error)) {
      await failMeetingProcessing(
        meetingId,
        `Transcript embeddings: ${_errorMessage(error)}`
      )
    }
  }
}

export { ingestMeetingEmbeddings }
