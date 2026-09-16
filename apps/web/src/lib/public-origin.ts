import { env } from '#src/env'

/**
 * Browser API origin. Use the page origin so `/api` hits the Vite proxy locally
 * and Vercel rewrites in production (session cookies stay first-party).
 */
function resolvePublicOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return env.VITE_API_URL.replace(/\/$/, '')
}

export { resolvePublicOrigin }
