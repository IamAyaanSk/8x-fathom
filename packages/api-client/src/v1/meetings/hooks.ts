import { isActiveMeetingBotUiPhase } from '@repo/api-contract/baas-bot-status'
import type {
  GetMeetingsUpcomingResponse,
  PostMeetingCaptureResponse,
  PostMeetingRetryBotResponse
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
  getMeetingsUpcoming,
  postMeetingCapture,
  postMeetingRetryBot
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
  capture: () => [...meetingsQueryKeys.all, 'capture'] as const,
  retryBot: () => [...meetingsQueryKeys.all, 'retry-bot'] as const
} as const

function _upcomingRefetchInterval(
  query: { state: { data: GetMeetingsUpcomingResponse | undefined } }
) {
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
      await queryClient.invalidateQueries({
        queryKey: meetingsQueryKeys.upcoming()
      })
      await options?.onSuccess?.(data, meetingId, onMutateResult, context)
    }
  })
}

type UsePostMeetingRetryBotMutationOptions = Omit<
  UseMutationOptions<PostMeetingRetryBotResponse, Error, string>,
  'mutationFn'
>

function usePostMeetingRetryBotMutation(
  options?: UsePostMeetingRetryBotMutationOptions
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: meetingsQueryKeys.retryBot(),
    mutationFn: (meetingId) => postMeetingRetryBot(meetingId),
    ...options,
    onSuccess: async (data, meetingId, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: meetingsQueryKeys.upcoming()
      })
      await options?.onSuccess?.(data, meetingId, onMutateResult, context)
    }
  })
}

export {
  MEETINGS_UPCOMING_CACHE_MS,
  meetingsQueryKeys,
  meetingsUpcomingQueryOptions,
  useMeetingsUpcomingQuery,
  usePostMeetingCaptureMutation,
  usePostMeetingRetryBotMutation
}
