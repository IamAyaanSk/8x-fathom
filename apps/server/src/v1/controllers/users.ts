import type { GetUsersSuccessResponse } from '@repo/api-contract/v1/users'
import { prisma } from '@repo/db'
import type { NextFunction, Request, Response } from 'express'

const getUsersController = async (
  _req: Request,
  res: Response<GetUsersSuccessResponse>,
  next: NextFunction
) => {
  try {
    const users = await prisma.user.findMany({
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
