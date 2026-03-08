import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { prisma } from '@clout/database';

const router = Router();

// Get user profile
router.get('/:id/profile', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { discordId: id },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Calculate rank
  const higherBalance = await prisma.user.count({
    where: { balance: { gt: user.balance } }
  });

  res.json({
    success: true,
    data: {
      ...user,
      rank: higherBalance + 1,
    },
  });
}));

// Get user balance
router.get('/:id/balance', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { discordId: id },
    select: { balance: true, discordId: true, username: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json({
    success: true,
    data: user,
  });
}));

// Get user transactions
router.get('/:id/transactions', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Only allow users to see their own transactions
  if (id !== req.user!.discordId) {
    throw new AppError(403, 'Forbidden');
  }

  const user = await prisma.user.findUnique({
    where: { discordId: id },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({
    success: true,
    data: transactions,
  });
}));

export { router as usersRouter };