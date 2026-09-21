import type { SummaryTemplateId } from '@repo/shared-validations/summary'

import { SUMMARY_TEMPLATE_LABELS } from './constants.js'

export function summaryTemplateLabel(templateId: SummaryTemplateId): string {
  return SUMMARY_TEMPLATE_LABELS[templateId]
}
