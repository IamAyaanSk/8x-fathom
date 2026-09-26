import { loadEnvFile } from 'node:process'

import { isProductionEnvironment, unsafeValidateEnv } from '@repo/env'
import {
  numericStringSchema,
  trimmedStringWithMinLengthOneSchema
} from '@repo/shared-validations'
import { z } from 'zod/v4'

loadEnvFile()

const envZodSchema = z
  .object({
    PORT: numericStringSchema,
    NODE_ENV: z.enum(['production', 'development', 'test']),
    DATABASE_URL: trimmedStringWithMinLengthOneSchema,
    MEETINGBAAS_API_KEY: trimmedStringWithMinLengthOneSchema,
    MEETINGBAAS_WEBHOOK_SECRET: trimmedStringWithMinLengthOneSchema,
    DEEPGRAM_API_KEY: trimmedStringWithMinLengthOneSchema,
    BASE_URL: trimmedStringWithMinLengthOneSchema,
    R2_ACCOUNT_ID: trimmedStringWithMinLengthOneSchema,
    R2_ACCESS_KEY_ID: trimmedStringWithMinLengthOneSchema,
    R2_SECRET_ACCESS_KEY: trimmedStringWithMinLengthOneSchema,
    R2_BUCKET: trimmedStringWithMinLengthOneSchema,
    R2_ENDPOINT: trimmedStringWithMinLengthOneSchema,
    DEMO_USER_EMAIL: trimmedStringWithMinLengthOneSchema.optional(),
    CLOUDFLARE_API_TOKEN: trimmedStringWithMinLengthOneSchema.optional(),
    CLOUDFLARE_ACCOUNT_ID: trimmedStringWithMinLengthOneSchema.optional(),
    CLOUDFLARE_API_GATEWAY: trimmedStringWithMinLengthOneSchema.optional(),
    LM_STUDIO_BASE_URL: trimmedStringWithMinLengthOneSchema.optional(),
    LM_STUDIO_API_KEY: trimmedStringWithMinLengthOneSchema.optional()
  })
  .superRefine((data, ctx) => {
    if (isProductionEnvironment(data.NODE_ENV)) {
      if (!data.CLOUDFLARE_API_TOKEN) {
        ctx.addIssue({
          code: 'custom',
          path: ['CLOUDFLARE_API_TOKEN'],
          message: 'Required when NODE_ENV is production'
        })
      }
      if (!data.CLOUDFLARE_ACCOUNT_ID) {
        ctx.addIssue({
          code: 'custom',
          path: ['CLOUDFLARE_ACCOUNT_ID'],
          message: 'Required when NODE_ENV is production'
        })
      }
      if (!data.CLOUDFLARE_API_GATEWAY) {
        ctx.addIssue({
          code: 'custom',
          path: ['CLOUDFLARE_API_GATEWAY'],
          message: 'Required when NODE_ENV is production'
        })
      }
      return
    }

    if (!data.LM_STUDIO_BASE_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['LM_STUDIO_BASE_URL'],
        message: 'Required when NODE_ENV is development or test'
      })
    }
    if (!data.LM_STUDIO_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['LM_STUDIO_API_KEY'],
        message: 'Required when NODE_ENV is development or test'
      })
    }
  })

const env = unsafeValidateEnv({
  schema: envZodSchema,
  env: process.env
})

export { env }
