import { z } from 'zod/v4'

function _createResponseApiZod<T extends z.ZodArray | z.ZodObject>(schema: T) {
  return z
    .object({
      message: z.string({ error: 'Message missing in API response' })
    })
    .and(
      z.discriminatedUnion('success', [
        z.object({
          success: z.literal(false)
        }),
        z.object({
          success: z.literal(true),
          data: schema
        })
      ])
    )
}

export { _createResponseApiZod }
