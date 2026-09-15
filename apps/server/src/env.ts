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
  BETTER_AUTH_SECRET: trimmedStringWithMinLengthOneSchema,
  BETTER_AUTH_URL: trimmedStringWithMinLengthOneSchema,
  BASE_URL: trimmedStringWithMinLengthOneSchema,
  GOOGLE_CLIENT_ID: trimmedStringWithMinLengthOneSchema,
  GOOGLE_CLIENT_SECRET: trimmedStringWithMinLengthOneSchema,
  WEB_ORIGIN: trimmedStringWithMinLengthOneSchema,
  MEETINGBAAS_API_KEY: trimmedStringWithMinLengthOneSchema,
  MEETINGBAAS_WEBHOOK_SECRET: trimmedStringWithMinLengthOneSchema,
  DEEPGRAM_API_KEY: trimmedStringWithMinLengthOneSchema,
  R2_ACCOUNT_ID: trimmedStringWithMinLengthOneSchema,
  R2_ACCESS_KEY_ID: trimmedStringWithMinLengthOneSchema,
  R2_SECRET_ACCESS_KEY: trimmedStringWithMinLengthOneSchema,
  R2_BUCKET: trimmedStringWithMinLengthOneSchema,
  R2_ENDPOINT: trimmedStringWithMinLengthOneSchema,
  OPENAI_API_KEY: trimmedStringWithMinLengthOneSchema
})

const env = unsafeValidateEnv({
  schema: envZodSchema,
  env: process.env
})

export { env }
