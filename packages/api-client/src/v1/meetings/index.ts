import {
  getMeetingsCompletedResponseSchema,
  getMeetingsUpcomingResponseSchema,
  postMeetingCaptureResponseSchema,
  type MeetingListItem
} from '@repo/api-contract/v1/meetings'

import { _getApiClient, type _HttpRequestOptions } from '#src/index'

export type { MeetingListItem }

async function getMeetingsUpcoming(options: _HttpRequestOptions = {}) {
  const client = _getApiClient()
  const response = await client.get('/meetings/upcoming', options)
  return getMeetingsUpcomingResponseSchema.parse(response.data)
}

async function getMeetingsCompleted(options: _HttpRequestOptions = {}) {
  const client = _getApiClient()
  const response = await client.get('/meetings/completed', options)
  return getMeetingsCompletedResponseSchema.parse(response.data)
}

async function postMeetingCapture(
  meetingId: string,
  options: _HttpRequestOptions = {}
) {
  const client = _getApiClient()
  const response = await client.post(
    `/meetings/${meetingId}/capture`,
    undefined,
    options
  )
  return postMeetingCaptureResponseSchema.parse(response.data)
}

export { getMeetingsCompleted, getMeetingsUpcoming, postMeetingCapture }
