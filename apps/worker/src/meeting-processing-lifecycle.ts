import '#src/env'
import { prisma } from '@repo/db'

import { MEETING_PROCESSING_LEASE_MS } from '#src/constants'

function _leaseExpiresAt(leaseMs: number): Date {
  return new Date(Date.now() + leaseMs)
}

async function extendMeetingProcessingLease(
  meetingId: string,
  leaseMs: number = MEETING_PROCESSING_LEASE_MS
): Promise<void> {
  await prisma.meeting.updateMany({
    where: {
      id: meetingId,
      processingStatus: { in: ['processing', 'importing'] }
    },
    data: { processingLeaseExpiresAt: _leaseExpiresAt(leaseMs) }
  })
}

async function failMeetingProcessing(
  meetingId: string,
  reason: string
): Promise<void> {
  const result = await prisma.meeting.updateMany({
    where: {
      id: meetingId,
      processingStatus: { in: ['pending', 'processing', 'importing'] }
    },
    data: {
      processingStatus: 'failed',
      processingLeaseExpiresAt: null
    }
  })

  if (result.count > 0) {
    console.error(`Meeting processing failed for ${meetingId}: ${reason}`)
  }
}

function isUnrecoverableTranscriptArtifactError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : ''
  return (
    message.includes('no utterances') ||
    message.includes('Expected embedding length')
  )
}

export {
  extendMeetingProcessingLease,
  failMeetingProcessing,
  isUnrecoverableTranscriptArtifactError
}
