import { json, Router, type Request } from 'express'

import { postMeetingBaasWebhookController } from '#src/v1/controllers/meeting/webhooks'

const router = Router()

router.post(
  '/meetingbaas',
  json({
    verify: (req, _res, buf) => {
      const incomingReq = req as Request
      incomingReq.rawBody = buf.toString('utf8')
    }
  }),
  postMeetingBaasWebhookController
)

export { router as webhookRouter }
