import {
  meetingScratchpadTextSchema,
  meetingTimestampSecSchema
} from '@repo/shared-validations'
import { meetingScratchpadEntrySchema } from '@repo/shared-validations/meeting'
import { z } from 'zod/v4'

import { _createResponseApiZod } from '#src/utils'

export const putMeetingScratchpadEntryRequestParamsSchema = z.object({
  meetingId: z.string()
})

export type PutMeetingScratchpadEntryRequestParams = z.infer<
  typeof putMeetingScratchpadEntryRequestParamsSchema
>

export const putMeetingScratchpadEntryRequestBodySchema = z.object({
  timestampSec: meetingTimestampSecSchema,
  text: meetingScratchpadTextSchema
})

export type PutMeetingScratchpadEntryRequestBody = z.infer<
  typeof putMeetingScratchpadEntryRequestBodySchema
>

export const putMeetingScratchpadEntryResponseSchema = _createResponseApiZod(
  meetingScratchpadEntrySchema
)

export type PutMeetingScratchpadEntryResponse = z.infer<
  typeof putMeetingScratchpadEntryResponseSchema
>
