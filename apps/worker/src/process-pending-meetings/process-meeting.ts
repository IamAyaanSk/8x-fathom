import {
  formatMeetingActionItemText,
  generateMeetingActionItems,
  generateMeetingSummary
} from '@repo/ai'
import { prisma } from '@repo/db'
import { formatMeetingBaasTranscriptForAgent } from '@repo/meeting-dispatch'

import { ingestMeetingChatMessages } from '#src/process-pending-meetings/ingest-chat-messages'
import { ingestMeetingEmbeddings } from '#src/process-pending-meetings/ingest-embeddings'
import { getR2ObjectUtf8 } from '#src/r2-storage'
import { extendMeetingProcessingLease, failMeetingProcessing } from '#src/utils'

async function _runSummaryStep({
  meetingId,
  meetingTitle,
  transcript
}: {
  meetingId: string
  meetingTitle: string
  transcript: string
}): Promise<void> {
  try {
    const { summary } = await generateMeetingSummary({
      transcript,
      meetingTitle,
      template: 'enhanced'
    })

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { summary }
    })
  } catch (error) {
    console.error(`Summary generation failed for ${meetingId}:`, error)
  }
}

async function _runActionItemsStep({
  meetingId,
  meetingTitle,
  transcript
}: {
  meetingId: string
  meetingTitle: string
  transcript: string
}): Promise<void> {
  try {
    const { actionItems } = await generateMeetingActionItems({
      transcript,
      meetingTitle
    })

    await prisma.$transaction(async (tx) => {
      if (actionItems.length > 0) {
        await tx.actionItem.createMany({
          data: actionItems.map((item) => ({
            meetingId,
            text: formatMeetingActionItemText(item),
            timestampSec: item.timestampSec,
            completed: false
          }))
        })
      }

      await tx.meeting.update({
        where: { id: meetingId },
        data: { actionItemsExtractedAt: new Date() }
      })
    })
  } catch (error) {
    console.error(`Action items generation failed for ${meetingId}:`, error)
  }
}

async function _runTranscriptArtifactSteps(meetingId: string): Promise<void> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      title: true,
      transcriptR2Key: true,
      summary: true,
      actionItemsExtractedAt: true
    }
  })

  if (!meeting) {
    return
  }

  const needsSummary = meeting.summary === null
  const needsActionItems = meeting.actionItemsExtractedAt === null

  if (!needsSummary && !needsActionItems) {
    return
  }

  if (!meeting.transcriptR2Key) {
    console.error(
      `Transcript artifacts skipped for ${meetingId}: missing transcriptR2Key`
    )
    await failMeetingProcessing(
      meetingId,
      'Missing transcript artifact in storage'
    )
    return
  }

  let rawTranscript: string
  try {
    rawTranscript = await getR2ObjectUtf8(meeting.transcriptR2Key)
  } catch (error) {
    console.error(`Transcript load failed for ${meetingId}:`, error)
    return
  }

  let transcript: string
  try {
    transcript = formatMeetingBaasTranscriptForAgent(rawTranscript)
  } catch (error) {
    console.error(`Transcript parse failed for ${meetingId}:`, error)
    await failMeetingProcessing(meetingId, 'Transcript could not be parsed')
    return
  }

  if (needsSummary) {
    await extendMeetingProcessingLease(meetingId)
    await _runSummaryStep({
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      transcript
    })
  }

  if (needsActionItems) {
    await extendMeetingProcessingLease(meetingId)
    await _runActionItemsStep({
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      transcript
    })
  }
}

export async function processMeeting(meetingId: string): Promise<void> {
  await extendMeetingProcessingLease(meetingId)

  // Ok if this fails, as this is not criritcal
  await ingestMeetingChatMessages(meetingId)

  // We will retry for this if a recoverable error was found
  await _runTranscriptArtifactSteps(meetingId)

  // If previous step failed the processing, we won't continue
  const meetingStateAfterArtifactIngestion = await prisma.meeting
    .findUnique({
      where: { id: meetingId },
      select: { processingStatus: true }
    })
    .then((m) => m?.processingStatus)

  if (meetingStateAfterArtifactIngestion !== 'processing') {
    return
  }

  await ingestMeetingEmbeddings(meetingId)

  const meetingAfterEmbeddingIngestion = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      chatMessagesIngestedAt: true,
      summary: true,
      actionItemsExtractedAt: true,
      transcriptEmbeddingsExtractedAt: true
    }
  })

  if (
    meetingAfterEmbeddingIngestion &&
    meetingAfterEmbeddingIngestion.chatMessagesIngestedAt !== null &&
    meetingAfterEmbeddingIngestion.summary !== null &&
    meetingAfterEmbeddingIngestion.actionItemsExtractedAt !== null &&
    meetingAfterEmbeddingIngestion.transcriptEmbeddingsExtractedAt !== null
  ) {
    await prisma.meeting.updateMany({
      where: { id: meetingId, processingStatus: 'processing' },
      data: {
        processingStatus: 'ready',
        processingLeaseExpiresAt: null
      }
    })
  }
}
