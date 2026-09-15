import '#src/env'

import { parseMeetingBaasChatMessagesFileFromJson } from '@repo/api-contract/meeting-baas-chat-messages'
import { prisma } from '@repo/db'

import { getR2ObjectUtf8 } from '#src/r2-client'

function _errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

async function ingestMeetingChatMessages(meetingId: string): Promise<void> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      chatMessagesR2Key: true,
      chatMessagesIngestedAt: true
    }
  })

  if (!meeting || meeting.chatMessagesIngestedAt !== null) {
    return
  }

  if (!meeting.chatMessagesR2Key) {
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { chatMessagesIngestedAt: new Date() }
    })
    return
  }

  try {
    const rawJson = await getR2ObjectUtf8(meeting.chatMessagesR2Key)
    const rows = parseMeetingBaasChatMessagesFileFromJson(rawJson)

    await prisma.$transaction(async (tx) => {
      await tx.meetingChatMessage.deleteMany({
        where: { meetingId: meeting.id }
      })

      if (rows.length > 0) {
        await tx.meetingChatMessage.createMany({
          data: rows.map((row) => ({
            meetingId: meeting.id,
            baasMessageId: row.baasMessageId,
            senderName: row.senderName,
            baasSenderId: row.baasSenderId,
            text: row.text,
            sentAt: row.sentAt
          }))
        })
      }

      await tx.meeting.update({
        where: { id: meeting.id },
        data: { chatMessagesIngestedAt: new Date() }
      })
    })
  } catch (error) {
    console.error(
      `Chat messages ingest failed for ${meetingId}: ${_errorMessage(error)}`
    )
  }
}

export { ingestMeetingChatMessages }
