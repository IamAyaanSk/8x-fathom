import { z } from 'zod/v4'

const meetingTimestampSecSchema = z.number().int().min(0)

const meetingScratchpadTextSchema = z.string().trim().min(1).max(4000)

const meetingHighlightNoteSchema = z.string().trim().max(500)

export {
  meetingHighlightNoteSchema,
  meetingScratchpadTextSchema,
  meetingTimestampSecSchema
}
