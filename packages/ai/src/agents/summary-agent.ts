import { generateText } from 'ai'
import { z } from 'zod/v4'

import { llmModel } from '../model.js'
import {
  buildMeetingSummarySystemPrompt,
  type SummaryTemplateId,
  summaryTemplateIdSchema
} from './summary-templates.js'

export const meetingSummarySchema = z.object({
  summary: z
    .string()
    .min(1)
    .describe('Section-based meeting summary in markdown.')
})

export async function generateMeetingSummary({
  transcript,
  meetingTitle,
  template = 'enhanced',
  additionalDirections
}: {
  transcript: string
  meetingTitle?: string
  template?: SummaryTemplateId
  additionalDirections?: string
}) {
  const parsedTemplate = summaryTemplateIdSchema.parse(template)

  const trimmedTranscript = transcript.trim()
  if (!trimmedTranscript) {
    throw new Error('Transcript is empty')
  }

  const title = meetingTitle?.trim() || 'Untitled meeting'

  const { text, usage } = await generateText({
    model: llmModel,
    system: buildMeetingSummarySystemPrompt({
      template: parsedTemplate,
      additionalDirections
    }),
    prompt: `Meeting title: ${title}\n\nTranscript:\n${trimmedTranscript}`
  })

  const summary = meetingSummarySchema.parse({ summary: text.trim() }).summary

  return {
    summary,
    tokenUsage: usage
  }
}
