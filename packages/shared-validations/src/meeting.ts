import { z } from 'zod/v4'

export const meetingTimestampSecSchema = z.number().int().min(0)

export const meetingScratchpadTextSchema = z.string().trim().min(1).max(4000)

export const meetingHighlightNoteSchema = z.string().trim().max(500)

// ============================================================================
// 1. Status & Lifecycles
// ============================================================================

export const BAAS_STATUS_TO_PROCESS = [
  'joining',
  'in_waiting_room',
  'in_call_recording',
  'transcribing',
  'completed',
  'failed'
] as const

export type BaasStatusToProcess = (typeof BAAS_STATUS_TO_PROCESS)[number]

export const BAAS_STATUS_MAP: Record<string, BaasStatusToProcess> = {
  joining: 'joining',
  in_waiting_room: 'in_waiting_room',
  in_call_recording: 'in_call_recording',
  transcribing: 'transcribing',
  completed: 'completed',
  failed: 'failed'
}

export const BAAS_STATUS_RANK: Record<BaasStatusToProcess, number> = {
  joining: 1,
  in_waiting_room: 2,
  in_call_recording: 3,
  transcribing: 4,
  completed: 5,
  failed: 6
} as const

export const BAAS_WEBHOOK_STATUS_TO_PROCESS = [
  'joining',
  'in_waiting_room',
  'in_call_recording',
  'transcribing'
] as const

export type BaasWebHookStatusToProcess =
  (typeof BAAS_WEBHOOK_STATUS_TO_PROCESS)[number]

export const BAAS_WEBHOOK_STATUS_TO_PROCESS_MAP: Record<
  string,
  BaasWebHookStatusToProcess
> = {
  joining: 'joining',
  in_waiting_room: 'in_waiting_room',
  in_call_recording: 'in_call_recording',
  transcribing: 'transcribing'
} as const

export const MEETING_PROCESSING_STATUS = [
  'idle',
  'importing',
  'pending',
  'processing',
  'ready',
  'failed'
] as const

export type MeetingProcessingStatus = (typeof MEETING_PROCESSING_STATUS)[number]

export const UI_MEET_STATUS = [
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

export type UIMeetStatus = (typeof UI_MEET_STATUS)[number]

export const baasBotStatusSchema = z.enum(BAAS_STATUS_TO_PROCESS)
export const meetingBotUiPhaseSchema = z.enum(UI_MEET_STATUS)
export const meetingProcessingStatusSchema = z.enum(MEETING_PROCESSING_STATUS)

// ============================================================================
// 2. Meeting Domain Entities
// ============================================================================

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

// ============================================================================
// 3. Meeting DTOs & Views
// ============================================================================

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

// ============================================================================
// 4. MeetingBaas Transcript & Output
// ============================================================================

export const meetingBaasTranscriptWordSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
  confidence: z.number().optional()
})

export type MeetingBaasTranscriptWord = z.infer<
  typeof meetingBaasTranscriptWordSchema
>

export const meetingBaasTranscriptUtteranceSchema = z.object({
  text: z.string(),
  language: z.string().optional(),
  start: z.number().optional(),
  end: z.number().optional(),
  confidence: z.number().optional(),
  channel: z.number().optional(),
  words: z.array(meetingBaasTranscriptWordSchema).optional(),
  speaker: z.string().optional()
})

export type MeetingBaasTranscriptUtterance = z.infer<
  typeof meetingBaasTranscriptUtteranceSchema
>

export const meetingBaasOutputTranscriptionSchema = z.object({
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

export type MeetingBaasOutputTranscription = z.infer<
  typeof meetingBaasOutputTranscriptionSchema
>

export const meetingTranscriptLineSchema = z.object({
  startSec: z.number(),
  endSec: z.number(),
  speaker: z.string().nullable(),
  text: z.string().min(1)
})

export type MeetingTranscriptLine = z.infer<typeof meetingTranscriptLineSchema>

// ============================================================================
// 5. MeetingBaas Artifacts & Chat Files
// ============================================================================

export const baasSignedArtifactUrlsSchema = z.object({
  video: z.url().optional().nullable(),
  transcription: z.url().optional().nullable(),
  rawTranscription: z.url().optional().nullable(),
  audio: z.url().optional().nullable(),
  chatMessages: z.url().optional().nullable()
})

export type BaasSignedArtifactUrls = z.infer<
  typeof baasSignedArtifactUrlsSchema
>

export const meetingBaasChatMessageSchema = z.object({
  message_id: z.string().trim().min(1),
  sender_name: z.string().trim().min(1),
  sender_id: z.number().int().nullish(),
  text: z.string(),
  timestamp: z.iso.datetime()
})

export type MeetingBaasChatMessage = z.infer<
  typeof meetingBaasChatMessageSchema
>

export const meetingBaasChatMessagesFileSchema = z.array(
  meetingBaasChatMessageSchema
)

export type MeetingBaasChatMessagesFile = z.infer<
  typeof meetingBaasChatMessagesFileSchema
>

// ============================================================================
// 6. MeetingBaas Webhooks
// ============================================================================

export const meetingBaasWebhookHeadersSchema = z.object({
  'svix-id': z.string().min(1),
  'svix-timestamp': z.string().min(1),
  'svix-signature': z.string().min(1)
})

export type MeetingBaasWebhookHeaders = z.infer<
  typeof meetingBaasWebhookHeadersSchema
>

export const meetingBaasWebhookExtraSchema = z
  .object({
    meetingId: z.string().optional()
  })
  .loose()
  .nullable()
  .optional()

export type MeetingBaasWebhookExtra = z.infer<
  typeof meetingBaasWebhookExtraSchema
>

export const meetingBaasParticipantSchema = z.object({
  name: z.string(),
  id: z.number().nullable(),
  display_name: z.string().optional(),
  profile_picture: z.string().optional()
})

export type MeetingBaasParticipant = z.infer<
  typeof meetingBaasParticipantSchema
>

export const meetingBaasStatusChangeWebhookSchema = z.object({
  event: z.literal('bot.status_change'),
  data: z.object({
    bot_id: z.string(),
    status: z.object({
      code: z.string(),
      created_at: z.string().optional(),
      start_time: z.number().optional()
    })
  }),
  extra: meetingBaasWebhookExtraSchema
})

export type MeetingBaasStatusChangeWebhook = z.infer<
  typeof meetingBaasStatusChangeWebhookSchema
>

export const meetingBaasCompletedWebhookSchema = z.object({
  event: z.literal('bot.completed'),
  data: z
    .object({
      bot_id: z.string(),
      video: z.url().nullish(),
      transcription: z.url().nullish(),
      raw_transcription: z.url().nullish(),
      audio: z.url().nullish(),
      chat_messages: z.url().nullish(),
      participants: z.array(meetingBaasParticipantSchema).optional(),
      joined_at: z.string().nullable().optional(),
      data_deleted: z.boolean().optional()
    })
    .loose(),
  extra: meetingBaasWebhookExtraSchema
})

export type MeetingBaasCompletedWebhook = z.infer<
  typeof meetingBaasCompletedWebhookSchema
>

export const meetingBaasFailedWebhookSchema = z.object({
  event: z.literal('bot.failed'),
  data: z.object({
    bot_id: z.string(),
    error_code: z.string().optional(),
    error_message: z.string().optional()
  }),
  extra: meetingBaasWebhookExtraSchema
})

export type MeetingBaasFailedWebhook = z.infer<
  typeof meetingBaasFailedWebhookSchema
>

export const meetingBaasWebhookEventSchema = z.discriminatedUnion('event', [
  meetingBaasStatusChangeWebhookSchema,
  meetingBaasCompletedWebhookSchema,
  meetingBaasFailedWebhookSchema
])

export type MeetingBaasWebhookEvent = z.infer<
  typeof meetingBaasWebhookEventSchema
>
