import { z } from 'zod/v4'

import { _createResponseApiZod } from '#src/utils'

import {
  getMeetingTranscriptResponseSchema,
  meetingActionItemSchema,
  meetingHighlightSchema,
  meetingParticipantSchema,
  meetingRecordingPlaybackSchema
} from './meeting-playback.js'

const meetingShareDetailSchema = z.object({
  title: z.string(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  summary: z.string().nullable(),
  recordingDurationSec: z.number().int().min(0).nullable(),
  recordingPlayback: meetingRecordingPlaybackSchema.nullable(),
  highlights: z.array(meetingHighlightSchema),
  actionItems: z.array(meetingActionItemSchema),
  participants: z.array(meetingParticipantSchema)
})

const getMeetingShareDetailResponseSchema = _createResponseApiZod(
  meetingShareDetailSchema
)

const getMeetingShareTranscriptResponseSchema =
  getMeetingTranscriptResponseSchema

const postMeetingShareEnableResponseSchema = _createResponseApiZod(
  z.object({
    shareSlug: z.string()
  })
)

export type GetMeetingShareDetailResponse = z.infer<
  typeof getMeetingShareDetailResponseSchema
>
export type GetMeetingShareDetailSuccessResponse = Extract<
  GetMeetingShareDetailResponse,
  { success: true }
>
export type MeetingShareDetail = z.infer<typeof meetingShareDetailSchema>
export type GetMeetingShareTranscriptResponse = z.infer<
  typeof getMeetingShareTranscriptResponseSchema
>
export type GetMeetingShareTranscriptSuccessResponse = Extract<
  GetMeetingShareTranscriptResponse,
  { success: true }
>
export type PostMeetingShareEnableResponse = z.infer<
  typeof postMeetingShareEnableResponseSchema
>
export type PostMeetingShareEnableSuccessResponse = Extract<
  PostMeetingShareEnableResponse,
  { success: true }
>

export {
  getMeetingShareDetailResponseSchema,
  getMeetingShareTranscriptResponseSchema,
  meetingShareDetailSchema,
  postMeetingShareEnableResponseSchema
}
