import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { prisma } from '@clout/database';
import { broadcastBotStatus } from '../websocket';

const router = Router();

// Mock bot state (in production, this would communicate with the actual bot process)
export let botState = {
  online: false,
  uptime: 0,
  guilds: 0,
  users: 0,
  commands: 12,
  websocketPing: 0,
  memoryUsage: 0,
};

let botProcess: any = null;

// Get bot status
router.get('/status', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: botState,
  });
}));

// Start bot
router.post('/start', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  if (botState.online) {
    throw new AppError(400, 'Bot is already running');
  }

  // In production, this would spawn the bot process
  botState = {
    online: true,
    uptime: Date.now(),
    guilds: 5,
    users: 1250,
    commands: 12,
    websocketPing: 45,
    memoryUsage: 128,
  };

  broadcastBotStatus(botState);

  res.json({
    success: true,
    message: 'Bot started successfully',
    data: botState,
  });
}));

// Stop bot
router.post('/stop', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  if (!botState.online) {
    throw new AppError(400, 'Bot is not running');
  }

  botState = {
    online: false,
    uptime: 0,
    guilds: 0,
    users: 0,
    commands: 12,
    websocketPing: 0,
    memoryUsage: 0,
  };

  broadcastBotStatus(botState);

  res.json({
    success: true,
    message: 'Bot stopped successfully',
    data: botState,
  });
}));

// Restart bot
router.post('/restart', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  // Stop
  botState.online = false;
  broadcastBotStatus(botState);

  // Start again
  setTimeout(() => {
    botState = {
      online: true,
      uptime: Date.now(),
      guilds: 5,
      users: 1250,
      commands: 12,
      websocketPing: 42,
      memoryUsage: 128,
    };
    broadcastBotStatus(botState);
  }, 1000);

  res.json({
    success: true,
    message: 'Bot restarting...',
    data: botState,
  });
}));

// Get bot stats
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const totalUsers = await prisma.user.count();
  const totalServers = await prisma.server.count();
  const totalTransactions = await prisma.transaction.count();

  res.json({
    success: true,
    data: {
      bot: botState,
      database: {
        users: totalUsers,
        servers: totalServers,
        transactions: totalTransactions,
      },
    },
  });
}));

// List commands
router.get('/commands', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  const commands = [
    { name: 'ping', description: 'Replies with Pong!', category: 'General', usage: '/ping' },
    { name: 'help', description: 'Shows all available commands', category: 'General', usage: '/help [command]' },
    { name: 'ban', description: 'Bans a user from the server', category: 'Moderation', usage: '/ban @user [reason]' },
    { name: 'kick', description: 'Kicks a user from the server', category: 'Moderation', usage: '/kick @user [reason]' },
    { name: 'purge', description: 'Deletes multiple messages', category: 'Moderation', usage: '/purge <number>' },
    { name: 'warn', description: 'Warns a user', category: 'Moderation', usage: '/warn @user [reason]' },
    { name: 'play', description: 'Plays a song from YouTube/Spotify', category: 'Music', usage: '/play <query>' },
    { name: 'skip', description: 'Skips the current song', category: 'Music', usage: '/skip' },
    { name: 'stop', description: 'Stops the music and clears the queue', category: 'Music', usage: '/stop' },
    { name: 'economy', description: 'Shows your current balance', category: 'Economy', usage: '/economy' },
    { name: 'daily', description: 'Claims your daily reward', category: 'Economy', usage: '/daily' },
    { name: 'pay', description: 'Pays another user from your balance', category: 'Economy', usage: '/pay @user <amount>' },
  ];

  res.json({
    success: true,
    data: commands,
  });
}));

export { router as botRouter };