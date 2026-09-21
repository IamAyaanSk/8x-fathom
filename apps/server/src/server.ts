import '#src/env'
import { isDevelopmentEnvironment } from '@repo/env'
import { toNodeHandler } from 'better-auth/node'
import { json } from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { type Express, type Request, type Response } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import { auth } from '#src/auth'
import { env } from '#src/env'
import '#src/types/express'
import { errorMiddleware } from '#src/v1/middlewares/error'
import v1Router from '#src/v1/routes/index'
import { webhookRouter } from '#src/v1/routes/webhook'

const app: Express = express()
const port = env.PORT

app.set('trust proxy', 1)

app.use(
  cors({
    origin: env.WEB_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  })
)

app.use(morgan(isDevelopmentEnvironment(env.NODE_ENV) ? 'dev' : 'combined'))

app.all('/api/auth/*splat', toNodeHandler(auth))

app.use('/api/webhooks', webhookRouter)

app.use(json())
app.use(cookieParser())

app.use(helmet())

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK')
})

app.use('/api/v1', v1Router)

app.use(errorMiddleware)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
