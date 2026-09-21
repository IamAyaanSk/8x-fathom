import type { SummaryTemplateId } from '@repo/shared-validations/summary'

export const MEETING_CAPTURE_LEAD_MS = 120_000

export const SUMMARY_TEMPLATE_LABELS: Record<SummaryTemplateId, string> = {
  enhanced: 'General',
  sales: 'Sales',
  sales_sandler: 'Sandler',
  sales_spiced: 'SPICED',
  sales_meddpicc: 'MEDDPICC',
  sales_bant: 'BANT',
  customer_success: 'Customer success',
  customer_success_reach: 'REACH',
  candidate_interview: 'Candidate interview',
  demo: 'Demo',
  one_on_one: '1:1',
  project_kick_off: 'Project kick-off',
  project_update: 'Project update',
  q_and_a: 'Q&A',
  retrospective: 'Retrospective',
  stand_up: 'Stand-up'
}

export type SummaryTemplateGroup = {
  label: string
  templateIds: readonly SummaryTemplateId[]
}

export const SUMMARY_TEMPLATE_GROUPS: readonly SummaryTemplateGroup[] = [
  { label: 'General', templateIds: ['enhanced'] },
  {
    label: 'Sales',
    templateIds: [
      'sales',
      'sales_sandler',
      'sales_spiced',
      'sales_meddpicc',
      'sales_bant'
    ]
  },
  {
    label: 'Customer success',
    templateIds: ['customer_success', 'customer_success_reach']
  },
  {
    label: 'Interviews & demos',
    templateIds: ['candidate_interview', 'demo']
  },
  {
    label: 'Team',
    templateIds: ['one_on_one', 'stand_up', 'retrospective']
  },
  {
    label: 'Projects',
    templateIds: ['project_kick_off', 'project_update', 'q_and_a']
  }
]
