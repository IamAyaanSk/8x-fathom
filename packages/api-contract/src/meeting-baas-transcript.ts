import { z } from 'zod/v4'

const meetingBaasTranscriptWordSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
  confidence: z.number().optional()
})

const meetingBaasTranscriptUtteranceSchema = z.object({
  text: z.string(),
  language: z.string().optional(),
  start: z.number().optional(),
  end: z.number().optional(),
  confidence: z.number().optional(),
  channel: z.number().optional(),
  words: z.array(meetingBaasTranscriptWordSchema).optional(),
  speaker: z.string().optional()
})

const meetingBaasOutputTranscriptionSchema = z.object({
  bot_id: z.string(),
  provider: z.string().optional(),
  result: z.object({
    utterances: z.array(meetingBaasTranscriptUtteranceSchema),
    languages: z.array(z.string()).optional(),
    total_utterances: z.number().optional(),
    total_duration: z.number().optional()
  }),
  created_at: z.string().optional()
})

type MeetingBaasOutputTranscription = z.infer<
  typeof meetingBaasOutputTranscriptionSchema
>

type MeetingBaasTranscriptUtterance = z.infer<
  typeof meetingBaasTranscriptUtteranceSchema
>

function parseMeetingBaasOutputTranscription(
  data: unknown
): MeetingBaasOutputTranscription {
  return z.parse(meetingBaasOutputTranscriptionSchema, data)
}

function meetingBaasTranscriptUtterancesInOrder(
  transcription: MeetingBaasOutputTranscription
): MeetingBaasTranscriptUtterance[] {
  return [...transcription.result.utterances].sort(
    (left, right) => (left.start ?? 0) - (right.start ?? 0)
  )
}

function _formatTranscriptTimestampSeconds(seconds: number): string {
  const rounded = Math.round(seconds * 10) / 10
  return `${rounded}`
}

function formatMeetingBaasTranscriptUtteranceLine(
  utterance: MeetingBaasTranscriptUtterance
): string | null {
  const text = utterance.text.trim()
  if (!text) {
    return null
  }

  const metaParts: string[] = []

  if (utterance.start !== undefined || utterance.end !== undefined) {
    const start =
      utterance.start !== undefined
        ? _formatTranscriptTimestampSeconds(utterance.start)
        : '?'
    const end =
      utterance.end !== undefined
        ? _formatTranscriptTimestampSeconds(utterance.end)
        : '?'
    metaParts.push(`start=${start}s`, `end=${end}s`)
  }

  if (utterance.confidence !== undefined) {
    metaParts.push(`confidence=${utterance.confidence}`)
  }

  const meta = metaParts.length > 0 ? `[${metaParts.join(' ')}] ` : ''

  const speaker = utterance.speaker?.trim()
  const speakerPrefix = speaker ? `${speaker}: ` : ''

  return `${meta}${speakerPrefix}${text}`
}

function formatMeetingBaasTranscriptText(
  transcription: MeetingBaasOutputTranscription
): string {
  const lines = meetingBaasTranscriptUtterancesInOrder(transcription)
    .map(formatMeetingBaasTranscriptUtteranceLine)
    .filter((line): line is string => line !== null)

  if (lines.length === 0) {
    throw new Error('Meeting transcript has no utterances')
  }

  return lines.join('\n')
}

function formatMeetingBaasTranscriptTextFromJson(rawJson: string): string {
  const transcription = parseMeetingBaasOutputTranscription(JSON.parse(rawJson))
  return formatMeetingBaasTranscriptText(transcription)
}

function parseMeetingBaasOutputTranscriptionFromJson(
  rawJson: string
): MeetingBaasOutputTranscription {
  return parseMeetingBaasOutputTranscription(JSON.parse(rawJson))
}

export {
  formatMeetingBaasTranscriptText,
  formatMeetingBaasTranscriptTextFromJson,
  formatMeetingBaasTranscriptUtteranceLine,
  meetingBaasOutputTranscriptionSchema,
  meetingBaasTranscriptUtteranceSchema,
  meetingBaasTranscriptWordSchema,
  meetingBaasTranscriptUtterancesInOrder,
  parseMeetingBaasOutputTranscription,
  parseMeetingBaasOutputTranscriptionFromJson,
  type MeetingBaasOutputTranscription,
  type MeetingBaasTranscriptUtterance
}
