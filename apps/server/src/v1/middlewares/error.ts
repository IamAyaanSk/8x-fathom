import { type Request, type Response, type NextFunction } from 'express'

function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  // TODO: Create custom error and use that
  if (res.headersSent) {
    return next(err)
  }
  res.status(500)
}

export { errorMiddleware }
