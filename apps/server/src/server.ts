import { isDevelopmentEnvironment } from '@repo/env'
import { json } from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { type Express, type Request, type Response } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import { env } from '#src/env'
import { errorMiddleware } from '#src/v1/middlewares/error'
import v1Router from '#src/v1/routes/index'

const app: Express = express()
const port = env.PORT

app.use(json())
app.use(cookieParser())

app.use(helmet())
app.use(
  cors({
    origin: [/^http:\/\/localhost(:[0-9]+)?$/],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  })
)

app.use(morgan(isDevelopmentEnvironment(env.NODE_ENV) ? 'dev' : 'combined'))

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK')
})

app.use('/api/v1', v1Router)

app.use(errorMiddleware)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
