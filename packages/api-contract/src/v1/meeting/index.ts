import { z } from 'zod'

export const meetingActionItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  timestampSec: z.number().int().min(0).nullable(),
  completed: z.boolean()
})

export type MeetingActionItem = z.infer<typeof meetingActionItemSchema>
