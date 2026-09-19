import '#src/env'
import { isDevelopmentEnvironment } from '@repo/env'
import { MEETING_BAAS_WEBHOOK_PATH } from '@repo/meeting-dispatch'
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
import { postMeetingBaasWebhookController } from '#src/v1/controllers/webhooks/baas-webhook'
import { errorMiddleware } from '#src/v1/middlewares/error'
import v1Router from '#src/v1/routes/index'

const app: Express = express()
const port = env.PORT

app.set('trust proxy', 1)

app.use(
  cors({
    origin: env.WEB_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  })
)

app.use(morgan(isDevelopmentEnvironment(env.NODE_ENV) ? 'dev' : 'combined'))

app.all('/api/auth/*splat', toNodeHandler(auth))

app.post(
  MEETING_BAAS_WEBHOOK_PATH,
  json({
    verify: (req, _res, buf) => {
      const incomingReq = req as Request
      incomingReq.rawBody = buf.toString('utf8')
    }
  }),
  postMeetingBaasWebhookController
)

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
