import {
  BAAS_STATUS_RANK,
  BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP,
  type BaasStatusToProcess
} from './constants.js'

function mapWebhookStatusToProcessStatus(status: string) {
  return BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP[status] ?? null
}

function getBaasStatusRank(status: BaasStatusToProcess) {
  return BAAS_STATUS_RANK[status]
}

export { mapWebhookStatusToProcessStatus, getBaasStatusRank }
