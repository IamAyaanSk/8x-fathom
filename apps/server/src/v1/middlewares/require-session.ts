import { fromNodeHeaders } from 'better-auth/node'
import type { NextFunction, Request, Response } from 'express'

import { auth } from '#src/auth'
import '#src/types/express'

async function requireSession(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    })

    if (!session) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
      return
    }

    req.session = session
    next()
  } catch (error) {
    next(error)
  }
}

export { requireSession }
