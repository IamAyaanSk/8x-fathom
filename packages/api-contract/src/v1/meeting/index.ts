import {
  baasBotStatusSchema,
  meetingBotUiPhaseSchema,
  meetingsListDataSchema
} from '@repo/shared-validations/meeting'
import { z } from 'zod/v4'

import { _createResponseApiZod } from '#src/utils'

// Meetings endpoints schemas

export const getMeetingsUpcomingResponseSchema = _createResponseApiZod(
  meetingsListDataSchema
)

export const getMeetingsCompletedResponseSchema = _createResponseApiZod(
  meetingsListDataSchema
)

export const postMeetingCaptureRequestParamsSchema = z.object({
  meetingId: z.string()
})

export type PostMeetingCaptureRequestParams = z.infer<
  typeof postMeetingCaptureRequestParamsSchema
>

const postMeetingBotDispatchDataSchema = z.object({
  meetingId: z.string(),
  baasBotId: z.string(),
  baasStatus: baasBotStatusSchema.nullable(),
  uiPhase: meetingBotUiPhaseSchema
})

export const postMeetingCaptureResponseSchema = _createResponseApiZod(
  postMeetingBotDispatchDataSchema
)

export type GetMeetingsUpcomingResponse = z.infer<
  typeof getMeetingsUpcomingResponseSchema
>
export type GetMeetingsCompletedResponse = z.infer<
  typeof getMeetingsCompletedResponseSchema
>
export type PostMeetingCaptureResponse = z.infer<
  typeof postMeetingCaptureResponseSchema
>
