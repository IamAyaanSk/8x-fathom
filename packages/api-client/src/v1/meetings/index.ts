import {
  type PatchMeetingActionItemRequestBody,
  type PatchMeetingActionItemsRequestParams,
  patchMeetingActionItemResponseSchema
} from '@repo/api-contract/v1/meeting/action-items'
import {
  type PatchMeetingHighlightRequestBody,
  type PatchMeetingHighlightRequestParams,
  patchMeetingHighlightResponseSchema,
  type PostMeetingHighlightRequestBody,
  type PostMeetingHighlightRequestParams,
  postMeetingHighlightResponseSchema
} from '@repo/api-contract/v1/meeting/highlights'
import {
  getMeetingsCompletedResponseSchema,
  getMeetingsUpcomingResponseSchema,
  postMeetingCaptureResponseSchema,
  type PostMeetingCaptureRequestParams
} from '@repo/api-contract/v1/meeting/index'
import {
  getMeetingDetailResponseSchema,
  getMeetingTranscriptResponseSchema
} from '@repo/api-contract/v1/meeting/playback'
import {
  type PutMeetingScratchpadEntryRequestBody,
  type PutMeetingScratchpadEntryRequestParams,
  putMeetingScratchpadEntryResponseSchema
} from '@repo/api-contract/v1/meeting/scratchpad'
import {
  postMeetingSummaryGenerateResponseSchema,
  type PostMeetingSummaryGenerateRequestBody,
  type PostMeetingSummaryGenerateRequestParams
} from '@repo/api-contract/v1/meeting/summary'
import type {
  MeetingDetail,
  MeetingHighlight,
  MeetingListItem,
  MeetingPlaybackMedia,
  MeetingScratchpadEntry
} from '@repo/shared-validations/meeting'

import { _getApiClient, type _HttpRequestOptions } from '#src/index'

export type {
  MeetingDetail,
  MeetingHighlight,
  MeetingListItem,
  MeetingPlaybackMedia,
  MeetingScratchpadEntry,
  PatchMeetingActionItemRequestBody,
  PatchMeetingActionItemsRequestParams,
  PatchMeetingHighlightRequestBody,
  PatchMeetingHighlightRequestParams,
  PostMeetingCaptureRequestParams,
  PostMeetingHighlightRequestBody,
  PostMeetingHighlightRequestParams,
  PostMeetingSummaryGenerateRequestBody,
  PostMeetingSummaryGenerateRequestParams,
  PutMeetingScratchpadEntryRequestBody,
  PutMeetingScratchpadEntryRequestParams
}

// Backward-compatibility aliases
export type PatchMeetingHighlightBody = PatchMeetingHighlightRequestBody
export type PostMeetingHighlightBody = PostMeetingHighlightRequestBody
export type PostMeetingSummaryGenerateBody =
  PostMeetingSummaryGenerateRequestBody
export type PutMeetingScratchpadEntryBody = PutMeetingScratchpadEntryRequestBody

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
  body: PostMeetingHighlightRequestBody,
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
  body: PatchMeetingHighlightRequestBody,
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
  body: PutMeetingScratchpadEntryRequestBody,
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
