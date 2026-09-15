import type { GetCalendarStatusResponse } from '@repo/api-contract/v1/calendar'
import {
  type UseQueryOptions,
  queryOptions,
  useQuery
} from '@tanstack/react-query'

import { getCalendarStatus } from '#src/v1/calendar/index'

type UseCalendarStatusOptions = Omit<
  UseQueryOptions<GetCalendarStatusResponse>,
  'queryKey' | 'queryFn'
>

const calendarQueryKeys = {
  all: ['calendar'] as const,
  status: () => [...calendarQueryKeys.all, 'status'] as const
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

export { calendarQueryKeys, calendarStatusQueryOptions, useCalendarStatusQuery }
