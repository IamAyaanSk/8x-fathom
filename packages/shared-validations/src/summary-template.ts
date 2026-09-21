import { z } from 'zod/v4'

export const summaryTemplateIdSchema = z.enum([
  'enhanced',
  'sales',
  'sales_sandler',
  'sales_spiced',
  'sales_meddpicc',
  'sales_bant',
  'customer_success',
  'customer_success_reach',
  'candidate_interview',
  'demo',
  'one_on_one',
  'project_kick_off',
  'project_update',
  'q_and_a',
  'retrospective',
  'stand_up'
])

export type SummaryTemplateId = z.infer<typeof summaryTemplateIdSchema>
