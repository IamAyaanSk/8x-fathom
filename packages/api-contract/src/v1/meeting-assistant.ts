import { z } from 'zod/v4'

const meetingAssistantScopeSchema = z.enum(['single', 'all'])

const postMeetingAssistantBodySchema = z.object({
  scope: meetingAssistantScopeSchema,
  messages: z.array(z.unknown()).min(1)
})

type MeetingAssistantScope = z.infer<typeof meetingAssistantScopeSchema>
type PostMeetingAssistantBody = z.infer<typeof postMeetingAssistantBodySchema>

export { meetingAssistantScopeSchema, postMeetingAssistantBodySchema }
export type { MeetingAssistantScope, PostMeetingAssistantBody }
