import { useUsersQuery } from '@repo/api-client/v1/users/hooks'
import { Link } from '@tanstack/react-router'

function UsersPage() {
  const { data, isError } = useUsersQuery()

  if (isError || !data?.success) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-muted-foreground">
          Could not load your account. Sign in again and retry.
        </p>
        <Link
          to="/login"
          className="text-primary text-sm underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Users</h1>
      {data.data.map((user) => (
        <p key={user.email}>
          {user.name} | {user.email}
        </p>
      ))}
    </div>
  )
}

export { UsersPage }
