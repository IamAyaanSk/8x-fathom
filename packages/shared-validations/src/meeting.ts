import { z } from 'zod/v4'

import {
  meetingHighlightNoteSchema,
  meetingScratchpadTextSchema,
  meetingTimestampSecSchema
} from './meeting-timestamp-sec.js'

// Meeting status
const BAAS_STATUS_TO_PROCESS = [
  'joining',
  'in_waiting_room',
  'in_call_recording',
  'transcribing',
  'completed',
  'failed'
] as const

type BaasStatusToProcess = (typeof BAAS_STATUS_TO_PROCESS)[number]
const BAAS_STATUS_MAP: Record<string, BaasStatusToProcess> = {
  joining: 'joining',
  in_waiting_room: 'in_waiting_room',
  in_call_recording: 'in_call_recording',
  transcribing: 'transcribing',
  completed: 'completed',
  failed: 'failed'
}

const MEETING_PROCESSING_STATUS = [
  'idle',
  'importing',
  'pending',
  'processing',
  'ready',
  'failed'
] as const

type MeetingProcessingStatus = (typeof MEETING_PROCESSING_STATUS)[number]

const BAAS_STATUS_RANK: Record<BaasStatusToProcess, number> = {
  joining: 1,
  in_waiting_room: 2,
  in_call_recording: 3,
  transcribing: 4,
  completed: 5,
  failed: 6
} as const

const BAAS_WEBHOOK_STATUS_TO_PROCESS = [
  'joining',
  'in_waiting_room',
  'in_call_recording',
  'completed'
] as const
type BaasWebHookStatusToProcess =
  (typeof BAAS_WEBHOOK_STATUS_TO_PROCESS)[number]

const BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP: Record<
  string,
  BaasWebHookStatusToProcess
> = {
  joining: 'joining',
  in_waiting_room: 'in_waiting_room',
  in_call_recording: 'in_call_recording',
  completed: 'completed'
} as const

const UI_MEET_STATUS = [
  'joining',
  'ready',
  'failed_processing',
  'failed_to_join',
  'starting_soon',
  'in_call_recording',
  'call_ended_processing',
  'transcribing',
  'in_waiting_room'
] as const
type UIMeetStatus = (typeof UI_MEET_STATUS)[number]

export {
  BAAS_STATUS_TO_PROCESS,
  BAAS_STATUS_MAP,
  BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP,
  BAAS_STATUS_RANK,
  UI_MEET_STATUS,
  MEETING_PROCESSING_STATUS,
  type UIMeetStatus,
  type MeetingProcessingStatus,
  type BaasStatusToProcess
}

export const baasBotStatusSchema = z.enum(BAAS_STATUS_TO_PROCESS)
export const meetingBotUiPhaseSchema = z.enum(UI_MEET_STATUS)
export const meetingProcessingStatusSchema = z.enum(MEETING_PROCESSING_STATUS)

// Meeting domain schemas

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

export const meetingParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().nullable(),
  profilePicture: z.url().nullable()
})

export type MeetingParticipant = z.infer<typeof meetingParticipantSchema>

export const meetingChatMessageSchema = z.object({
  id: z.string(),
  senderName: z.string(),
  text: z.string(),
  sentAt: z.iso.datetime()
})

export type MeetingChatMessage = z.infer<typeof meetingChatMessageSchema>

export const meetingRecordingPlaybackSchema = z.object({
  url: z.url(),
  expiresAt: z.iso.datetime()
})

export type MeetingRecordingPlayback = z.infer<
  typeof meetingRecordingPlaybackSchema
>

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

export type MeetingsListData = z.infer<typeof meetingsListDataSchema>

// Meeting transcript schemas

const meetingBaasTranscriptWordSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
  confidence: z.number().optional()
})

const meetingBaasTranscriptUtteranceSchema = z.object({
  text: z.string(),
  language: z.string().optional(),
  start: z.number().optional(),
  end: z.number().optional(),
  confidence: z.number().optional(),
  channel: z.number().optional(),
  words: z.array(meetingBaasTranscriptWordSchema).optional(),
  speaker: z.string().optional()
})

const meetingBaasOutputTranscriptionSchema = z.object({
  bot_id: z.string(),
  provider: z.string().optional(),
  result: z.object({
    utterances: z.array(meetingBaasTranscriptUtteranceSchema),
    languages: z.array(z.string()).optional(),
    total_utterances: z.number().optional(),
    total_duration: z.number().optional()
  }),
  created_at: z.string().optional()
})

type MeetingBaasOutputTranscription = z.infer<
  typeof meetingBaasOutputTranscriptionSchema
>

type MeetingBaasTranscriptUtterance = z.infer<
  typeof meetingBaasTranscriptUtteranceSchema
>

export {
  meetingBaasOutputTranscriptionSchema,
  meetingBaasTranscriptUtteranceSchema,
  meetingBaasTranscriptWordSchema,
  type MeetingBaasOutputTranscription,
  type MeetingBaasTranscriptUtterance
}
