import {
  usersQueryOptions,
  useUsersQuery
} from '@repo/api-client/v1/users/hooks'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(usersQueryOptions()),
  component: RouteComponent
})

function RouteComponent() {
  const { data, isError } = useUsersQuery()

  if (isError || !data?.success) {
    return <h1>Something went wrong!</h1>
  }

  return (
    <div>
      <h1>Users</h1>
      {data.data.map((user) => (
        <p key={user.email}>
          {user.name} | {user.email}
        </p>
      ))}
    </div>
  )
}
