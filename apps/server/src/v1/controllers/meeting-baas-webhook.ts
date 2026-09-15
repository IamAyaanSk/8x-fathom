import { meetingBaasWebhookEventSchema } from '@repo/api-contract/meeting-baas-webhook'
import type { NextFunction, Request, Response } from 'express'

import '#src/types/express'
import {
  applyMeetingBaasWebhook,
  verifyMeetingBaasWebhook
} from '#src/services/meeting-baas-webhook'

const postMeetingBaasWebhookController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawBody = req.rawBody
    if (typeof rawBody !== 'string') {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
      return
    }

    const verifiedPayload = verifyMeetingBaasWebhook(req.headers, rawBody)
    if (verifiedPayload == null) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
      return
    }

    const parsed = meetingBaasWebhookEventSchema.safeParse(verifiedPayload)
    if (!parsed.success) {
      res.status(200).json({
        success: true,
        message: 'Ignored'
      })
      return
    }

    await applyMeetingBaasWebhook(parsed.data)
    res.status(200).json({
      success: true,
      message: 'OK'
    })
  } catch (error) {
    next(error)
  }
}

export { postMeetingBaasWebhookController }
