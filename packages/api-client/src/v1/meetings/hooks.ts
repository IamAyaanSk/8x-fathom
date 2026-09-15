import type {
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

import { getMeetingsUpcoming, postMeetingCapture } from '#src/v1/meetings/index'

type UseMeetingsUpcomingOptions = Omit<
  UseQueryOptions<GetMeetingsUpcomingResponse>,
  'queryKey' | 'queryFn'
>

const MEETINGS_UPCOMING_CACHE_MS = 30_000

const meetingsQueryKeys = {
  all: ['meetings'] as const,
  upcoming: () => [...meetingsQueryKeys.all, 'upcoming'] as const,
  capture: () => [...meetingsQueryKeys.all, 'capture'] as const
} as const

function meetingsUpcomingQueryOptions(options?: UseMeetingsUpcomingOptions) {
  return queryOptions({
    queryKey: meetingsQueryKeys.upcoming(),
    queryFn: getMeetingsUpcoming,
    staleTime: MEETINGS_UPCOMING_CACHE_MS,
    gcTime: MEETINGS_UPCOMING_CACHE_MS,
    refetchInterval: MEETINGS_UPCOMING_CACHE_MS,
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

export {
  MEETINGS_UPCOMING_CACHE_MS,
  meetingsQueryKeys,
  meetingsUpcomingQueryOptions,
  useMeetingsUpcomingQuery,
  usePostMeetingCaptureMutation
}
