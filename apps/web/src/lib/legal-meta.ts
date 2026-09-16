import { env } from '#src/env'

const PRODUCT_NAME = '8x Fathom'

/** Shown on legal pages and in Google Cloud / OAuth consent configuration. */
const LEGAL_EFFECTIVE_DATE = 'September 16, 2026'

/**
 * Set `VITE_LEGAL_CONTACT_EMAIL` in production (e.g. privacy@yourdomain.com).
 * Google OAuth verification requires a working contact on the privacy policy.
 */
const LEGAL_CONTACT_EMAIL =
  env.VITE_LEGAL_CONTACT_EMAIL ?? 'privacy@8xfathom.com'

export { LEGAL_CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE, PRODUCT_NAME }
