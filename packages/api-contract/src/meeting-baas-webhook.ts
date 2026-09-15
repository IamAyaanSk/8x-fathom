import { z } from 'zod/v4'

import { meetingBaasCompletedDataSchema } from '#src/baas-completed-storage'

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

const meetingBaasCompletedWebhookSchema = z.object({
  event: z.literal('bot.completed'),
  data: meetingBaasCompletedDataSchema,
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

export type { MeetingBaasWebhookEvent }
export { meetingBaasWebhookEventSchema }
