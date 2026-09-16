import {
  meetingHighlightNoteSchema,
  meetingScratchpadTextSchema,
  meetingTimestampSecSchema
} from '@repo/shared-validations'
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
  endTimestampSec: z.number().int().min(0).nullable(),
  note: z.string().nullable()
})

const meetingScratchpadEntrySchema = z.object({
  id: z.string(),
  timestampSec: z.number().int().min(0),
  text: z.string(),
  updatedAt: z.iso.datetime()
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
  recordingStartedAt: z.iso.datetime().nullable(),
  recordingPlayback: meetingRecordingPlaybackSchema.nullable(),
  highlights: z.array(meetingHighlightSchema),
  scratchpadEntries: z.array(meetingScratchpadEntrySchema),
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

const postMeetingHighlightBodySchema = z.object({
  timestampSec: meetingTimestampSecSchema
})

const postMeetingHighlightResponseSchema =
  _createResponseApiZod(meetingHighlightSchema)

const patchMeetingHighlightBodySchema = z
  .object({
    endTimestampSec: meetingTimestampSecSchema.optional(),
    note: meetingHighlightNoteSchema.nullable().optional()
  })
  .refine(
    (body) => body.endTimestampSec != null || body.note !== undefined,
    { message: 'Highlight update must include end time or note' }
  )

const patchMeetingHighlightResponseSchema =
  _createResponseApiZod(meetingHighlightSchema)

const putMeetingScratchpadEntryBodySchema = z.object({
  timestampSec: meetingTimestampSecSchema,
  text: meetingScratchpadTextSchema
})

const putMeetingScratchpadEntryResponseSchema = _createResponseApiZod(
  meetingScratchpadEntrySchema
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
export type PostMeetingHighlightBody = z.infer<
  typeof postMeetingHighlightBodySchema
>
export type PostMeetingHighlightResponse = z.infer<
  typeof postMeetingHighlightResponseSchema
>
export type PostMeetingHighlightSuccessResponse = Extract<
  PostMeetingHighlightResponse,
  { success: true }
>
export type PatchMeetingHighlightBody = z.infer<
  typeof patchMeetingHighlightBodySchema
>
export type PatchMeetingHighlightResponse = z.infer<
  typeof patchMeetingHighlightResponseSchema
>
export type PatchMeetingHighlightSuccessResponse = Extract<
  PatchMeetingHighlightResponse,
  { success: true }
>
export type PutMeetingScratchpadEntryBody = z.infer<
  typeof putMeetingScratchpadEntryBodySchema
>
export type PutMeetingScratchpadEntryResponse = z.infer<
  typeof putMeetingScratchpadEntryResponseSchema
>
export type PutMeetingScratchpadEntrySuccessResponse = Extract<
  PutMeetingScratchpadEntryResponse,
  { success: true }
>
export type MeetingScratchpadEntry = z.infer<typeof meetingScratchpadEntrySchema>

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
  meetingScratchpadEntrySchema,
  meetingTranscriptDataSchema,
  patchMeetingHighlightBodySchema,
  patchMeetingHighlightResponseSchema,
  postMeetingHighlightBodySchema,
  postMeetingHighlightResponseSchema,
  putMeetingScratchpadEntryBodySchema,
  putMeetingScratchpadEntryResponseSchema
}
