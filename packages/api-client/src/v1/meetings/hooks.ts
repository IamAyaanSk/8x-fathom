import { isActiveMeetingBotUiPhase } from '@repo/api-contract/baas-bot-status'
import type {
  GetMeetingDetailResponse,
  GetMeetingTranscriptResponse,
  PatchMeetingActionItemResponse,
  PatchMeetingHighlightResponse,
  PatchMeetingHighlightSuccessResponse,
  PostMeetingHighlightBody,
  PostMeetingHighlightResponse,
  PutMeetingScratchpadEntryBody,
  PutMeetingScratchpadEntryResponse,
  PutMeetingScratchpadEntrySuccessResponse
} from '@repo/api-contract/v1/meeting-playback'
import type {
  GetMeetingsCompletedResponse,
  GetMeetingsUpcomingResponse,
  PostMeetingCaptureResponse,
  PostMeetingSummaryGenerateBody,
  PostMeetingSummaryGenerateResponse
} from '@repo/api-contract/v1/meetings'
import {
  type QueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'

import {
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
} from '#src/v1/meetings/index'

type UseMeetingsUpcomingOptions = Omit<
  UseQueryOptions<GetMeetingsUpcomingResponse>,
  'queryKey' | 'queryFn'
>

const MEETINGS_UPCOMING_CACHE_MS = 30_000
const MEETINGS_UPCOMING_ACTIVE_REFETCH_MS = 10_000

const MEETING_TRANSCRIPT_STALE_MS = 24 * 60 * 60 * 1000
const MEETING_DETAIL_STALE_MS = 30_000
const MEETING_PLAYBACK_URL_REFRESH_MS = 50 * 60 * 1000

const meetingsQueryKeys = {
  all: ['meetings'] as const,
  upcoming: () => [...meetingsQueryKeys.all, 'upcoming'] as const,
  completed: () => [...meetingsQueryKeys.all, 'completed'] as const,
  detail: (meetingId: string) =>
    [...meetingsQueryKeys.all, 'detail', meetingId] as const,
  transcript: (meetingId: string) =>
    [...meetingsQueryKeys.all, 'transcript', meetingId] as const,
  capture: () => [...meetingsQueryKeys.all, 'capture'] as const,
  summaryGenerate: () =>
    [...meetingsQueryKeys.all, 'summary-generate'] as const,
  actionItemPatch: () =>
    [...meetingsQueryKeys.all, 'action-item-patch'] as const,
  highlightCreate: () =>
    [...meetingsQueryKeys.all, 'highlight-create'] as const,
  highlightPatch: () => [...meetingsQueryKeys.all, 'highlight-patch'] as const,
  scratchpadPut: () => [...meetingsQueryKeys.all, 'scratchpad-put'] as const
} as const

function _upcomingRefetchInterval(query: {
  state: { data: GetMeetingsUpcomingResponse | undefined }
}) {
  const data = query.state.data
  if (data?.success !== true) {
    return MEETINGS_UPCOMING_CACHE_MS
  }
  const hasActiveBot = data.data.meetings.some((meeting) =>
    isActiveMeetingBotUiPhase(meeting.uiPhase)
  )
  return hasActiveBot
    ? MEETINGS_UPCOMING_ACTIVE_REFETCH_MS
    : MEETINGS_UPCOMING_CACHE_MS
}

function meetingsUpcomingQueryOptions(options?: UseMeetingsUpcomingOptions) {
  return queryOptions({
    queryKey: meetingsQueryKeys.upcoming(),
    queryFn: getMeetingsUpcoming,
    staleTime: MEETINGS_UPCOMING_CACHE_MS,
    gcTime: MEETINGS_UPCOMING_CACHE_MS,
    refetchInterval: _upcomingRefetchInterval,
    ...options
  })
}

function useMeetingsUpcomingQuery(options?: UseMeetingsUpcomingOptions) {
  return useQuery(meetingsUpcomingQueryOptions(options))
}

type UseMeetingsCompletedOptions = Omit<
  UseQueryOptions<GetMeetingsCompletedResponse>,
  'queryKey' | 'queryFn'
>

function _completedRefetchInterval(query: {
  state: { data: GetMeetingsCompletedResponse | undefined }
}) {
  const data = query.state.data
  if (data?.success !== true) {
    return MEETINGS_UPCOMING_CACHE_MS
  }
  const hasProcessing = data.data.meetings.some(
    (meeting) =>
      meeting.uiPhase === 'call_ended_processing' ||
      meeting.uiPhase === 'transcribing' ||
      isActiveMeetingBotUiPhase(meeting.uiPhase)
  )
  return hasProcessing
    ? MEETINGS_UPCOMING_ACTIVE_REFETCH_MS
    : MEETINGS_UPCOMING_CACHE_MS
}

function meetingsCompletedQueryOptions(options?: UseMeetingsCompletedOptions) {
  return queryOptions({
    queryKey: meetingsQueryKeys.completed(),
    queryFn: getMeetingsCompleted,
    staleTime: MEETINGS_UPCOMING_CACHE_MS,
    gcTime: MEETINGS_UPCOMING_CACHE_MS,
    refetchInterval: _completedRefetchInterval,
    ...options
  })
}

function useMeetingsCompletedQuery(options?: UseMeetingsCompletedOptions) {
  return useQuery(meetingsCompletedQueryOptions(options))
}

type UseMeetingDetailOptions = Omit<
  UseQueryOptions<GetMeetingDetailResponse>,
  'queryKey' | 'queryFn'
>

function _meetingDetailRefetchInterval(query: {
  state: { data: GetMeetingDetailResponse | undefined }
}) {
  const data = query.state.data
  if (data?.success !== true) {
    return MEETING_DETAIL_STALE_MS
  }
  if (data.data.recordingPlayback) {
    return MEETING_PLAYBACK_URL_REFRESH_MS
  }
  if (data.data.uiPhase === 'in_call_recording') {
    return MEETINGS_UPCOMING_ACTIVE_REFETCH_MS
  }
  if (
    data.data.uiPhase === 'call_ended_processing' ||
    data.data.uiPhase === 'transcribing'
  ) {
    return MEETINGS_UPCOMING_ACTIVE_REFETCH_MS
  }
  return MEETING_DETAIL_STALE_MS
}

function meetingDetailQueryOptions(
  meetingId: string,
  options?: UseMeetingDetailOptions
) {
  return queryOptions({
    queryKey: meetingsQueryKeys.detail(meetingId),
    queryFn: () => getMeetingDetail(meetingId),
    staleTime: MEETING_DETAIL_STALE_MS,
    gcTime: MEETING_TRANSCRIPT_STALE_MS,
    refetchInterval: _meetingDetailRefetchInterval,
    ...options
  })
}

function useMeetingDetailQuery(
  meetingId: string,
  options?: UseMeetingDetailOptions
) {
  return useQuery(meetingDetailQueryOptions(meetingId, options))
}

type UseMeetingTranscriptOptions = Omit<
  UseQueryOptions<GetMeetingTranscriptResponse>,
  'queryKey' | 'queryFn'
>

function meetingTranscriptQueryOptions(
  meetingId: string,
  options?: UseMeetingTranscriptOptions
) {
  return queryOptions({
    queryKey: meetingsQueryKeys.transcript(meetingId),
    queryFn: () => getMeetingTranscript(meetingId),
    staleTime: MEETING_TRANSCRIPT_STALE_MS,
    gcTime: MEETING_TRANSCRIPT_STALE_MS,
    ...options
  })
}

function useMeetingTranscriptQuery(
  meetingId: string,
  options?: UseMeetingTranscriptOptions
) {
  return useQuery(meetingTranscriptQueryOptions(meetingId, options))
}

type UsePostMeetingCaptureMutationOptions = Omit<
  UseMutationOptions<PostMeetingCaptureResponse, Error, string>,
  'mutationFn'
>

function usePostMeetingCaptureMutation(
  options?: UsePostMeetingCaptureMutationOptions
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: meetingsQueryKeys.capture(),
    mutationFn: (meetingId) => postMeetingCapture(meetingId),
    ...options,
    onSuccess: async (data, meetingId, onMutateResult, context) => {
      await queryClient.invalidateQueries({ queryKey: meetingsQueryKeys.all })
      await options?.onSuccess?.(data, meetingId, onMutateResult, context)
    }
  })
}

type PostMeetingSummaryGenerateVariables = {
  meetingId: string
  body: PostMeetingSummaryGenerateBody
}

type UsePostMeetingSummaryGenerateMutationOptions = Omit<
  UseMutationOptions<
    PostMeetingSummaryGenerateResponse,
    Error,
    PostMeetingSummaryGenerateVariables
  >,
  'mutationFn'
>

type PatchMeetingActionItemVariables = {
  meetingId: string
  actionItemId: string
  completed: boolean
}

type PatchMeetingActionItemMutationContext = {
  previousDetail: GetMeetingDetailResponse | undefined
}

type UsePatchMeetingActionItemMutationOptions = Omit<
  UseMutationOptions<
    PatchMeetingActionItemResponse,
    Error,
    PatchMeetingActionItemVariables,
    PatchMeetingActionItemMutationContext
  >,
  'mutationFn'
>

function _optimisticMeetingDetailActionItem(
  detail: Extract<GetMeetingDetailResponse, { success: true }>,
  actionItemId: string,
  completed: boolean
): Extract<GetMeetingDetailResponse, { success: true }> {
  return {
    ...detail,
    data: {
      ...detail.data,
      actionItems: detail.data.actionItems.map((item) =>
        item.id === actionItemId ? { ...item, completed } : item
      )
    }
  }
}

function _mergeMeetingDetailHighlight(
  detail: Extract<GetMeetingDetailResponse, { success: true }>,
  highlight: PatchMeetingHighlightSuccessResponse['data']
): Extract<GetMeetingDetailResponse, { success: true }> {
  const hasExisting = detail.data.highlights.some(
    (item) => item.id === highlight.id
  )
  const highlights = hasExisting
    ? detail.data.highlights.map((item) =>
        item.id === highlight.id ? highlight : item
      )
    : [...detail.data.highlights, highlight]

  return {
    ...detail,
    data: {
      ...detail.data,
      highlights
    }
  }
}

function _mergeMeetingDetailScratchpadEntry(
  detail: Extract<GetMeetingDetailResponse, { success: true }>,
  entry: PutMeetingScratchpadEntrySuccessResponse['data']
): Extract<GetMeetingDetailResponse, { success: true }> {
  const byTimestampIndex = detail.data.scratchpadEntries.findIndex(
    (item) => item.timestampSec === entry.timestampSec
  )
  const byIdIndex = detail.data.scratchpadEntries.findIndex(
    (item) => item.id === entry.id
  )
  const existingIndex =
    byTimestampIndex >= 0 ? byTimestampIndex : byIdIndex

  const scratchpadEntries =
    existingIndex >= 0
      ? detail.data.scratchpadEntries.map((item, index) =>
          index === existingIndex ? entry : item
        )
      : [...detail.data.scratchpadEntries, entry].sort(
          (left, right) => left.timestampSec - right.timestampSec
        )

  return {
    ...detail,
    data: {
      ...detail.data,
      scratchpadEntries
    }
  }
}

function _patchMeetingDetailCache(
  queryClient: QueryClient,
  meetingId: string,
  updater: (
    detail: Extract<GetMeetingDetailResponse, { success: true }>
  ) => Extract<GetMeetingDetailResponse, { success: true }>
) {
  const detailKey = meetingsQueryKeys.detail(meetingId)
  const previous = queryClient.getQueryData<GetMeetingDetailResponse>(detailKey)
  if (previous?.success !== true) {
    return
  }
  queryClient.setQueryData(detailKey, updater(previous))
}

function usePatchMeetingActionItemMutation(
  options?: UsePatchMeetingActionItemMutationOptions
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: meetingsQueryKeys.actionItemPatch(),
    mutationFn: ({ meetingId, actionItemId, completed }) =>
      patchMeetingActionItem(meetingId, actionItemId, { completed }),
    ...options,
    onMutate: async (variables, context) => {
      const detailKey = meetingsQueryKeys.detail(variables.meetingId)
      await queryClient.cancelQueries({ queryKey: detailKey })

      const previousDetail =
        queryClient.getQueryData<GetMeetingDetailResponse>(detailKey)

      if (previousDetail?.success === true) {
        queryClient.setQueryData(
          detailKey,
          _optimisticMeetingDetailActionItem(
            previousDetail,
            variables.actionItemId,
            variables.completed
          )
        )
      }

      const onMutateResult = await options?.onMutate?.(variables, context)
      return { previousDetail, ...(onMutateResult ?? {}) }
    },
    onError: async (error, variables, onMutateResult, context) => {
      if (onMutateResult?.previousDetail) {
        queryClient.setQueryData(
          meetingsQueryKeys.detail(variables.meetingId),
          onMutateResult.previousDetail
        )
      }
      await options?.onError?.(error, variables, onMutateResult, context)
    },
    onSettled: async (data, error, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: meetingsQueryKeys.detail(variables.meetingId)
      })
      await options?.onSettled?.(
        data,
        error,
        variables,
        onMutateResult,
        context
      )
    }
  })
}

type PostMeetingHighlightVariables = {
  meetingId: string
  body: PostMeetingHighlightBody
}

type UsePostMeetingHighlightMutationOptions = Omit<
  UseMutationOptions<
    PostMeetingHighlightResponse,
    Error,
    PostMeetingHighlightVariables
  >,
  'mutationFn'
>

function usePostMeetingHighlightMutation(
  options?: UsePostMeetingHighlightMutationOptions
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: meetingsQueryKeys.highlightCreate(),
    mutationFn: ({ meetingId, body }) => postMeetingHighlight(meetingId, body),
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      if (data.success === true) {
        _patchMeetingDetailCache(queryClient, variables.meetingId, (detail) =>
          _mergeMeetingDetailHighlight(detail, data.data)
        )
      }
      await options?.onSuccess?.(data, variables, onMutateResult, context)
    }
  })
}

type PatchMeetingHighlightVariables = {
  meetingId: string
  highlightId: string
  endTimestampSec?: number
  note?: string | null
}

type UsePatchMeetingHighlightMutationOptions = Omit<
  UseMutationOptions<
    PatchMeetingHighlightResponse,
    Error,
    PatchMeetingHighlightVariables
  >,
  'mutationFn'
>

function usePatchMeetingHighlightMutation(
  options?: UsePatchMeetingHighlightMutationOptions
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: meetingsQueryKeys.highlightPatch(),
    mutationFn: ({ meetingId, highlightId, endTimestampSec, note }) =>
      patchMeetingHighlight(meetingId, highlightId, {
        ...(endTimestampSec !== undefined ? { endTimestampSec } : {}),
        ...(note !== undefined ? { note } : {})
      }),
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      if (data.success === true) {
        _patchMeetingDetailCache(queryClient, variables.meetingId, (detail) =>
          _mergeMeetingDetailHighlight(detail, data.data)
        )
      }
      await options?.onSuccess?.(data, variables, onMutateResult, context)
    }
  })
}

type PutMeetingScratchpadEntryVariables = {
  meetingId: string
  body: PutMeetingScratchpadEntryBody
}

type UsePutMeetingScratchpadEntryMutationOptions = Omit<
  UseMutationOptions<
    PutMeetingScratchpadEntryResponse,
    Error,
    PutMeetingScratchpadEntryVariables
  >,
  'mutationFn'
>

function usePutMeetingScratchpadEntryMutation(
  options?: UsePutMeetingScratchpadEntryMutationOptions
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: meetingsQueryKeys.scratchpadPut(),
    mutationFn: ({ meetingId, body }) =>
      putMeetingScratchpadEntry(meetingId, body),
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      if (data.success === true) {
        _patchMeetingDetailCache(queryClient, variables.meetingId, (detail) =>
          _mergeMeetingDetailScratchpadEntry(detail, data.data)
        )
      }
      await options?.onSuccess?.(data, variables, onMutateResult, context)
    }
  })
}

function usePostMeetingSummaryGenerateMutation(
  options?: UsePostMeetingSummaryGenerateMutationOptions
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: meetingsQueryKeys.summaryGenerate(),
    mutationFn: ({ meetingId, body }) =>
      postMeetingSummaryGenerate(meetingId, body),
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({ queryKey: meetingsQueryKeys.all })
      await queryClient.invalidateQueries({
        queryKey: meetingsQueryKeys.detail(variables.meetingId)
      })
      await options?.onSuccess?.(data, variables, onMutateResult, context)
    }
  })
}

export {
  MEETING_DETAIL_STALE_MS,
  MEETING_TRANSCRIPT_STALE_MS,
  MEETINGS_UPCOMING_CACHE_MS,
  meetingDetailQueryOptions,
  meetingTranscriptQueryOptions,
  meetingsCompletedQueryOptions,
  meetingsQueryKeys,
  meetingsUpcomingQueryOptions,
  useMeetingDetailQuery,
  useMeetingTranscriptQuery,
  useMeetingsCompletedQuery,
  useMeetingsUpcomingQuery,
  usePatchMeetingActionItemMutation,
  usePatchMeetingHighlightMutation,
  usePostMeetingCaptureMutation,
  usePostMeetingHighlightMutation,
  usePostMeetingSummaryGenerateMutation,
  usePutMeetingScratchpadEntryMutation
}
