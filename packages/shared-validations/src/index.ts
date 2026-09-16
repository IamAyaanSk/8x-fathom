import { z } from 'zod/v4'

function createNameSchema(name: string) {
  return z.string({ error: `${name} is required` })
}

const emailSchema = z.email({ error: 'Email is required' })

const trimmedStringWithMinLengthOneSchema = z.string().trim().min(1)
const numericStringSchema = trimmedStringWithMinLengthOneSchema.transform(
  (val, ctx) => {
    const parsed = parseInt(val)
    if (isNaN(parsed)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Not a valid number'
      })
      return z.NEVER
    }
    return parsed
  }
)

export {
  summaryTemplateIdSchema,
  type SummaryTemplateId
} from './summary-template.js'
export {
  SUMMARY_TEMPLATE_GROUPS,
  SUMMARY_TEMPLATE_LABELS,
  summaryTemplateLabel
} from './summary-template-labels.js'
export {
  createNameSchema,
  emailSchema,
  trimmedStringWithMinLengthOneSchema,
  numericStringSchema
}
