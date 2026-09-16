import { unsafeValidateEnv } from '@repo/env'
import { trimmedStringWithMinLengthOneSchema } from '@repo/shared-validations'
import { z } from 'zod'

// Can be more tightened in future as per need
const envZodSchema = z.object({
  VITE_API_URL: trimmedStringWithMinLengthOneSchema,
  VITE_LEGAL_CONTACT_EMAIL: z.email().optional()
})

const env = unsafeValidateEnv({
  schema: envZodSchema,
  env: import.meta.env
})

export { env }
