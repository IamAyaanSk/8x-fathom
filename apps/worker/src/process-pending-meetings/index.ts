import { Prisma, prisma } from '@repo/db'

import {
  MEETING_PROCESSING_LEASE_MS,
  PENDING_PROCESSING_BATCH_SIZE,
  PENDING_PROCESSING_TRANSACTION_TIMEOUT_MS
} from '#src/process-pending-meetings/constants'
import { processMeeting } from '#src/process-pending-meetings/process-meeting'

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

export async function processPendingMeetings() {
  try {
    const leaseExpiresAt = new Date(Date.now() + MEETING_PROCESSING_LEASE_MS)

    const meetingIds = await prisma.$transaction(
      async (tx) => {
        const rows = await _lockPendingMeetingRows(
          tx,
          PENDING_PROCESSING_BATCH_SIZE
        )
        const ids = rows.map((row) => row.id)

        if (ids.length > 0) {
          await tx.meeting.updateMany({
            where: { id: { in: ids } },
            data: {
              processingStatus: 'processing',
              processingLeaseExpiresAt: leaseExpiresAt
            }
          })
        }

        return ids
      },
      { timeout: PENDING_PROCESSING_TRANSACTION_TIMEOUT_MS }
    )

    if (meetingIds.length === 0) {
      return
    }

    console.log(
      `Pending processing: picked ${meetingIds.length} meeting${meetingIds.length === 1 ? '' : 's'}`
    )

    await Promise.all(
      meetingIds.map(async (meetingId) => {
        try {
          await processMeeting(meetingId)
        } catch (error) {
          console.error(
            `Unexpected meeting artifacts error for ${meetingId}: `,
            error
          )
        }
      })
    )
  } catch (error) {
    console.error('Pending processing tick failed', error)
  }
}
