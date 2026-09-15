import type { NextFunction, Request, Response } from 'express'

import { HttpError } from '#src/v1/errors/http-error'

function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    })
    return
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  })
}

export { errorMiddleware }
