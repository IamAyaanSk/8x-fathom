import '#src/env'
import { isDevelopmentEnvironment } from '@repo/env'
import express, { type Express, type Request, type Response } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cron from 'node-cron'

import {
  ARTIFACT_IMPORT_CRON_EXPRESSION,
  DISPATCH_CRON_EXPRESSION,
  PENDING_PROCESSING_CRON_EXPRESSION,
  STATUS_POLL_CRON_EXPRESSION
} from '#src/constants'
import { env } from '#src/env'
import {
  runArtifactImportTick,
  runDispatchTick,
  runPendingProcessingTick,
  runStatusPollTick
} from '#src/scheduler'

const app: Express = express()
const port = env.PORT

app.use(helmet())
app.use(morgan(isDevelopmentEnvironment(env.NODE_ENV) ? 'dev' : 'combined'))

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK')
})

const server = app.listen(port, () => {
  console.log(`Worker listening on port ${port}`)
})

void runDispatchTick()
void runStatusPollTick()
void runArtifactImportTick()
void runPendingProcessingTick()

const dispatchTask = cron.schedule(
  DISPATCH_CRON_EXPRESSION,
  () => {
    void runDispatchTick()
  },
  { noOverlap: true }
)

const statusPollTask = cron.schedule(
  STATUS_POLL_CRON_EXPRESSION,
  () => {
    void runStatusPollTick()
  },
  { noOverlap: true }
)

const artifactImportTask = cron.schedule(
  ARTIFACT_IMPORT_CRON_EXPRESSION,
  () => {
    void runArtifactImportTick()
  },
  { noOverlap: true }
)

const pendingProcessingTask = cron.schedule(
  PENDING_PROCESSING_CRON_EXPRESSION,
  () => {
    void runPendingProcessingTick()
  },
  { noOverlap: true }
)

function shutdown() {
  void Promise.resolve(dispatchTask.stop())
    .then(() => statusPollTask.stop())
    .then(() => artifactImportTask.stop())
    .then(() => pendingProcessingTask.stop())
    .finally(() => {
      server.close(() => {
        process.exit(0)
      })
    })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
