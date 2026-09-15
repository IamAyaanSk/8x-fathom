import { emailSchema, createNameSchema } from '@repo/shared-validations'
import { z } from 'zod/v4'

import { _createResponseApiZod } from '#src/utils'

const getUsersResponseSchema = _createResponseApiZod(
  z.array(
    z.object({
      name: createNameSchema('Name'),
      email: emailSchema
    })
  )
)

// Similarly add request body / search params / url params as needed

// Use this in api clients
export type GetUsersResponse = z.infer<typeof getUsersResponseSchema>
// Use this in express controllers
export type GetUsersSuccessResponse = Extract<
  GetUsersResponse,
  { success: true }
>
export { getUsersResponseSchema }
