import { z } from 'zod'

import { _createResponseApiZod } from '#src/utils'

import { meetingActionItemSchema } from './index.js'

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
