import { summaryTemplateIdSchema } from '@repo/shared-validations/summary'
import { z } from 'zod/v4'

import { _createResponseApiZod } from '#src/utils'

export const postMeetingSummaryGenerateRequestParamsSchema = z.object({
  meetingId: z.string()
})

export type PostMeetingSummaryGenerateRequestParams = z.infer<
  typeof postMeetingSummaryGenerateRequestParamsSchema
>

export const postMeetingSummaryGenerateRequestBodySchema = z.object({
  template: summaryTemplateIdSchema,
  detail: z.string().trim().min(1).max(4000).optional()
})

export type PostMeetingSummaryGenerateRequestBody = z.infer<
  typeof postMeetingSummaryGenerateRequestBodySchema
>

const postMeetingSummaryGenerateDataSchema = z.object({
  summary: z.string().min(1)
})

export const postMeetingSummaryGenerateResponseSchema = _createResponseApiZod(
  postMeetingSummaryGenerateDataSchema
)

export type PostMeetingSummaryGenerateResponse = z.infer<
  typeof postMeetingSummaryGenerateResponseSchema
>
