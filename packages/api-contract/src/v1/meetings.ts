import { z } from 'zod/v4'

import { BAAS_BOT_STATUSES, MEETING_BOT_UI_PHASES } from '#src/baas-bot-status'
import { _createResponseApiZod } from '#src/utils'

const baasBotStatusSchema = z.enum(BAAS_BOT_STATUSES)
const meetingBotUiPhaseSchema = z.enum(MEETING_BOT_UI_PHASES)

const meetingListItemSchema = z.object({
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

const meetingsListDataSchema = z.object({
  meetings: z.array(meetingListItemSchema)
})

const getMeetingsUpcomingResponseSchema =
  _createResponseApiZod(meetingsListDataSchema)

const getMeetingsCompletedResponseSchema =
  _createResponseApiZod(meetingsListDataSchema)

const postMeetingBotDispatchDataSchema = z.object({
  meetingId: z.string(),
  baasBotId: z.string(),
  baasStatus: baasBotStatusSchema.nullable(),
  uiPhase: meetingBotUiPhaseSchema
})

const postMeetingCaptureResponseSchema = _createResponseApiZod(
  postMeetingBotDispatchDataSchema
)

export type GetMeetingsUpcomingResponse = z.infer<
  typeof getMeetingsUpcomingResponseSchema
>
export type GetMeetingsUpcomingSuccessResponse = Extract<
  GetMeetingsUpcomingResponse,
  { success: true }
>
export type GetMeetingsCompletedResponse = z.infer<
  typeof getMeetingsCompletedResponseSchema
>
export type GetMeetingsCompletedSuccessResponse = Extract<
  GetMeetingsCompletedResponse,
  { success: true }
>
export type MeetingListItem = z.infer<typeof meetingListItemSchema>
export type PostMeetingCaptureResponse = z.infer<
  typeof postMeetingCaptureResponseSchema
>
export type PostMeetingCaptureSuccessResponse = Extract<
  PostMeetingCaptureResponse,
  { success: true }
>

export {
  baasBotStatusSchema,
  getMeetingsCompletedResponseSchema,
  getMeetingsUpcomingResponseSchema,
  meetingBotUiPhaseSchema,
  meetingListItemSchema,
  meetingsListDataSchema,
  postMeetingCaptureResponseSchema
}
