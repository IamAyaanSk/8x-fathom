import type { GetUsersResponse } from '@repo/api-contract/v1/users'
import {
  type UseQueryOptions,
  useQuery,
  queryOptions
} from '@tanstack/react-query'

import { getUsers } from '#src/v1/users/index'

type UseUsersOptions = Omit<
  UseQueryOptions<GetUsersResponse>,
  'queryKey' | 'queryFn'
>

const userQueryKeys = {
  all: ['users'] as const
} as const

function usersQueryOptions(options?: UseUsersOptions) {
  return queryOptions({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 15_000,
    ...options
  })
}

function useUsersQuery(options?: UseUsersOptions) {
  return useQuery(usersQueryOptions(options))
}

export { useUsersQuery, userQueryKeys, usersQueryOptions }
