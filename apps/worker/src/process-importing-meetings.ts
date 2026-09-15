import '#src/env'
import { Prisma, prisma } from '@repo/db'

import {
  ARTIFACT_IMPORT_BATCH_SIZE,
  ARTIFACT_IMPORT_LEASE_MS,
  ARTIFACT_IMPORT_TRANSACTION_TIMEOUT_MS
} from '#src/constants'
import { importMeetingArtifacts } from '#src/import-meeting-artifacts'

type LockedImportingMeetingRow = {
  id: string
}

async function _lockImportingMeetingRows(
  tx: Prisma.TransactionClient,
  limit: number
): Promise<LockedImportingMeetingRow[]> {
  return tx.$queryRaw<LockedImportingMeetingRow[]>`
    SELECT m.id
    FROM meeting m
    WHERE m."processingStatus" = 'importing'::"ProcessingStatus"
      AND (
        m."processingLeaseExpiresAt" IS NULL
        OR m."processingLeaseExpiresAt" < NOW()
      )
    ORDER BY m."updatedAt" ASC
    LIMIT ${limit}
    FOR UPDATE OF m SKIP LOCKED
  `
}

async function _markMeetingsImportingLease(
  tx: Prisma.TransactionClient,
  meetingIds: string[],
  leaseExpiresAt: Date
) {
  if (meetingIds.length === 0) {
    return
  }

  await tx.meeting.updateMany({
    where: { id: { in: meetingIds } },
    data: { processingLeaseExpiresAt: leaseExpiresAt }
  })
}

async function runImportingMeetingArtifacts() {
  const leaseExpiresAt = new Date(Date.now() + ARTIFACT_IMPORT_LEASE_MS)

  const meetingIds = await prisma.$transaction(
    async (tx) => {
      const rows = await _lockImportingMeetingRows(
        tx,
        ARTIFACT_IMPORT_BATCH_SIZE
      )
      const ids = rows.map((row) => row.id)
      await _markMeetingsImportingLease(tx, ids, leaseExpiresAt)
      return ids
    },
    { timeout: ARTIFACT_IMPORT_TRANSACTION_TIMEOUT_MS }
  )

  for (const meetingId of meetingIds) {
    try {
      await importMeetingArtifacts(meetingId)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown artifact import error'
      console.error(
        `Unexpected artifact import error for ${meetingId}: ${message}`
      )
    }
  }

  return { pickedCount: meetingIds.length }
}

export { runImportingMeetingArtifacts }
