import { Router } from 'express'

import {
  getCalendarStatusController,
  postCalendarSyncController
} from '#src/v1/controllers/calendar'

const router = Router()

router.get('/status', getCalendarStatusController)
router.post('/sync', postCalendarSyncController)

export { router as calendarRouter }
