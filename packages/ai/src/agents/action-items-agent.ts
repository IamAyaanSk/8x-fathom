import { generateObject, type LanguageModelUsage } from 'ai'
import { z } from 'zod/v4'

import { llmModel } from '../model.js'

export const meetingActionItemKindSchema = z.enum([
  'commitment',
  'action_plan'
])

export const meetingActionItemSchema = z.object({
  owner: z
    .string()
    .min(1)
    .nullable()
    .describe(
      'Person accountable, using the speaker name from the transcript. Null if nobody is identifiable.'
    ),
  text: z
    .string()
    .min(1)
    .describe(
      'The work to do in one sentence. Do not repeat the owner name. Do not include timestamps.'
    ),
  timestampSec: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .describe(
      'Integer seconds to seek in the recording: floor of the supporting utterance start= value. Null only if that line has no start.'
    ),
  kind: meetingActionItemKindSchema.describe(
    'commitment = explicitly agreed or assigned. action_plan = implied next step you are at least 80% sure is real.'
  )
})

export const meetingActionItemsResultSchema = z.object({
  actionItems: z.array(meetingActionItemSchema)
})

export type MeetingActionItem = z.infer<typeof meetingActionItemSchema>
export type MeetingActionItemKind = z.infer<typeof meetingActionItemKindSchema>

const _ACTION_ITEMS_SYSTEM_PROMPT = [
  'You extract a post-meeting action list for a player that jumps to timestampSec.',
  'Each transcript line looks like: [start=12.4s end=18.1s confidence=0.92] Jane Doe: I will send the deck.',
  'Rules:',
  '- Use only the transcript. Do not invent people, tasks, dates, or times.',
  '- owner must be a speaker name that appears in the transcript, or null.',
  '- timestampSec must be Math.floor of that utterance start= seconds so playback lands on the line.',
  '- kind=commitment when someone clearly takes or assigns the work (I will, please do, we agreed you will).',
  '- kind=action_plan when it is not explicit but you are at least 80% sure it is a real next step (clear implication, unfinished work, obvious follow-up).',
  '- Below 80% confidence, omit the item.',
  '- Dedupe the same task. Prefer the earliest supporting timestamp.',
  '- One concrete action per item. No process commentary.',
  '- Return an empty actionItems array if nothing qualifies.',
  '- Never mention AI, prompts, schemas, or how the list was produced.'
].join(' ')

export function formatMeetingActionItemText(item: MeetingActionItem): string {
  const owner = item.owner?.trim() || 'Unassigned'
  const body = item.text.trim()

  if (item.kind === 'action_plan') {
    return `${owner} (action plan): ${body}`
  }

  return `${owner}: ${body}`
}

export async function generateMeetingActionItems({
  transcript,
  meetingTitle
}: {
  transcript: string
  meetingTitle?: string
}): Promise<{
  actionItems: MeetingActionItem[]
  tokenUsage: LanguageModelUsage
}> {
  const trimmedTranscript = transcript.trim()
  if (!trimmedTranscript) {
    throw new Error('Transcript is empty')
  }

  const title = meetingTitle?.trim() || 'Untitled meeting'

  const { object, usage } = await generateObject({
    model: llmModel,
    schema: meetingActionItemsResultSchema,
    schemaName: 'meetingActionItems',
    schemaDescription:
      'Action items and high-confidence action-plan follow-ups with playback timestamps.',
    system: _ACTION_ITEMS_SYSTEM_PROMPT,
    prompt: `Meeting title: ${title}\n\nTranscript:\n${trimmedTranscript}`
  })

  const parsed = meetingActionItemsResultSchema.parse(object)

  return {
    actionItems: parsed.actionItems,
    tokenUsage: usage
  }
}
