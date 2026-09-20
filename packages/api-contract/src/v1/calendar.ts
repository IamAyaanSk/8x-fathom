import { z } from 'zod/v4'

import { _createResponseApiZod } from '#src/utils'

const getCalendarStatusResponseSchema = _createResponseApiZod(
  z.object({
    connected: z.boolean()
  })
)

const postCalendarSyncResponseSchema = _createResponseApiZod(
  z.object({
    syncedCount: z.number().int().nonnegative()
  })
)

export type GetCalendarStatusResponse = z.infer<
  typeof getCalendarStatusResponseSchema
>

export type PostCalendarSyncResponse = z.infer<
  typeof postCalendarSyncResponseSchema
>

export { getCalendarStatusResponseSchema, postCalendarSyncResponseSchema }
