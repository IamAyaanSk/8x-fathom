import '#src/env'
import { Prisma, prisma } from '@repo/db'
import { R2UploadError } from '@repo/r2'
import { baasSignedArtifactUrlsSchema } from '@repo/shared-validations/meeting'

import {
  ARTIFACT_IMPORT_BATCH_SIZE,
  ARTIFACT_IMPORT_FETCH_TIMEOUT_MS,
  ARTIFACT_IMPORT_LEASE_MS,
  ARTIFACT_IMPORT_RETRY_DELAY_MS,
  ARTIFACT_IMPORT_TRANSACTION_TIMEOUT_MS
} from '#src/import-meeting-artifacts/constants'
import {
  meetingChatMessagesR2Key,
  meetingRecordingR2Key,
  meetingTranscriptR2Key
} from '#src/import-meeting-artifacts/constants'
import { putR2ObjectFromUrl } from '#src/r2-storage'
import { extendMeetingProcessingLease, failMeetingProcessing } from '#src/utils'

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

export async function importMeetingArtifacts() {
  try {
    const leaseExpiresAt = new Date(Date.now() + ARTIFACT_IMPORT_LEASE_MS)

    const meetingIds = await prisma.$transaction(
      async (tx) => {
        const rows = await _lockImportingMeetingRows(
          tx,
          ARTIFACT_IMPORT_BATCH_SIZE
        )
        const ids = rows.map((row) => row.id)

        await tx.meeting.updateMany({
          where: { id: { in: ids } },
          data: { processingLeaseExpiresAt: leaseExpiresAt }
        })

        return ids
      },
      { timeout: ARTIFACT_IMPORT_TRANSACTION_TIMEOUT_MS }
    )

    if (meetingIds.length === 0) {
      return
    }

    console.log(
      `Artifact import: picked ${meetingIds.length} meeting${meetingIds.length === 1 ? '' : 's'}`
    )

    await Promise.all(
      meetingIds.map(async (meetingId) => {
        try {
          const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId, processingStatus: 'importing' },
            select: {
              id: true,
              processingStatus: true,
              baasSignedArtifactUrls: true,
              recordingR2Key: true,
              transcriptR2Key: true,
              chatMessagesR2Key: true
            }
          })

          if (!meeting) {
            return
          }

          const parsedUrls = baasSignedArtifactUrlsSchema.safeParse(
            meeting.baasSignedArtifactUrls
          )

          if (!parsedUrls.success) {
            await failMeetingProcessing(
              meetingId,
              'Invalid signed artifact URLs'
            )
            return
          }

          const urls = parsedUrls.data
          const transcriptionUrl = urls?.transcription ?? urls?.rawTranscription

          if (!transcriptionUrl) {
            await failMeetingProcessing(
              meetingId,
              'Missing transcription signed URL'
            )
            return
          }

          let recordingR2Key = meeting.recordingR2Key
          let transcriptR2Key = meeting.transcriptR2Key
          let chatMessagesR2Key = meeting.chatMessagesR2Key

          if (urls?.video && !recordingR2Key) {
            await extendMeetingProcessingLease(
              meetingId,
              ARTIFACT_IMPORT_LEASE_MS
            )

            const key = meetingRecordingR2Key(meeting.id)
            await putR2ObjectFromUrl(
              key,
              urls.video,
              ARTIFACT_IMPORT_FETCH_TIMEOUT_MS
            )
            recordingR2Key = key
          }

          if (!transcriptR2Key) {
            await extendMeetingProcessingLease(
              meetingId,
              ARTIFACT_IMPORT_LEASE_MS
            )

            const key = meetingTranscriptR2Key(meeting.id)
            await putR2ObjectFromUrl(
              key,
              transcriptionUrl,
              ARTIFACT_IMPORT_FETCH_TIMEOUT_MS
            )
            transcriptR2Key = key
          }

          // It is expensive if we fail below, hence persisit the video storage key
          await prisma.meeting.update({
            where: { id: meeting.id },
            data: {
              recordingR2Key
            }
          })

          // This is non critical so we dont want to fail whole pipeline if this fails
          try {
            if (urls?.chatMessages && !chatMessagesR2Key) {
              await extendMeetingProcessingLease(
                meetingId,
                ARTIFACT_IMPORT_LEASE_MS
              )

              const key = meetingChatMessagesR2Key(meeting.id)
              await putR2ObjectFromUrl(
                key,
                urls.chatMessages,
                ARTIFACT_IMPORT_FETCH_TIMEOUT_MS
              )
              chatMessagesR2Key = key
            }
          } catch (error) {
            console.error(
              `Artifact chat messages import failed for ${meetingId}:`,
              error
            )
          }

          await prisma.meeting.update({
            where: { id: meeting.id },
            data: {
              recordingR2Key,
              transcriptR2Key,
              chatMessagesR2Key,
              baasSignedArtifactUrls: Prisma.DbNull,
              artifactsImportedAt: new Date(),
              processingStatus: 'pending',
              processingLeaseExpiresAt: null
            }
          })
        } catch (error) {
          console.error(`Artifact import failed for ${meetingId}:`, error)

          if (error instanceof R2UploadError) {
            if (
              error.statusCode >= 400 &&
              error.statusCode < 500 &&
              error.statusCode !== 408 &&
              error.statusCode !== 429
            ) {
              await failMeetingProcessing(meetingId, error.message)
              return
            }
          }

          // Schedule retry
          await prisma.meeting.updateMany({
            where: {
              id: meetingId,
              processingStatus: 'importing'
            },
            data: {
              processingLeaseExpiresAt: new Date(
                Date.now() + ARTIFACT_IMPORT_RETRY_DELAY_MS
              )
            }
          })
        }
      })
    )
  } catch (error) {
    console.error('Artifact import tick failed', error)
  }
}
