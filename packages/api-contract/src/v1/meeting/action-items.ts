import { meetingActionItemSchema } from '@repo/shared-validations/meeting'
import { z } from 'zod/v4'

import { _createResponseApiZod } from '#src/utils'

export const patchMeetingActionItemRequestBodySchema = z.object({
  completed: z.boolean()
})

export type PatchMeetingActionItemRequestBody = z.infer<
  typeof patchMeetingActionItemRequestBodySchema
>

export const patchMeetingActionItemResponseSchema = _createResponseApiZod(
  meetingActionItemSchema
)

export type PatchMeetingActionItemResponse = z.infer<
  typeof patchMeetingActionItemResponseSchema
>

export const patchMeetingActionItemsRequestParamsSchema = z.object({
  actionItemId: z.string(),
  meetingId: z.string()
})

export type PatchMeetingActionItemsRequestParams = z.infer<
  typeof patchMeetingActionItemsRequestParamsSchema
>
