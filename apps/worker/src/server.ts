import '#src/env'
import { isDevelopmentEnvironment } from '@repo/env'
import express, { type Express, type Request, type Response } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cron from 'node-cron'

import { DISPATCH_CRON_EXPRESSION } from '#src/dispatch-bot/constants'
import { dispatchBotForDueMeetings } from '#src/dispatch-bot/index'
import { env } from '#src/env'
import { ARTIFACT_IMPORT_CRON_EXPRESSION } from '#src/import-meeting-artifacts/constants'
import { importMeetingArtifacts } from '#src/import-meeting-artifacts/index'
import { PENDING_PROCESSING_CRON_EXPRESSION } from '#src/process-pending-meetings/constants'
import { processPendingMeetings } from '#src/process-pending-meetings/index'
import { RECONCILE_BOT_STATUS_CRON_EXPRESSION } from '#src/reconcile-bot-status/constants'
import { reconcileBotStatus } from '#src/reconcile-bot-status/index'

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

void dispatchBotForDueMeetings()
void reconcileBotStatus()
void importMeetingArtifacts()
void processPendingMeetings()

const dispatchBotForDueMeetingsTask = cron.schedule(
  DISPATCH_CRON_EXPRESSION,
  () => {
    void dispatchBotForDueMeetings()
  },
  { noOverlap: true }
)

const reconcileBotStatusTask = cron.schedule(
  RECONCILE_BOT_STATUS_CRON_EXPRESSION,
  () => {
    void reconcileBotStatus()
  },
  { noOverlap: true }
)

const importMeetingArtifactsTask = cron.schedule(
  ARTIFACT_IMPORT_CRON_EXPRESSION,
  () => {
    void importMeetingArtifacts()
  },
  { noOverlap: true }
)

const pendingProcessingTask = cron.schedule(
  PENDING_PROCESSING_CRON_EXPRESSION,
  () => {
    void processPendingMeetings()
  },
  { noOverlap: true }
)

function shutdown() {
  void Promise.resolve(dispatchBotForDueMeetingsTask.stop())
    .then(() => reconcileBotStatusTask.stop())
    .then(() => importMeetingArtifactsTask.stop())
    .then(() => pendingProcessingTask.stop())
    .finally(() => {
      server.close(() => {
        process.exit(0)
      })
    })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
