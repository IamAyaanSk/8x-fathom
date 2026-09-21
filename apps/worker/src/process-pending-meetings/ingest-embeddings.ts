import { randomUUID } from 'node:crypto'

import { embeddingToPgVectorLiteral, generateEmbeddings } from '@repo/ai'
import { prisma } from '@repo/db'
import { getMeetingTranscriptData } from '@repo/meeting-dispatch'

import { UnrecoverableTranscriptArtifactError } from '#src/error'
import { TRANSCRIPT_CHUNK_MAX_CHARS } from '#src/process-pending-meetings/constants'
import { getR2ObjectUtf8 } from '#src/r2-storage'
import { extendMeetingProcessingLease, failMeetingProcessing } from '#src/utils'

interface TranscriptChunk {
  startSec: number
  endSec: number
  speaker: string | null
  text: string
}

type TranscriptLine = {
  startSec: number
  endSec: number
  speaker: string | null
  text: string
}

function _formatTranscriptLine(line: {
  speaker: string | null
  text: string
}): string {
  return line.speaker ? `${line.speaker}: ${line.text}` : line.text
}

function _createTranscriptChunk(
  meetingId: string,
  lines: TranscriptLine[]
): TranscriptChunk {
  const first = lines[0]!
  const last = lines[lines.length - 1]!
  const speakers = [...new Set(lines.map((l) => l.speaker).filter(Boolean))]
  const body = lines.map(_formatTranscriptLine).join('\n')

  return {
    startSec: Math.floor(first.startSec),
    endSec: Math.ceil(last.endSec),
    speaker: speakers.length === 1 ? (speakers[0] ?? null) : null,
    text: `Meeting ID: ${meetingId}\n${body}`
  }
}

function _buildTranscriptChunks(
  meetingId: string,
  lines: TranscriptLine[]
): TranscriptChunk[] {
  if (lines.length === 0) {
    return []
  }

  const chunks: TranscriptChunk[] = []
  let currentLines: TranscriptLine[] = []
  let currentLength = 0

  for (const line of lines) {
    const lineText = _formatTranscriptLine(line)

    if (
      currentLines.length > 0 &&
      currentLength + lineText.length > TRANSCRIPT_CHUNK_MAX_CHARS
    ) {
      chunks.push(_createTranscriptChunk(meetingId, currentLines))
      currentLines = []
      currentLength = 0
    }

    currentLines.push(line)
    currentLength += lineText.length + 1
  }

  if (currentLines.length > 0) {
    chunks.push(_createTranscriptChunk(meetingId, currentLines))
  }

  return chunks
}

export async function ingestMeetingEmbeddings(
  meetingId: string
): Promise<void> {
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
    const { lines } = getMeetingTranscriptData(rawTranscript)
    const chunks = _buildTranscriptChunks(meeting.id, lines)

    const { embeddings } = await generateEmbeddings(
      chunks.map((chunk) => chunk.text)
    )

    if (embeddings.length !== chunks.length) {
      throw new UnrecoverableTranscriptArtifactError(
        'Embedding count does not match transcript chunk count'
      )
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
        const vectorLiteral = embeddingToPgVectorLiteral(embedding)

        await tx.$executeRawUnsafe(
          `INSERT INTO "transcript_chunk" ("id", "meetingId", "startSec", "endSec", "speaker", "text", "embedding", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7::vector, NOW())`,
          id,
          meeting.id,
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
      `Transcript embeddings ingest failed for ${meetingId}: `,
      error
    )

    if (error instanceof UnrecoverableTranscriptArtifactError) {
      await failMeetingProcessing(
        meetingId,
        `Transcript embeddings: ${error.message}`
      )
    }
  }
}
