import {
  getMeetingDetailResponseSchema,
  getMeetingTranscriptResponseSchema,
  patchMeetingHighlightResponseSchema,
  postMeetingHighlightResponseSchema,
  putMeetingScratchpadEntryResponseSchema,
  type MeetingDetail,
  type MeetingPlaybackMedia,
  type MeetingScratchpadEntry,
  type MeetingTranscriptData,
  type PatchMeetingHighlightBody,
  type PostMeetingHighlightBody,
  type PutMeetingScratchpadEntryBody
} from '@repo/api-contract/v1/meeting-playback'
import {
  type PatchMeetingActionItemRequestBody,
  type PatchMeetingActionItemsRequestParams,
  patchMeetingActionItemResponseSchema
} from '@repo/api-contract/v1/meeting/action-items'
import {
  getMeetingsCompletedResponseSchema,
  getMeetingsUpcomingResponseSchema,
  postMeetingCaptureResponseSchema,
  postMeetingSummaryGenerateResponseSchema,
  type MeetingListItem,
  type PostMeetingSummaryGenerateBody
} from '@repo/api-contract/v1/meetings'

import { _getApiClient, type _HttpRequestOptions } from '#src/index'

export type {
  MeetingDetail,
  MeetingListItem,
  MeetingPlaybackMedia,
  MeetingScratchpadEntry,
  MeetingTranscriptData,
  PatchMeetingActionItemRequestBody,
  PatchMeetingActionItemsRequestParams,
  PatchMeetingHighlightBody,
  PostMeetingHighlightBody,
  PostMeetingSummaryGenerateBody,
  PutMeetingScratchpadEntryBody
}

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

async function getMeetingDetail(
  meetingId: string,
  options: _HttpRequestOptions = {}
) {
  const client = _getApiClient()
  const response = await client.get(`/meetings/${meetingId}`, options)
  return getMeetingDetailResponseSchema.parse(response.data)
}

async function getMeetingTranscript(
  meetingId: string,
  options: _HttpRequestOptions = {}
) {
  const client = _getApiClient()
  const response = await client.get(
    `/meetings/${meetingId}/transcript`,
    options
  )
  return getMeetingTranscriptResponseSchema.parse(response.data)
}

async function patchMeetingActionItem(
  meetingId: string,
  actionItemId: string,
  body: PatchMeetingActionItemRequestBody,
  options: _HttpRequestOptions = {}
) {
  const client = _getApiClient()
  const response = await client.patch(
    `/meetings/${meetingId}/action-items/${actionItemId}`,
    body,
    options
  )
  return patchMeetingActionItemResponseSchema.parse(response.data)
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

async function postMeetingHighlight(
  meetingId: string,
  body: PostMeetingHighlightBody,
  options: _HttpRequestOptions = {}
) {
  const client = _getApiClient()
  const response = await client.post(
    `/meetings/${meetingId}/highlights`,
    body,
    options
  )
  return postMeetingHighlightResponseSchema.parse(response.data)
}

async function patchMeetingHighlight(
  meetingId: string,
  highlightId: string,
  body: PatchMeetingHighlightBody,
  options: _HttpRequestOptions = {}
) {
  const client = _getApiClient()
  const response = await client.patch(
    `/meetings/${meetingId}/highlights/${highlightId}`,
    body,
    options
  )
  return patchMeetingHighlightResponseSchema.parse(response.data)
}

async function putMeetingScratchpadEntry(
  meetingId: string,
  body: PutMeetingScratchpadEntryBody,
  options: _HttpRequestOptions = {}
) {
  const client = _getApiClient()
  const response = await client.put(
    `/meetings/${meetingId}/scratchpad`,
    body,
    options
  )
  return putMeetingScratchpadEntryResponseSchema.parse(response.data)
}

async function postMeetingSummaryGenerate(
  meetingId: string,
  body: PostMeetingSummaryGenerateBody,
  options: _HttpRequestOptions = {}
) {
  const client = _getApiClient()
  const response = await client.post(
    `/meetings/${meetingId}/summary/generate`,
    body,
    {
      timeout: 180_000,
      ...options
    }
  )
  return postMeetingSummaryGenerateResponseSchema.parse(response.data)
}

export {
  getMeetingDetail,
  getMeetingTranscript,
  getMeetingsCompleted,
  getMeetingsUpcoming,
  patchMeetingActionItem,
  patchMeetingHighlight,
  postMeetingCapture,
  postMeetingHighlight,
  postMeetingSummaryGenerate,
  putMeetingScratchpadEntry
}
