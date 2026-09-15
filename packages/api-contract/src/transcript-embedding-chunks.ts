import {
  formatMeetingBaasTranscriptUtteranceLine,
  meetingBaasTranscriptUtterancesInOrder,
  type MeetingBaasOutputTranscription
} from './meeting-baas-transcript.js'

export const TRANSCRIPT_EMBEDDING_VECTOR_DIMENSIONS = 1024

export const DEFAULT_TRANSCRIPT_CHUNK_MAX_CHARS = 2_800

type TranscriptEmbeddingChunkDraft = {
  meetingId: string
  startSec: number
  endSec: number
  speaker: string | null
  text: string
}

type _UtteranceSlice = {
  line: string
  startSec: number
  endSec: number
  speaker: string | null
}

function _utteranceSlicesFromTranscription(
  transcription: MeetingBaasOutputTranscription
): _UtteranceSlice[] {
  const slices: _UtteranceSlice[] = []

  for (const utterance of meetingBaasTranscriptUtterancesInOrder(transcription)) {
    const line = formatMeetingBaasTranscriptUtteranceLine(utterance)
    if (!line) {
      continue
    }

    const startSec = Math.floor(utterance.start ?? 0)
    const endSec = Math.ceil(utterance.end ?? utterance.start ?? 0)
    const speaker = utterance.speaker?.trim() || null

    slices.push({
      line,
      startSec,
      endSec: Math.max(endSec, startSec),
      speaker
    })
  }

  if (slices.length === 0) {
    throw new Error('Meeting transcript has no utterances')
  }

  return slices
}

function _chunkHeader(meetingId: string): string {
  return `Meeting ID: ${meetingId}`
}

function _resolveChunkSpeaker(speakers: string[]): string | null {
  if (speakers.length === 0) {
    return null
  }
  const unique = [...new Set(speakers)]
  if (unique.length !== 1) {
    return null
  }
  return unique[0] ?? null
}

function _flushChunk({
  meetingId,
  slices
}: {
  meetingId: string
  slices: _UtteranceSlice[]
}): TranscriptEmbeddingChunkDraft {
  const first = slices[0]
  const last = slices[slices.length - 1]
  if (!first || !last) {
    throw new Error('Cannot flush an empty transcript chunk')
  }

  const header = _chunkHeader(meetingId)
  const body = slices.map((slice) => slice.line).join('\n')
  const speakers = slices
    .map((slice) => slice.speaker)
    .filter((name): name is string => name !== null)

  return {
    meetingId,
    startSec: first.startSec,
    endSec: last.endSec,
    speaker: _resolveChunkSpeaker(speakers),
    text: `${header}\n${body}`
  }
}

function buildTranscriptEmbeddingChunks({
  meetingId,
  transcription,
  maxChunkChars = DEFAULT_TRANSCRIPT_CHUNK_MAX_CHARS
}: {
  meetingId: string
  transcription: MeetingBaasOutputTranscription
  maxChunkChars?: number
}): TranscriptEmbeddingChunkDraft[] {
  const utteranceSlices = _utteranceSlicesFromTranscription(transcription)
  const header = _chunkHeader(meetingId)
  const chunks: TranscriptEmbeddingChunkDraft[] = []

  let currentSlices: _UtteranceSlice[] = []
  let currentBodyLength = 0

  const flush = () => {
    if (currentSlices.length === 0) {
      return
    }
    chunks.push(_flushChunk({ meetingId, slices: currentSlices }))
    currentSlices = []
    currentBodyLength = 0
  }

  for (const slice of utteranceSlices) {
    const lineLength = slice.line.length + 1
    const wouldExceed =
      currentSlices.length > 0 &&
      header.length + 1 + currentBodyLength + lineLength > maxChunkChars

    if (wouldExceed) {
      flush()
    }

    currentSlices.push(slice)
    currentBodyLength += lineLength
  }

  flush()

  return chunks
}

export {
  buildTranscriptEmbeddingChunks,
  type TranscriptEmbeddingChunkDraft
}
