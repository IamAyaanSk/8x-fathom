export const DISPATCH_CRON_EXPRESSION = '*/90 * * * * *'
export const STATUS_POLL_CRON_EXPRESSION = '*/10 * * * * *'
export const PENDING_PROCESSING_CRON_EXPRESSION = '0 */5 * * * *'
export const PENDING_PROCESSING_BATCH_SIZE = 3
export const PENDING_PROCESSING_TRANSACTION_TIMEOUT_MS = 120_000
export const MEETING_PROCESSING_LEASE_MS = 45 * 60 * 1000
export const DISPATCH_DUE_PATH = '/api/v1/internal/dispatch-due'
