const DEMO_USER_EMAIL = (
  (import.meta.env.VITE_DEMO_USER_EMAIL as string | undefined) ||
  'demo@8xfathom.local'
)
  .trim()
  .toLowerCase()

function isDemoUser(email: string | null | undefined): boolean {
  if (!email) {
    return false
  }
  return email.trim().toLowerCase() === DEMO_USER_EMAIL
}

export { DEMO_USER_EMAIL, isDemoUser }
