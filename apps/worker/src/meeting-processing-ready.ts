import '#src/env'

import { prisma } from '@repo/db'

async function tryMarkMeetingProcessingReady(meetingId: string): Promise<void> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      processingStatus: true,
      chatMessagesIngestedAt: true,
      summary: true,
      actionItemsExtractedAt: true,
      transcriptEmbeddingsExtractedAt: true
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

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { processingStatus: 'ready' }
  })
}

export { tryMarkMeetingProcessingReady }
