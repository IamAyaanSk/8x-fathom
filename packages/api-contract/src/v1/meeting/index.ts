import {
  BAAS_STATUS_TO_PROCESS,
  MEETING_PROCESSING_STATUS,
  UI_MEET_STATUS
} from '@repo/meeting-dispatch'
import {
  meetingHighlightNoteSchema,
  meetingScratchpadTextSchema,
  meetingTimestampSecSchema
} from '@repo/shared-validations'
import { z } from 'zod/v4'

import { _createResponseApiZod } from '#src/utils'

export const meetingActionItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  timestampSec: meetingTimestampSecSchema.nullable(),
  completed: z.boolean()
})

export type MeetingActionItem = z.infer<typeof meetingActionItemSchema>

export const meetingHighlightSchema = z.object({
  id: z.string(),
  timestampSec: meetingTimestampSecSchema,
  endTimestampSec: meetingTimestampSecSchema.nullable(),
  note: meetingHighlightNoteSchema.nullable()
})

export type MeetingHighlight = z.infer<typeof meetingHighlightSchema>

export const meetingScratchpadEntrySchema = z.object({
  id: z.string(),
  timestampSec: meetingTimestampSecSchema,
  text: meetingScratchpadTextSchema,
  updatedAt: z.iso.datetime()
})

export type MeetingScratchpadEntry = z.infer<
  typeof meetingScratchpadEntrySchema
>

export const baasBotStatusSchema = z.enum(BAAS_STATUS_TO_PROCESS)
export const meetingBotUiPhaseSchema = z.enum(UI_MEET_STATUS)
export const meetingProcessingStatusSchema = z.enum(MEETING_PROCESSING_STATUS)

export const meetingParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().nullable(),
  profilePicture: z.url().nullable()
})

export const meetingChatMessageSchema = z.object({
  id: z.string(),
  senderName: z.string(),
  text: z.string(),
  sentAt: z.iso.datetime()
})

export const meetingRecordingPlaybackSchema = z.object({
  url: z.url(),
  expiresAt: z.iso.datetime()
})

export const meetingDetailSchema = z.object({
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

export type MeetingDetail = z.infer<typeof meetingDetailSchema>
export type MeetingPlaybackMedia = Pick<
  MeetingDetail,
  'recordingDurationSec' | 'recordingPlayback' | 'highlights'
>

export const meetingShareDetailSchema = meetingDetailSchema.pick({
  title: true,
  startTime: true,
  endTime: true,
  summary: true,
  recordingDurationSec: true,
  recordingPlayback: true,
  highlights: true,
  actionItems: true,
  participants: true
})

export type MeetingShareDetail = z.infer<typeof meetingShareDetailSchema>

export const meetingListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  meetingUrl: z.url(),
  htmlLink: z.url().nullable(),
  baasBotId: z.string().nullable(),
  baasStatus: baasBotStatusSchema.nullable(),
  uiPhase: meetingBotUiPhaseSchema
})

export type MeetingListItem = z.infer<typeof meetingListItemSchema>

export const meetingsListDataSchema = z.object({
  meetings: z.array(meetingListItemSchema)
})

// Meetings endpoints schemas

export const getMeetingsUpcomingResponseSchema = _createResponseApiZod(
  meetingsListDataSchema
)

export const getMeetingsCompletedResponseSchema = _createResponseApiZod(
  meetingsListDataSchema
)

export const postMeetingCaptureRequestParamsSchema = z.object({
  meetingId: z.string()
})

export type PostMeetingCaptureRequestParams = z.infer<
  typeof postMeetingCaptureRequestParamsSchema
>

const postMeetingBotDispatchDataSchema = z.object({
  meetingId: z.string(),
  baasBotId: z.string(),
  baasStatus: baasBotStatusSchema.nullable(),
  uiPhase: meetingBotUiPhaseSchema
})

export const postMeetingCaptureResponseSchema = _createResponseApiZod(
  postMeetingBotDispatchDataSchema
)

export type GetMeetingsUpcomingResponse = z.infer<
  typeof getMeetingsUpcomingResponseSchema
>
export type GetMeetingsCompletedResponse = z.infer<
  typeof getMeetingsCompletedResponseSchema
>
export type PostMeetingCaptureResponse = z.infer<
  typeof postMeetingCaptureResponseSchema
>
