import { env } from '#src/env'

function isDemoUserEmail(email: string | null | undefined): boolean {
  if (!email || !env.DEMO_USER_EMAIL) {
    return false
  }
  return email.trim().toLowerCase() === env.DEMO_USER_EMAIL.trim().toLowerCase()
}

export { isDemoUserEmail }
