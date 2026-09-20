import { z } from 'zod/v4'

import { meetingTranscriptLineSchema } from '#src/meeting-baas-transcript'
import { _createResponseApiZod } from '#src/utils'

import { meetingDetailSchema } from './index.js'

export const meetingRequestParamsSchema = z.object({
  meetingId: z.string()
})

export type MeetingRequestParams = z.infer<typeof meetingRequestParamsSchema>

const getMeetingDetailResponseSchema =
  _createResponseApiZod(meetingDetailSchema)

const meetingTranscriptDataSchema = z.object({
  lines: z.array(meetingTranscriptLineSchema),
  durationSec: z.number().int().min(0).nullable()
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
