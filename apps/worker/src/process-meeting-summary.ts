import '#src/env'

import {
  formatMeetingActionItemText,
  generateMeetingActionItems,
  generateMeetingSummary
} from '@repo/ai'
import { prisma } from '@repo/db'

import { getR2ObjectUtf8 } from '#src/r2-client'
import { formatMeetingBaasTranscriptTextFromJson } from '@repo/api-contract/meeting-baas-transcript'

async function processMeetingSummary(meetingId: string): Promise<void> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      title: true,
      transcriptR2Key: true,
      summary: true,
      processingStatus: true
    }
  })

  if (!meeting) {
    return
  }

  if (meeting.summary) {
    return
  }

  if (!meeting.transcriptR2Key) {
    throw new Error('Meeting has no transcriptR2Key')
  }

  const rawTranscript = await getR2ObjectUtf8(meeting.transcriptR2Key)
  const transcript = formatMeetingBaasTranscriptTextFromJson(rawTranscript)

  const { summary } = await generateMeetingSummary({
    transcript,
    meetingTitle: meeting.title,
    template: 'enhanced'
  })

  const { actionItems } = await generateMeetingActionItems({
    transcript,
    meetingTitle: meeting.title
  })

  await prisma.$transaction(async (tx) => {
    await tx.meeting.update({
      where: { id: meeting.id },
      data: { summary }
    })

    await tx.actionItem.deleteMany({
      where: { meetingId: meeting.id }
    })

    if (actionItems.length === 0) {
      return
    }

    await tx.actionItem.createMany({
      data: actionItems.map((item) => ({
        meetingId: meeting.id,
        text: formatMeetingActionItemText(item),
        timestampSec: item.timestampSec
      }))
    })
  })
}

export { processMeetingSummary }
