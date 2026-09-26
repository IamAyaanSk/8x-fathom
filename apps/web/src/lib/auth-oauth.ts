import { authClient } from '#lib/auth-client'

function getAppCallbackUrl(path = '/meetings'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${window.location.origin}${normalizedPath}`
}

async function startGoogleSignIn(): Promise<{ error: Error | null }> {
  const { data, error } = await authClient.signIn.social({
    provider: 'google',
    callbackURL: getAppCallbackUrl('/meetings')
  })

  if (error) {
    return {
      error: new Error(error.message ?? 'Could not start Google sign-in.')
    }
  }

  if (data?.url) {
    window.location.assign(data.url)
    return { error: null }
  }

  return { error: new Error('No OAuth redirect URL was returned.') }
}

async function startGoogleCalendarLink(): Promise<{ error: Error | null }> {
  const { data, error } = await authClient.linkSocial({
    provider: 'google',
    scopes: ['https://www.googleapis.com/auth/calendar.events.readonly'],
    callbackURL: getAppCallbackUrl('/meetings')
  })

  if (error) {
    return {
      error: new Error(error.message ?? 'Could not connect Google Calendar.')
    }
  }

  if (data?.url) {
    window.location.assign(data.url)
    return { error: null }
  }

  return { error: new Error('No OAuth redirect URL was returned.') }
}

const DEMO_USER_EMAIL = (
  (import.meta.env.VITE_DEMO_USER_EMAIL as string | undefined) || ''
).trim()
const DEMO_USER_PASSWORD = (
  (import.meta.env.VITE_DEMO_USER_PASSWORD as string | undefined) || ''
).trim()

async function signInAsDemo(): Promise<{ error: Error | null }> {
  if (!DEMO_USER_EMAIL || !DEMO_USER_PASSWORD) {
    return { error: new Error('Demo credentials are not configured.') }
  }

  const { error } = await authClient.signIn.email({
    email: DEMO_USER_EMAIL,
    password: DEMO_USER_PASSWORD,
    callbackURL: getAppCallbackUrl('/meetings')
  })

  if (error) {
    return {
      error: new Error(error.message ?? 'Could not sign in as demo user.')
    }
  }

  window.location.assign(getAppCallbackUrl('/meetings'))
  return { error: null }
}

export {
  getAppCallbackUrl,
  signInAsDemo,
  startGoogleCalendarLink,
  startGoogleSignIn
}
