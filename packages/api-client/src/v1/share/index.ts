import type { MeetingShareDetail } from '@repo/api-contract/v1/meeting/index'
import {
  getMeetingShareDetailResponseSchema,
  getMeetingShareTranscriptResponseSchema,
  postMeetingShareEnableResponseSchema
} from '@repo/api-contract/v1/meeting/share'

import { _getApiClient, type _HttpRequestOptions } from '#src/index'

export type { MeetingShareDetail }

async function getMeetingShareDetail(
  shareSlug: string,
  options: _HttpRequestOptions = {}
) {
  const client = _getApiClient()
  const response = await client.get(`/share/${shareSlug}`, options)
  return getMeetingShareDetailResponseSchema.parse(response.data)
}

async function getMeetingShareTranscript(
  shareSlug: string,
  options: _HttpRequestOptions = {}
) {
  const client = _getApiClient()
  const response = await client.get(`/share/${shareSlug}/transcript`, options)
  return getMeetingShareTranscriptResponseSchema.parse(response.data)
}

async function postMeetingShareEnable(
  meetingId: string,
  options: _HttpRequestOptions = {}
) {
  const client = _getApiClient()
  const response = await client.post(
    `/meetings/${meetingId}/share`,
    undefined,
    options
  )
  return postMeetingShareEnableResponseSchema.parse(response.data)
}

export {
  getMeetingShareDetail,
  getMeetingShareTranscript,
  postMeetingShareEnable
}
