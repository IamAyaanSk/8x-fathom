import { z } from 'zod/v4'

const postMeetingAssistantRequestBodySchema = z.object({
  messages: z.array(z.unknown()).min(1),
  meetingId: z.string().trim().min(1).nullish() // We decide the context from this
})

type PostMeetingAssistantRequestBody = z.infer<
  typeof postMeetingAssistantRequestBodySchema
>

export { postMeetingAssistantRequestBodySchema }
export type { PostMeetingAssistantRequestBody }
