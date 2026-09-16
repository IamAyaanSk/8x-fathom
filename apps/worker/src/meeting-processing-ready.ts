import '#src/env'
import { prisma } from '@repo/db'

import {
  createMeetingShareSlug,
  isShareSlugUniqueConstraintError
} from '#src/meeting-share-slug'

const SHARE_SLUG_ATTEMPTS = 5

async function tryMarkMeetingProcessingReady(meetingId: string): Promise<void> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      processingStatus: true,
      chatMessagesIngestedAt: true,
      summary: true,
      actionItemsExtractedAt: true,
      transcriptEmbeddingsExtractedAt: true,
      shareSlug: true
    }
  })

  if (!meeting) {
    return
  }

  if (meeting.processingStatus !== 'processing') {
    return
  }

  if (
    meeting.chatMessagesIngestedAt === null ||
    meeting.summary === null ||
    meeting.actionItemsExtractedAt === null ||
    meeting.transcriptEmbeddingsExtractedAt === null
  ) {
    return
  }

  const readyData = {
    processingStatus: 'ready' as const,
    processingLeaseExpiresAt: null
  }

  if (meeting.shareSlug) {
    await prisma.meeting.update({
      where: { id: meetingId },
      data: readyData
    })
    return
  }

  for (let attempt = 0; attempt < SHARE_SLUG_ATTEMPTS; attempt += 1) {
    try {
      await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          ...readyData,
          shareSlug: createMeetingShareSlug()
        }
      })
      return
    } catch (error) {
      if (
        !isShareSlugUniqueConstraintError(error) ||
        attempt === SHARE_SLUG_ATTEMPTS - 1
      ) {
        throw error
      }
    }
  }
}

export { tryMarkMeetingProcessingReady }
