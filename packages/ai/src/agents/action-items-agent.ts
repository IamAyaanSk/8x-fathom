import { generateText, type LanguageModelUsage } from 'ai'
import { z } from 'zod/v4'

import { llmModel } from '../model.js'

export const meetingActionItemKindSchema = z.enum(['commitment', 'action_plan'])

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

const _ACTION_ITEMS_JSON_OUTPUT_INSTRUCTION =
  ' Respond with ONLY a single JSON object (no markdown fences): {"actionItems":[{"owner":string|null,"text":string,"timestampSec":number|null,"kind":"commitment"|"action_plan"}]}.'

function _parseActionItemsFromModelText(text: string): MeetingActionItem[] {
  const trimmed = text.trim()
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(trimmed)
  const jsonText = fenceMatch?.[1]?.trim() ?? trimmed
  return meetingActionItemsResultSchema.parse(JSON.parse(jsonText)).actionItems
}

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
  const prompt = `Meeting title: ${title}\n\nTranscript:\n${trimmedTranscript}`

  const { text, usage } = await generateText({
    model: llmModel,
    system: _ACTION_ITEMS_SYSTEM_PROMPT + _ACTION_ITEMS_JSON_OUTPUT_INSTRUCTION,
    prompt
  })

  return {
    actionItems: _parseActionItemsFromModelText(text),
    tokenUsage: usage
  }
}
