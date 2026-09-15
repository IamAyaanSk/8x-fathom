import { Prisma, prisma } from '@repo/db'

import {
  PENDING_PROCESSING_BATCH_SIZE,
  PENDING_PROCESSING_TRANSACTION_TIMEOUT_MS
} from '#src/constants'

type LockedPendingMeetingRow = {
  id: string
}

async function _lockPendingMeetingRows(
  tx: Prisma.TransactionClient,
  limit: number
): Promise<LockedPendingMeetingRow[]> {
  return tx.$queryRaw<LockedPendingMeetingRow[]>`
    SELECT m.id
    FROM meeting m
    WHERE m."processingStatus" = 'pending'::"ProcessingStatus"
    ORDER BY m."updatedAt" ASC
    LIMIT ${limit}
    FOR UPDATE OF m SKIP LOCKED
  `
}

async function runPendingMeetingProcessing() {
  const locked = await prisma.$transaction(
    async (tx) => {
      const rows = await _lockPendingMeetingRows(
        tx,
        PENDING_PROCESSING_BATCH_SIZE
      )

      for (const _meeting of rows) {
        // TODO(F8): ingest transcript from R2, run AI summary/action items/embeddings, set processingStatus ready
      }

      return rows
    },
    { timeout: PENDING_PROCESSING_TRANSACTION_TIMEOUT_MS }
  )

  return { pickedCount: locked.length }
}

export { runPendingMeetingProcessing }
