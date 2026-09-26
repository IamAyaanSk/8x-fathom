import { authClient } from '#lib/auth-client'
import { isDemoUser } from '#lib/demo'

function useIsDemoUser(): boolean {
  const { data: session } = authClient.useSession()
  return isDemoUser(session?.user?.email)
}

export { useIsDemoUser }
