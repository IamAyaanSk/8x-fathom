import '#src/env'

import { generateMeetingSummary } from '@repo/ai'
import { prisma } from '@repo/db'

import { transcriptTextFromMeetingBaasJson } from '#src/meeting-transcript'
import { getR2ObjectUtf8 } from '#src/r2-client'

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
  const transcript = transcriptTextFromMeetingBaasJson(rawTranscript)

  const { summary } = await generateMeetingSummary({
    transcript,
    meetingTitle: meeting.title,
    template: 'enhanced'
  })

  await prisma.meeting.update({
    where: { id: meeting.id },
    data: { summary }
  })
}

export { processMeetingSummary }
