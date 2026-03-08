import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { generateToken } from '../middleware/auth.js';
import { prisma } from '@clout/database';
import { DISCORD_API_BASE, DISCORD_SCOPES } from '@clout/shared';

const router = Router();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Get Discord OAuth2 URL
router.get('/discord', (_req, res) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: DISCORD_SCOPES.join(' '),
  });

  const url = `${DISCORD_API_BASE}/oauth2/authorize?${params.toString()}`;
  res.json({ url });
});

// OAuth2 callback (Discord redirects here with ?code=... or ?error=...)
router.get('/callback', asyncHandler(async (req: Request, res: Response) => {
  const { code, error: discordError, error_description: errorDescription } = req.query;

  if (discordError || typeof code !== 'string' || !code) {
    const message = discordError === 'access_denied'
      ? 'You denied access'
      : (typeof errorDescription === 'string' ? errorDescription : 'Authentication failed');
    return res.redirect(`${FRONTEND_URL}/auth/callback?error=auth_failed&message=${encodeURIComponent(message)}`);
  }

  // Exchange code for access token
  const tokenResponse = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: DISCORD_REDIRECT_URI,
    }),
  });

  if (!tokenResponse.ok) {
    return res.redirect(`${FRONTEND_URL}/auth/callback?error=auth_failed&message=${encodeURIComponent('Failed to authenticate')}`);
  }

  const tokenData = await tokenResponse.json() as { access_token: string };

  // Get user info from Discord
  const userResponse = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!userResponse.ok) {
    return res.redirect(`${FRONTEND_URL}/auth/callback?error=auth_failed&message=${encodeURIComponent('Failed to get user info')}`);
  }

  const discordUser = await userResponse.json() as {
    id: string;
    username: string;
    avatar: string | null;
    email?: string;
  };

  // Get user's guilds
  const guildsResponse = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  const guilds = guildsResponse.ok ? await guildsResponse.json() : [];

  // Find or create user in database
  let user = await prisma.user.findUnique({
    where: { discordId: discordUser.id },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        discordId: discordUser.id,
        username: discordUser.username,
        avatar: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null,
        goodDeeds: 0,
        badDeeds: 0,
        balance: 0,
      },
    });
  } else {
    // Update user info
    user = await prisma.user.update({
      where: { discordId: discordUser.id },
      data: {
        username: discordUser.username,
        avatar: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null,
      },
    });
  }

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { guildsCache: guilds as object, guildsCacheUpdatedAt: new Date() },
    });
  }

  // Generate JWT
  const jwt = generateToken({
    id: user.id,
    discordId: user.discordId,
    username: user.username,
  });

  // Redirect to frontend with token
  res.redirect(`${FRONTEND_URL}/auth/callback?token=${jwt}`);
}));

// Get current user
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'Unauthorized');
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { discordId: string };
    const user = await prisma.user.findUnique({
      where: { discordId: decoded.discordId },
      select: {
        id: true,
        discordId: true,
        username: true,
        avatar: true,
        balance: true,
        goodDeeds: true,
        badDeeds: true,
        guildsCache: true,
        guildsCacheUpdatedAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const { guildsCache, ...rest } = user;
    res.json({
      success: true,
      data: { ...rest, guilds: guildsCache ?? [] },
    });
  } catch {
    throw new AppError(401, 'Invalid token');
  }
}));

export { router as authRouter };