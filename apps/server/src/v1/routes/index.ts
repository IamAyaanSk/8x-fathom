import express from 'express'

import { getUsersController } from '#src/v1/controllers/users'

const router = express.Router()

router.get('/users', getUsersController)

export default router
