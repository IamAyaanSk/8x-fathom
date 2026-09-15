import type { GetMeetingsUpcomingResponse } from '@repo/api-contract/v1/meetings'
import { type UseQueryOptions, queryOptions, useQuery } from '@tanstack/react-query'

import { getMeetingsUpcoming } from '#src/v1/meetings/index'

type UseMeetingsUpcomingOptions = Omit<
  UseQueryOptions<GetMeetingsUpcomingResponse>,
  'queryKey' | 'queryFn'
>

const MEETINGS_UPCOMING_CACHE_MS = 30_000

const meetingsQueryKeys = {
  all: ['meetings'] as const,
  upcoming: () => [...meetingsQueryKeys.all, 'upcoming'] as const
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

export {
  MEETINGS_UPCOMING_CACHE_MS,
  meetingsQueryKeys,
  meetingsUpcomingQueryOptions,
  useMeetingsUpcomingQuery
}
