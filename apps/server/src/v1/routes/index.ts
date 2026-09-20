import { Router } from 'express'

import { requireSession } from '#src/v1/middlewares/require-session'
import { calendarRouter } from '#src/v1/routes/calendar'
import { meetingRouter } from '#src/v1/routes/meeting/index'
import { shareRouter } from '#src/v1/routes/share'
import { webhookRouter } from '#src/v1/routes/webhook'

const router = Router()

// Public routes
router.use('/share', shareRouter)
router.use('/webhooks', webhookRouter)

// Protected routes
router.use('/calendar', requireSession, calendarRouter)
router.use('/meetings', requireSession, meetingRouter)

export default router
