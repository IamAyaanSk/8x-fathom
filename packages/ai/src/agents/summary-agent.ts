import { generateText } from 'ai'
import { z } from 'zod/v4'

import { llmModel } from '../model.js'

export const meetingSummarySchema = z.object({
  summary: z
    .string()
    .min(1)
    .describe(
      'Concise meeting summary in markdown: short overview, key decisions, and next steps.'
    )
})

export async function generateMeetingSummary({
  transcript,
  meetingTitle
}: {
  transcript: string
  meetingTitle?: string
}) {
  const trimmedTranscript = transcript.trim()
  if (!trimmedTranscript) {
    throw new Error('Transcript is empty')
  }

  const title = meetingTitle?.trim() || 'Untitled meeting'

  const { text, usage } = await generateText({
    model: llmModel,
    system: [
      'You are an expert meeting notetaker for async review.',
      'Produce an accurate, scannable summary grounded only in the transcript.',
      'Do not invent attendees, decisions, or action items that are not supported by the text.',
      'Use clear markdown headings and bullet lists where helpful.',
      'Respond with the summary only — no preamble or meta commentary.'
    ].join(' '),
    prompt: `Meeting title: ${title}\n\nTranscript:\n${trimmedTranscript}`
  })

  const summary = meetingSummarySchema.parse({ summary: text.trim() }).summary

  return {
    summary,
    tokenUsage: usage
  }
}
