import { loadEnvFile } from 'node:process'
loadEnvFile()

import { unsafeValidateEnv } from '@repo/env'
import { z } from 'zod'

const trimmedStringWithMinLengthOne = z.string().trim().min(1)
const numericString = trimmedStringWithMinLengthOne.transform((val, ctx) => {
  const parsed = parseInt(val)
  if (isNaN(parsed)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Not a valid number'
    })
    return z.NEVER
  }
  return parsed
})

// Can be more tightened in future as per need
const envZodSchema = z.object({
  PORT: numericString,
  NODE_ENV: z.enum(['production', 'development', 'test']),
  DATABASE_URL: trimmedStringWithMinLengthOne
})

const env = unsafeValidateEnv({
  schema: envZodSchema,
  env: process.env
})

export { env }
