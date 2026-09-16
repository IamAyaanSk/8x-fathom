import '#src/env'
import {
  formatMeetingActionItemText,
  generateMeetingActionItems,
  generateMeetingSummary
} from '@repo/ai'
import { formatMeetingBaasTranscriptTextFromJson } from '@repo/api-contract/meeting-baas-transcript'
import { prisma } from '@repo/db'

import { ingestMeetingChatMessages } from '#src/ingest-meeting-chat-messages'
import { ingestMeetingEmbeddings } from '#src/ingest-meeting-embeddings'
import {
  extendMeetingProcessingLease,
  failMeetingProcessing
} from '#src/meeting-processing-lifecycle'
import { tryMarkMeetingProcessingReady } from '#src/meeting-processing-ready'
import { getR2ObjectUtf8 } from '#src/r2-storage'

function _errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

async function _isMeetingStillProcessing(meetingId: string): Promise<boolean> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { processingStatus: true }
  })
  return meeting?.processingStatus === 'processing'
}

type _TranscriptLoadResult =
  | { ok: true; transcript: string }
  | { ok: false; unrecoverable: boolean }

async function _loadMeetingTranscriptText(
  meetingId: string,
  transcriptR2Key: string
): Promise<_TranscriptLoadResult> {
  let rawTranscript: string
  try {
    rawTranscript = await getR2ObjectUtf8(transcriptR2Key)
  } catch (error) {
    console.error(
      `Transcript load failed for ${meetingId}: ${_errorMessage(error)}`
    )
    return { ok: false, unrecoverable: false }
  }

  try {
    const transcript = formatMeetingBaasTranscriptTextFromJson(rawTranscript)
    return { ok: true, transcript }
  } catch (error) {
    console.error(
      `Transcript parse failed for ${meetingId}: ${_errorMessage(error)}`
    )
    return { ok: false, unrecoverable: true }
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
    await failMeetingProcessing(
      meetingId,
      'Missing transcript artifact in storage'
    )
    return
  }

  const transcriptLoad = await _loadMeetingTranscriptText(
    meetingId,
    meeting.transcriptR2Key
  )
  if (!transcriptLoad.ok) {
    if (transcriptLoad.unrecoverable) {
      await failMeetingProcessing(meetingId, 'Transcript could not be parsed')
    }
    return
  }

  const { transcript } = transcriptLoad

  if (needsSummary) {
    await extendMeetingProcessingLease(meetingId)
    await _runSummaryStep({
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      transcript
    })
  }

  if (!(await _isMeetingStillProcessing(meetingId))) {
    return
  }

  const forActionItems = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      title: true,
      actionItemsExtractedAt: true
    }
  })

  if (!forActionItems || forActionItems.actionItemsExtractedAt !== null) {
    return
  }

  await extendMeetingProcessingLease(meetingId)
  await _runActionItemsStep({
    meetingId: meeting.id,
    meetingTitle: forActionItems.title,
    transcript
  })
}

async function processMeetingArtifacts(meetingId: string): Promise<void> {
  await extendMeetingProcessingLease(meetingId)

  await ingestMeetingChatMessages(meetingId)
  if (!(await _isMeetingStillProcessing(meetingId))) {
    return
  }
  await tryMarkMeetingProcessingReady(meetingId)

  await _runTranscriptArtifactSteps(meetingId)
  if (!(await _isMeetingStillProcessing(meetingId))) {
    return
  }
  await tryMarkMeetingProcessingReady(meetingId)

  await ingestMeetingEmbeddings(meetingId)
  if (!(await _isMeetingStillProcessing(meetingId))) {
    return
  }
  await tryMarkMeetingProcessingReady(meetingId)
}

export { processMeetingArtifacts }
