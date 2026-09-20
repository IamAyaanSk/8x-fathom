import { z } from 'zod/v4'

import { _createResponseApiZod } from '#src/utils'

import { meetingShareDetailSchema } from './index.js'
import { getMeetingTranscriptResponseSchema } from './playback.js'

export const getMeetingShareDetailRequestParamsSchema = z.object({
  shareSlug: z.string().trim().min(1)
})

export type GetMeetingShareDetailRequestParams = z.infer<
  typeof getMeetingShareDetailRequestParamsSchema
>

export const getMeetingShareTranscriptRequestParamsSchema = z.object({
  shareSlug: z.string().trim().min(1)
})

export type GetMeetingShareTranscriptRequestParams = z.infer<
  typeof getMeetingShareTranscriptRequestParamsSchema
>

export const postMeetingShareEnableRequestParamsSchema = z.object({
  meetingId: z.string()
})

export type PostMeetingShareEnableRequestParams = z.infer<
  typeof postMeetingShareEnableRequestParamsSchema
>

export const getMeetingShareDetailResponseSchema = _createResponseApiZod(
  meetingShareDetailSchema
)

export type GetMeetingShareDetailResponse = z.infer<
  typeof getMeetingShareDetailResponseSchema
>

export const getMeetingShareTranscriptResponseSchema =
  getMeetingTranscriptResponseSchema

export type GetMeetingShareTranscriptResponse = z.infer<
  typeof getMeetingShareTranscriptResponseSchema
>

export const postMeetingShareEnableResponseSchema = _createResponseApiZod(
  z.object({
    shareSlug: z.string()
  })
)

export type PostMeetingShareEnableResponse = z.infer<
  typeof postMeetingShareEnableResponseSchema
>
