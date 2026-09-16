import '#src/env'
import {
  baasSignedArtifactUrlsSchema,
  transcriptionSignedUrl
} from '@repo/api-contract/meeting-baas-artifacts'
import { Prisma, prisma } from '@repo/db'

import {
  ARTIFACT_IMPORT_FETCH_TIMEOUT_MS,
  ARTIFACT_IMPORT_LEASE_MS,
  ARTIFACT_IMPORT_RETRY_DELAY_MS
} from '#src/constants'
import {
  meetingChatMessagesR2Key,
  meetingRecordingR2Key,
  meetingTranscriptR2Key
} from '#src/meeting-artifact-r2-keys'
import {
  extendMeetingProcessingLease,
  failMeetingProcessing
} from '#src/meeting-processing-lifecycle'
import { putR2ObjectFromUrl } from '#src/r2-storage'

function _errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

function _isUnrecoverableImportError(error: unknown): boolean {
  const message = _errorMessage(error)
  const match = message.match(/Artifact download failed \((\d+)\)/)
  if (!match) {
    return false
  }
  const status = Number(match[1])
  return status >= 400 && status < 500 && status !== 429
}

async function _scheduleImportRetry(meetingId: string): Promise<void> {
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

async function importMeetingArtifacts(meetingId: string): Promise<void> {
  await extendMeetingProcessingLease(meetingId, ARTIFACT_IMPORT_LEASE_MS)

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      processingStatus: true,
      baasSignedArtifactUrls: true,
      recordingR2Key: true,
      transcriptR2Key: true,
      chatMessagesR2Key: true
    }
  })

  if (!meeting || meeting.processingStatus !== 'importing') {
    return
  }

  const parsedUrls = baasSignedArtifactUrlsSchema.safeParse(
    meeting.baasSignedArtifactUrls
  )
  if (!parsedUrls.success) {
    await failMeetingProcessing(meetingId, 'Invalid signed artifact URLs')
    return
  }

  const urls = parsedUrls.data
  const transcriptionUrl = transcriptionSignedUrl(urls)
  if (!transcriptionUrl) {
    await failMeetingProcessing(meetingId, 'Missing transcription signed URL')
    return
  }

  try {
    let recordingR2Key = meeting.recordingR2Key
    if (urls.video && !recordingR2Key) {
      await extendMeetingProcessingLease(meetingId, ARTIFACT_IMPORT_LEASE_MS)
      const key = meetingRecordingR2Key(meeting.id)
      await putR2ObjectFromUrl(
        key,
        urls.video,
        ARTIFACT_IMPORT_FETCH_TIMEOUT_MS
      )
      recordingR2Key = key
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { recordingR2Key }
      })
    }

    let transcriptR2Key = meeting.transcriptR2Key
    if (!transcriptR2Key) {
      await extendMeetingProcessingLease(meetingId, ARTIFACT_IMPORT_LEASE_MS)
      const key = meetingTranscriptR2Key(meeting.id)
      await putR2ObjectFromUrl(
        key,
        transcriptionUrl,
        ARTIFACT_IMPORT_FETCH_TIMEOUT_MS
      )
      transcriptR2Key = key
    }

    let chatMessagesR2Key = meeting.chatMessagesR2Key
    if (urls.chatMessages && !chatMessagesR2Key) {
      await extendMeetingProcessingLease(meetingId, ARTIFACT_IMPORT_LEASE_MS)
      const key = meetingChatMessagesR2Key(meeting.id)
      await putR2ObjectFromUrl(
        key,
        urls.chatMessages,
        ARTIFACT_IMPORT_FETCH_TIMEOUT_MS
      )
      chatMessagesR2Key = key
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
    const message = _errorMessage(error)
    console.error(`Artifact import failed for ${meetingId}: ${message}`)

    if (_isUnrecoverableImportError(error)) {
      await failMeetingProcessing(meetingId, message)
      return
    }

    await _scheduleImportRetry(meetingId)
  }
}

export { importMeetingArtifacts }
