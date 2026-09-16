import { z } from 'zod/v4'

const postMeetingAssistantBodySchema = z.object({
  messages: z.array(z.unknown()).min(1)
})

type PostMeetingAssistantBody = z.infer<typeof postMeetingAssistantBodySchema>

export { postMeetingAssistantBodySchema }
export type { PostMeetingAssistantBody }
