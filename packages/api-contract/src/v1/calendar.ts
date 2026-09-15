import { z } from 'zod/v4'

import { _createResponseApiZod } from '#src/utils'

const getCalendarStatusResponseSchema = _createResponseApiZod(
  z.object({
    connected: z.boolean()
  })
)

const postCalendarSyncResponseSchema = _createResponseApiZod(
  z.object({
    syncedCount: z.number().int().nonnegative(),
    watchRegistered: z.boolean()
  })
)

export type GetCalendarStatusResponse = z.infer<
  typeof getCalendarStatusResponseSchema
>
export type GetCalendarStatusSuccessResponse = Extract<
  GetCalendarStatusResponse,
  { success: true }
>

export type PostCalendarSyncResponse = z.infer<
  typeof postCalendarSyncResponseSchema
>
export type PostCalendarSyncSuccessResponse = Extract<
  PostCalendarSyncResponse,
  { success: true }
>

export {
  getCalendarStatusResponseSchema,
  postCalendarSyncResponseSchema
}
