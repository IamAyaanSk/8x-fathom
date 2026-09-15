import type { AppSession } from '#src/auth'

declare global {
  namespace Express {
    interface Request {
      session?: AppSession
    }
  }
}
