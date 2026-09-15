import { z } from 'zod/v4'

import { _createResponseApiZod } from '#src/utils'

const meetingListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  meetingUrl: z.url(),
  htmlLink: z.url().nullable()
})

const getMeetingsUpcomingResponseSchema = _createResponseApiZod(
  z.object({
    meetings: z.array(meetingListItemSchema)
  })
)

export type GetMeetingsUpcomingResponse = z.infer<
  typeof getMeetingsUpcomingResponseSchema
>
export type GetMeetingsUpcomingSuccessResponse = Extract<
  GetMeetingsUpcomingResponse,
  { success: true }
>
export type MeetingListItem = z.infer<typeof meetingListItemSchema>

export { getMeetingsUpcomingResponseSchema, meetingListItemSchema }
