import { loadEnvFile } from 'node:process'

import { unsafeValidateEnv } from '@repo/env'
import {
  numericStringSchema,
  trimmedStringWithMinLengthOneSchema
} from '@repo/shared-validations'
import { z } from 'zod/v4'

loadEnvFile()

const envZodSchema = z.object({
  PORT: numericStringSchema,
  NODE_ENV: z.enum(['production', 'development', 'test']),
  DATABASE_URL: trimmedStringWithMinLengthOneSchema,
  MEETINGBAAS_API_KEY: trimmedStringWithMinLengthOneSchema,
  MEETINGBAAS_WEBHOOK_SECRET: trimmedStringWithMinLengthOneSchema,
  BASE_URL: trimmedStringWithMinLengthOneSchema
})

const env = unsafeValidateEnv({
  schema: envZodSchema,
  env: process.env
})

export { env }
