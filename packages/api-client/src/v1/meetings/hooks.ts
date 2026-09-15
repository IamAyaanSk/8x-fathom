import { isActiveMeetingBotUiPhase } from '@repo/api-contract/baas-bot-status'
import type {
  GetMeetingsCompletedResponse,
  GetMeetingsUpcomingResponse,
  PostMeetingCaptureResponse
} from '@repo/api-contract/v1/meetings'
import {
  type UseMutationOptions,
  type UseQueryOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'

import {
  getMeetingsCompleted,
  getMeetingsUpcoming,
  postMeetingCapture
} from '#src/v1/meetings/index'

type UseMeetingsUpcomingOptions = Omit<
  UseQueryOptions<GetMeetingsUpcomingResponse>,
  'queryKey' | 'queryFn'
>

const MEETINGS_UPCOMING_CACHE_MS = 30_000
const MEETINGS_UPCOMING_ACTIVE_REFETCH_MS = 10_000

const meetingsQueryKeys = {
  all: ['meetings'] as const,
  upcoming: () => [...meetingsQueryKeys.all, 'upcoming'] as const,
  completed: () => [...meetingsQueryKeys.all, 'completed'] as const,
  capture: () => [...meetingsQueryKeys.all, 'capture'] as const
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

export {
  MEETINGS_UPCOMING_CACHE_MS,
  meetingsCompletedQueryOptions,
  meetingsQueryKeys,
  meetingsUpcomingQueryOptions,
  useMeetingsCompletedQuery,
  useMeetingsUpcomingQuery,
  usePostMeetingCaptureMutation
}
