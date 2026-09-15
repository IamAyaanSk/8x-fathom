import { authClient } from '#lib/auth-client'

function getAppCallbackUrl(path = '/'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${window.location.origin}${normalizedPath}`
}

async function startGoogleSignIn(): Promise<{ error: Error | null }> {
  const { data, error } = await authClient.signIn.social({
    provider: 'google',
    callbackURL: getAppCallbackUrl('/')
  })

  if (error) {
    return { error: new Error(error.message ?? 'Could not start Google sign-in.') }
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
    callbackURL: getAppCallbackUrl('/')
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

export { getAppCallbackUrl, startGoogleCalendarLink, startGoogleSignIn }
