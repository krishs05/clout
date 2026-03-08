import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    discordId: string;
    username: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Unauthorized'));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch {
    next(new AppError(401, 'Invalid token'));
  }
};

export const generateToken = (user: { id: string; discordId: string; username: string }): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};

export type { AuthRequest };