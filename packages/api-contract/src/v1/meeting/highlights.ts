import {
  meetingHighlightNoteSchema,
  meetingTimestampSecSchema
} from '@repo/shared-validations'
import { z } from 'zod/v4'

import { _createResponseApiZod } from '#src/utils'

import { meetingHighlightSchema } from './index.js'

export const postMeetingHighlightRequestParamsSchema = z.object({
  meetingId: z.string()
})

export type PostMeetingHighlightRequestParams = z.infer<
  typeof postMeetingHighlightRequestParamsSchema
>

export const postMeetingHighlightRequestBodySchema = z.object({
  timestampSec: meetingTimestampSecSchema
})

export type PostMeetingHighlightRequestBody = z.infer<
  typeof postMeetingHighlightRequestBodySchema
>

export const postMeetingHighlightResponseSchema = _createResponseApiZod(
  meetingHighlightSchema
)

export type PostMeetingHighlightResponse = z.infer<
  typeof postMeetingHighlightResponseSchema
>

export const patchMeetingHighlightRequestParamsSchema = z.object({
  meetingId: z.string(),
  highlightId: z.string()
})

export type PatchMeetingHighlightRequestParams = z.infer<
  typeof patchMeetingHighlightRequestParamsSchema
>

export const patchMeetingHighlightRequestBodySchema = z.object({
  endTimestampSec: meetingTimestampSecSchema,
  note: meetingHighlightNoteSchema.nullable().optional()
})

export type PatchMeetingHighlightRequestBody = z.infer<
  typeof patchMeetingHighlightRequestBodySchema
>

export const patchMeetingHighlightResponseSchema = _createResponseApiZod(
  meetingHighlightSchema
)

export type PatchMeetingHighlightResponse = z.infer<
  typeof patchMeetingHighlightResponseSchema
>
