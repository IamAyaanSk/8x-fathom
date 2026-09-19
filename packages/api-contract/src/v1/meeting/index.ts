import {
  meetingHighlightNoteSchema,
  meetingScratchpadTextSchema,
  meetingTimestampSecSchema
} from '@repo/shared-validations'
import { z } from 'zod/v4'

export const meetingActionItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  timestampSec: meetingTimestampSecSchema.nullable(),
  completed: z.boolean()
})

export type MeetingActionItem = z.infer<typeof meetingActionItemSchema>

export const meetingHighlightSchema = z.object({
  id: z.string(),
  timestampSec: meetingTimestampSecSchema,
  endTimestampSec: meetingTimestampSecSchema.nullable(),
  note: meetingHighlightNoteSchema.nullable()
})

export type MeetingHighlight = z.infer<typeof meetingHighlightSchema>

export const meetingScratchpadEntrySchema = z.object({
  id: z.string(),
  timestampSec: meetingTimestampSecSchema,
  text: meetingScratchpadTextSchema,
  updatedAt: z.iso.datetime()
})

export type MeetingScratchpadEntry = z.infer<
  typeof meetingScratchpadEntrySchema
>
