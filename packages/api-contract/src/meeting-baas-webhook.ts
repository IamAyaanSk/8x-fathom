import { z } from 'zod/v4'

const meetingBaasWebhookExtraSchema = z
  .object({
    meetingId: z.string().optional()
  })
  .loose()
  .nullable()
  .optional()

const meetingBaasStatusChangeWebhookSchema = z.object({
  event: z.literal('bot.status_change'),
  data: z.object({
    bot_id: z.string(),
    status: z.object({
      code: z.string(),
      created_at: z.string().optional(),
      start_time: z.number().optional()
    })
  }),
  extra: meetingBaasWebhookExtraSchema
})

const meetingBaasWebhookHeadersSchema = z.object({
  'svix-id': z.string().min(1),
  'svix-timestamp': z.string().min(1),
  'svix-signature': z.string().min(1)
})

const meetingBaasParticipantSchema = z.object({
  name: z.string(),
  id: z.number().nullable(),
  display_name: z.string().optional(),
  profile_picture: z.string().optional()
})

const meetingBaasCompletedWebhookSchema = z.object({
  event: z.literal('bot.completed'),
  data: z
    .object({
      bot_id: z.string(),
      video: z.url().nullish(),
      transcription: z.url().nullish(),
      raw_transcription: z.url().nullish(),
      audio: z.url().nullish(),
      chat_messages: z.url().nullish(),
      participants: z.array(meetingBaasParticipantSchema).optional(),
      joined_at: z.string().nullable().optional(),
      data_deleted: z.boolean().optional()
    })
    .loose(),
  extra: meetingBaasWebhookExtraSchema
})

const meetingBaasFailedWebhookSchema = z.object({
  event: z.literal('bot.failed'),
  data: z.object({
    bot_id: z.string(),
    error_code: z.string().optional(),
    error_message: z.string().optional()
  }),
  extra: meetingBaasWebhookExtraSchema
})

const meetingBaasWebhookEventSchema = z.discriminatedUnion('event', [
  meetingBaasStatusChangeWebhookSchema,
  meetingBaasCompletedWebhookSchema,
  meetingBaasFailedWebhookSchema
])

type MeetingBaasWebhookEvent = z.infer<typeof meetingBaasWebhookEventSchema>
type MeetingBaasParticipant = z.infer<typeof meetingBaasParticipantSchema>

export type { MeetingBaasWebhookEvent, MeetingBaasParticipant }
export { meetingBaasWebhookEventSchema, meetingBaasWebhookHeadersSchema }
