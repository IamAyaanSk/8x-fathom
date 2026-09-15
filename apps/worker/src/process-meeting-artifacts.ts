import '#src/env'

import {
  formatMeetingActionItemText,
  generateMeetingActionItems,
  generateMeetingSummary
} from '@repo/ai'
import { formatMeetingBaasTranscriptTextFromJson } from '@repo/api-contract/meeting-baas-transcript'
import { prisma } from '@repo/db'

import { ingestMeetingChatMessages } from '#src/ingest-meeting-chat-messages'
import { getR2ObjectUtf8 } from '#src/r2-client'

function _errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

async function _loadMeetingTranscriptText(
  meetingId: string,
  transcriptR2Key: string
): Promise<string | null> {
  try {
    const rawTranscript = await getR2ObjectUtf8(transcriptR2Key)
    return formatMeetingBaasTranscriptTextFromJson(rawTranscript)
  } catch (error) {
    console.error(
      `Transcript load failed for ${meetingId}: ${_errorMessage(error)}`
    )
    return null
  }
}

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
    console.error(
      `Summary generation failed for ${meetingId}: ${_errorMessage(error)}`
    )
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
      await tx.actionItem.deleteMany({
        where: { meetingId }
      })

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
    console.error(
      `Action items generation failed for ${meetingId}: ${_errorMessage(error)}`
    )
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
    return
  }

  const transcript = await _loadMeetingTranscriptText(
    meetingId,
    meeting.transcriptR2Key
  )
  if (!transcript) {
    return
  }

  if (needsSummary) {
    await _runSummaryStep({
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      transcript
    })
  }

  const afterSummary = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      summary: true,
      actionItemsExtractedAt: true,
      title: true
    }
  })

  if (
    !afterSummary ||
    afterSummary.summary === null ||
    afterSummary.actionItemsExtractedAt !== null
  ) {
    return
  }

  await _runActionItemsStep({
    meetingId: meeting.id,
    meetingTitle: afterSummary.title,
    transcript
  })
}

async function processMeetingArtifacts(meetingId: string): Promise<void> {
  await ingestMeetingChatMessages(meetingId)
  await _runTranscriptArtifactSteps(meetingId)
}

export { processMeetingArtifacts }
