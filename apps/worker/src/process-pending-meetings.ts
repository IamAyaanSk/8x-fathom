import '#src/env'
import { Prisma, prisma } from '@repo/db'

import {
  MEETING_PROCESSING_LEASE_MS,
  PENDING_PROCESSING_BATCH_SIZE,
  PENDING_PROCESSING_TRANSACTION_TIMEOUT_MS
} from '#src/constants'
import { processMeetingArtifacts } from '#src/process-meeting-artifacts'

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
        AND (
          m.summary IS NULL
          OR m."actionItemsExtractedAt" IS NULL
          OR m."chatMessagesIngestedAt" IS NULL
          OR m."transcriptEmbeddingsExtractedAt" IS NULL
        )
        AND (
          m."processingLeaseExpiresAt" IS NULL
          OR m."processingLeaseExpiresAt" < NOW()
        )
      )
    )
    ORDER BY m."updatedAt" ASC
    LIMIT ${limit}
    FOR UPDATE OF m SKIP LOCKED
  `
}

async function _markMeetingsProcessing(
  tx: Prisma.TransactionClient,
  meetingIds: string[],
  leaseExpiresAt: Date
) {
  if (meetingIds.length === 0) {
    return
  }

  await tx.meeting.updateMany({
    where: { id: { in: meetingIds } },
    data: {
      processingStatus: 'processing',
      processingLeaseExpiresAt: leaseExpiresAt
    }
  })
}

async function runPendingMeetingProcessing() {
  const leaseExpiresAt = new Date(Date.now() + MEETING_PROCESSING_LEASE_MS)

  const meetingIds = await prisma.$transaction(
    async (tx) => {
      const rows = await _lockPendingMeetingRows(
        tx,
        PENDING_PROCESSING_BATCH_SIZE
      )
      const ids = rows.map((row) => row.id)
      await _markMeetingsProcessing(tx, ids, leaseExpiresAt)
      return ids
    },
    { timeout: PENDING_PROCESSING_TRANSACTION_TIMEOUT_MS }
  )

  for (const meetingId of meetingIds) {
    try {
      await processMeetingArtifacts(meetingId)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error'
      console.error(
        `Unexpected meeting artifacts error for ${meetingId}: ${message}`
      )
    }
  }

  return { pickedCount: meetingIds.length }
}

export { runPendingMeetingProcessing }
