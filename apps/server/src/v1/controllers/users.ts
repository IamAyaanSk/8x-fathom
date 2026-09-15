import '#src/env'
import type { GetUsersSuccessResponse } from '@repo/api-contract/v1/users'
import { prisma } from '@repo/db'

import '#src/types/express'
import type { NextFunction, Request, Response } from 'express'

const getUsersController = async (
  req: Request,
  res: Response<GetUsersSuccessResponse>,
  next: NextFunction
) => {
  try {
    // requireSession always sets this before the handler runs
    const userId = req.session!.user.id
    const users = await prisma.user.findMany({
      where: { id: userId },
      select: {
        name: true,
        email: true
      }
    })

    res.json({
      success: true,
      message: 'Users fetched successfully',
      data: users
    })
  } catch (error) {
    next(error)
  }
}

export { getUsersController }
