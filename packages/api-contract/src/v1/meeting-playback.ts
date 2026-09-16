import { z } from 'zod/v4'

import {
  BAAS_BOT_STATUSES,
  MEETING_BOT_UI_PHASES,
  MEETING_PROCESSING_STATUSES
} from '#src/baas-bot-status'
import { meetingTranscriptLineSchema } from '#src/meeting-baas-transcript'
import { _createResponseApiZod } from '#src/utils'

const baasBotStatusSchema = z.enum(BAAS_BOT_STATUSES)
const meetingBotUiPhaseSchema = z.enum(MEETING_BOT_UI_PHASES)
const meetingProcessingStatusSchema = z.enum(MEETING_PROCESSING_STATUSES)

const meetingHighlightSchema = z.object({
  id: z.string(),
  timestampSec: z.number().int().min(0),
  note: z.string().nullable()
})

const meetingActionItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  timestampSec: z.number().int().min(0).nullable(),
  completed: z.boolean()
})

const meetingParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().nullable(),
  profilePicture: z.url().nullable()
})

const meetingChatMessageSchema = z.object({
  id: z.string(),
  senderName: z.string(),
  text: z.string(),
  sentAt: z.iso.datetime()
})

const meetingRecordingPlaybackSchema = z.object({
  url: z.url(),
  expiresAt: z.iso.datetime()
})

const meetingDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  htmlLink: z.url().nullable(),
  uiPhase: meetingBotUiPhaseSchema,
  baasStatus: baasBotStatusSchema.nullable(),
  processingStatus: meetingProcessingStatusSchema,
  summary: z.string().nullable(),
  shareSlug: z.string().nullable(),
  recordingDurationSec: z.number().int().min(0).nullable(),
  recordingPlayback: meetingRecordingPlaybackSchema.nullable(),
  highlights: z.array(meetingHighlightSchema),
  actionItems: z.array(meetingActionItemSchema),
  participants: z.array(meetingParticipantSchema),
  chatMessages: z.array(meetingChatMessageSchema)
})

const getMeetingDetailResponseSchema =
  _createResponseApiZod(meetingDetailSchema)

const meetingTranscriptDataSchema = z.object({
  lines: z.array(meetingTranscriptLineSchema),
  durationSec: z.number().int().min(0).nullable()
})

const getMeetingTranscriptResponseSchema = _createResponseApiZod(
  meetingTranscriptDataSchema
)

const patchMeetingActionItemBodySchema = z.object({
  completed: z.boolean()
})

const patchMeetingActionItemResponseSchema = _createResponseApiZod(
  meetingActionItemSchema
)

export type GetMeetingDetailResponse = z.infer<
  typeof getMeetingDetailResponseSchema
>
export type GetMeetingDetailSuccessResponse = Extract<
  GetMeetingDetailResponse,
  { success: true }
>
export type MeetingDetail = z.infer<typeof meetingDetailSchema>
export type GetMeetingTranscriptResponse = z.infer<
  typeof getMeetingTranscriptResponseSchema
>
export type GetMeetingTranscriptSuccessResponse = Extract<
  GetMeetingTranscriptResponse,
  { success: true }
>
export type MeetingTranscriptData = z.infer<typeof meetingTranscriptDataSchema>
export type PatchMeetingActionItemBody = z.infer<
  typeof patchMeetingActionItemBodySchema
>
export type PatchMeetingActionItemResponse = z.infer<
  typeof patchMeetingActionItemResponseSchema
>
export type PatchMeetingActionItemSuccessResponse = Extract<
  PatchMeetingActionItemResponse,
  { success: true }
>

export {
  getMeetingDetailResponseSchema,
  getMeetingTranscriptResponseSchema,
  meetingActionItemSchema,
  meetingChatMessageSchema,
  patchMeetingActionItemBodySchema,
  patchMeetingActionItemResponseSchema,
  meetingDetailSchema,
  meetingHighlightSchema,
  meetingParticipantSchema,
  meetingRecordingPlaybackSchema,
  meetingTranscriptDataSchema
}
