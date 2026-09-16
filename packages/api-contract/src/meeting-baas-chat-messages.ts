import { trimmedStringWithMinLengthOneSchema } from '@repo/shared-validations'
import { z } from 'zod/v4'

const meetingBaasChatMessageSchema = z.object({
  message_id: trimmedStringWithMinLengthOneSchema,
  sender_name: trimmedStringWithMinLengthOneSchema,
  sender_id: z.number().int().nullish(),
  text: z.string(),
  timestamp: z.iso.datetime()
})

const meetingBaasChatMessagesFileSchema = z.array(meetingBaasChatMessageSchema)

type MeetingBaasChatMessage = z.infer<typeof meetingBaasChatMessageSchema>

type MeetingChatMessageInsert = {
  baasMessageId: string
  senderName: string
  baasSenderId: number | null
  text: string
  sentAt: Date
}

function parseMeetingBaasChatMessagesFile(
  data: unknown
): MeetingBaasChatMessage[] {
  return z.parse(meetingBaasChatMessagesFileSchema, data)
}

function meetingBaasChatMessagesToInsertRows(
  messages: MeetingBaasChatMessage[]
): MeetingChatMessageInsert[] {
  return [...messages]
    .sort(
      (left, right) =>
        new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
    )
    .map((message) => ({
      baasMessageId: message.message_id,
      senderName: message.sender_name,
      baasSenderId: message.sender_id ?? null,
      text: message.text,
      sentAt: new Date(message.timestamp)
    }))
}

function parseMeetingBaasChatMessagesFileFromJson(
  rawJson: string
): MeetingChatMessageInsert[] {
  const parsed = parseMeetingBaasChatMessagesFile(JSON.parse(rawJson))
  return meetingBaasChatMessagesToInsertRows(parsed)
}

export {
  meetingBaasChatMessageSchema,
  meetingBaasChatMessagesFileSchema,
  meetingBaasChatMessagesToInsertRows,
  parseMeetingBaasChatMessagesFile,
  parseMeetingBaasChatMessagesFileFromJson,
  type MeetingBaasChatMessage,
  type MeetingChatMessageInsert
}
