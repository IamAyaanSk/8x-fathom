import { randomBytes } from 'node:crypto'

import { DEFAULT_TOP_K, generateEmbedding } from '@repo/ai'
import { embeddingToPgVectorLiteral } from '@repo/ai'
import { Prisma, prisma } from '@repo/db'
import type { calendar_v3 } from 'googleapis'

import { presignR2GetObjectUrl } from '#src/r2-storage'
import {
  MAX_EXCERPT_CHARS,
  RECORDING_PLAYBACK_PRESIGN_SECONDS
} from '#src/services/meeting/constants'

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

function createMeetingShareSlug() {
  return randomBytes(16).toString('base64url')
}

function _excerptFromChunkText(text: string) {
  const lines = text.split('\n')
  const firstLine = lines[0]
  const withoutHeader =
    firstLine !== undefined && firstLine.startsWith('Meeting ID:')
      ? lines.slice(1).join('\n')
      : text
  const trimmed = withoutHeader.trim()
  if (trimmed.length <= MAX_EXCERPT_CHARS) {
    return trimmed
  }
  return `${trimmed.slice(0, MAX_EXCERPT_CHARS).trim()}…`
}

type TranscriptSearchRow = {
  meetingTitle: string
  startSec: number
  endSec: number
  speaker: string | null
  text: string
}

async function searchMeetingTranscripts({
  userId,
  query
}: {
  userId: string
  query: string
}) {
  const { embedding } = await generateEmbedding(query)
  const vectorLiteral = embeddingToPgVectorLiteral(embedding)

  const rows = await prisma.$queryRaw<TranscriptSearchRow[]>`
    SELECT
      m.title AS "meetingTitle",
      tc."startSec" AS "startSec",
      tc."endSec" AS "endSec",
      tc.speaker AS speaker,
      tc.text AS text
    FROM transcript_chunk tc
    INNER JOIN meeting m ON m.id = tc."meetingId"
    WHERE m."userId" = ${userId}
      AND m."processingStatus" = 'ready'
    ORDER BY tc.embedding <=> ${Prisma.raw(`'${vectorLiteral}'::vector`)}
    LIMIT ${DEFAULT_TOP_K}
  `

  return {
    snippets: rows.map((row) => ({
      meetingTitle: row.meetingTitle,
      startSec: row.startSec,
      endSec: row.endSec,
      speaker: row.speaker,
      excerpt: _excerptFromChunkText(row.text)
    }))
  }
}

export {
  extractMeetingUrlFromGoogleEvent,
  getMeetingPlaybackUrl,
  createMeetingShareSlug,
  searchMeetingTranscripts
}
