import type {
  GetCalendarStatusResponse,
  PostCalendarSyncResponse
} from '@repo/api-contract/v1/calendar'
import {
  type UseMutationOptions,
  type UseQueryOptions,
  queryOptions,
  useMutation,
  useQuery
} from '@tanstack/react-query'

import { getCalendarStatus, postCalendarSync } from '#src/v1/calendar/index'

type UseCalendarStatusOptions = Omit<
  UseQueryOptions<GetCalendarStatusResponse>,
  'queryKey' | 'queryFn'
>

const calendarQueryKeys = {
  all: ['calendar'] as const,
  status: () => [...calendarQueryKeys.all, 'status'] as const,
  sync: () => [...calendarQueryKeys.all, 'sync'] as const
} as const

function calendarStatusQueryOptions(options?: UseCalendarStatusOptions) {
  return queryOptions({
    queryKey: calendarQueryKeys.status(),
    queryFn: getCalendarStatus,
    staleTime: 15_000,
    ...options
  })
}

function useCalendarStatusQuery(options?: UseCalendarStatusOptions) {
  return useQuery(calendarStatusQueryOptions(options))
}

type UseCalendarSyncMutationOptions = Omit<
  UseMutationOptions<PostCalendarSyncResponse, Error, void>,
  'mutationFn'
>

function useCalendarSyncMutation(options?: UseCalendarSyncMutationOptions) {
  return useMutation({
    mutationKey: calendarQueryKeys.sync(),
    mutationFn: () => postCalendarSync(),
    ...options
  })
}

export {
  calendarQueryKeys,
  calendarStatusQueryOptions,
  useCalendarStatusQuery,
  useCalendarSyncMutation
}
