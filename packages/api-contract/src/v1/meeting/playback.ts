import {
  meetingDetailSchema,
  meetingTranscriptLineSchema
} from '@repo/shared-validations/meeting'
import { z } from 'zod/v4'

import { _createResponseApiZod } from '#src/utils'

export const meetingRequestParamsSchema = z.object({
  meetingId: z.string()
})

export type MeetingRequestParams = z.infer<typeof meetingRequestParamsSchema>

const getMeetingDetailResponseSchema =
  _createResponseApiZod(meetingDetailSchema)

const meetingTranscriptDataSchema = z.object({
  lines: z.array(meetingTranscriptLineSchema),
  durationSec: z.number().min(0).nullish()
})

const getMeetingTranscriptResponseSchema = _createResponseApiZod(
  meetingTranscriptDataSchema
)

export type GetMeetingDetailResponse = z.infer<
  typeof getMeetingDetailResponseSchema
>

export type GetMeetingTranscriptResponse = z.infer<
  typeof getMeetingTranscriptResponseSchema
>

export { getMeetingDetailResponseSchema, getMeetingTranscriptResponseSchema }
