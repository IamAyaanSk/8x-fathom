import '#src/env'

import { Prisma, prisma } from '@repo/db'

import {
  PENDING_PROCESSING_BATCH_SIZE,
  PENDING_PROCESSING_TRANSACTION_TIMEOUT_MS
} from '#src/constants'
import { processMeetingSummary } from '#src/process-meeting-summary'

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
    WHERE (
      m."processingStatus" = 'pending'::"ProcessingStatus"
      OR (
        m."processingStatus" = 'processing'::"ProcessingStatus"
        AND m.summary IS NULL
      )
    )
    ORDER BY m."updatedAt" ASC
    LIMIT ${limit}
    FOR UPDATE OF m SKIP LOCKED
  `
}

async function _markMeetingsProcessing(
  tx: Prisma.TransactionClient,
  meetingIds: string[]
) {
  if (meetingIds.length === 0) {
    return
  }

  await tx.meeting.updateMany({
    where: { id: { in: meetingIds } },
    data: { processingStatus: 'processing' }
  })
}

async function _markMeetingProcessingFailed(meetingId: string) {
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { processingStatus: 'failed' }
  })
}

async function runPendingMeetingProcessing() {
  const meetingIds = await prisma.$transaction(
    async (tx) => {
      const rows = await _lockPendingMeetingRows(
        tx,
        PENDING_PROCESSING_BATCH_SIZE
      )
      const ids = rows.map((row) => row.id)
      await _markMeetingsProcessing(tx, ids)
      return ids
    },
    { timeout: PENDING_PROCESSING_TRANSACTION_TIMEOUT_MS }
  )

  for (const meetingId of meetingIds) {
    try {
      await processMeetingSummary(meetingId)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error'
      console.error(`Summary processing failed for ${meetingId}: ${message}`)
      await _markMeetingProcessingFailed(meetingId)
    }
  }

  return { pickedCount: meetingIds.length }
}

export { runPendingMeetingProcessing }
