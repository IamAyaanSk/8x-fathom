import {
  DEFAULT_TOP_K,
  generateEmbedding,
  MAX_TOP_K,
  type MeetingRagSearchInput,
  type MeetingRagSearchResult
} from '@repo/ai'
import { embeddingToPgVectorLiteral } from '@repo/api-contract/transcript-embedding-chunks'
import { Prisma, prisma } from '@repo/db'

const MAX_EXCERPT_CHARS = 800

type TranscriptSearchRow = {
  meetingTitle: string
  startSec: number
  endSec: number
  speaker: string | null
  text: string
}

function _resolveTopK(topK: number | undefined): number {
  if (topK === undefined) {
    return DEFAULT_TOP_K
  }
  return Math.min(Math.max(topK, 1), MAX_TOP_K)
}

function _excerptFromChunkText(text: string): string {
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

function _rowsToSearchResult(
  rows: TranscriptSearchRow[]
): MeetingRagSearchResult {
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

async function _queryVector(query: string): Promise<Prisma.Sql> {
  const { embedding } = await generateEmbedding(query)
  const vectorLiteral = embeddingToPgVectorLiteral(embedding)
  return Prisma.raw(`'${vectorLiteral}'::vector`)
}

async function searchSingleMeetingTranscripts({
  userId,
  meetingId,
  query,
  topK
}: {
  userId: string
  meetingId: string
  query: string
  topK?: number
}): Promise<MeetingRagSearchResult> {
  const limit = _resolveTopK(topK)
  const queryVector = await _queryVector(query)

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
      AND tc."meetingId" = ${meetingId}
    ORDER BY tc.embedding <=> ${queryVector}
    LIMIT ${limit}
  `

  return _rowsToSearchResult(rows)
}

async function searchAllMeetingTranscripts({
  userId,
  query,
  topK
}: {
  userId: string
  query: string
  topK?: number
}): Promise<MeetingRagSearchResult> {
  const limit = _resolveTopK(topK)
  const queryVector = await _queryVector(query)

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
    ORDER BY tc.embedding <=> ${queryVector}
    LIMIT ${limit}
  `

  return _rowsToSearchResult(rows)
}

function createMeetingRagSearchDeps({
  userId,
  meetingId
}: {
  userId: string
  meetingId: string
}): {
  searchSingleMeetBase: (
    input: MeetingRagSearchInput
  ) => Promise<MeetingRagSearchResult>
  searchAllMeetBase: (
    input: MeetingRagSearchInput
  ) => Promise<MeetingRagSearchResult>
} {
  return {
    searchSingleMeetBase: (input) =>
      searchSingleMeetingTranscripts({
        userId,
        meetingId,
        query: input.query,
        topK: input.topK
      }),
    searchAllMeetBase: (input) =>
      searchAllMeetingTranscripts({
        userId,
        query: input.query,
        topK: input.topK
      })
  }
}

export { createMeetingRagSearchDeps }
