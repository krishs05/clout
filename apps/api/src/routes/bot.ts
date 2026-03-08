import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { prisma } from '@clout/database';
import { broadcastBotStatus } from '../websocket.js';
import { DISCORD_API_BASE } from '@clout/shared';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

const router = Router();

// Bot state is now dynamically fetched from the database
export const getBotState = async () => {
  try {
    const state = await prisma.botState.findUnique({ where: { key: 'status' } });
    if (state) {
      return JSON.parse(state.value);
    }
  } catch (error) {
    console.error('Failed to fetch bot state:', error);
  }
  return {
    online: false,
    uptime: 0,
    guilds: 0,
    users: 0,
    commands: 0,
    websocketPing: 0,
    memoryUsage: 0,
  };
};

// Get bot status
router.get('/status', asyncHandler(async (_req: Request, res: Response) => {
  const state = await getBotState();
  res.json({
    success: true,
    data: state,
  });
}));

// Get bot settings (prefix, log level) for admin
router.get('/settings', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  const prefixRow = await prisma.botState.findUnique({ where: { key: 'prefix' } });
  const logLevelRow = await prisma.botState.findUnique({ where: { key: 'logLevel' } });
  res.json({
    success: true,
    data: {
      prefix: prefixRow?.value ? JSON.parse(prefixRow.value) : '!',
      logLevel: logLevelRow?.value ? JSON.parse(logLevelRow.value) : 'info',
    },
  });
}));

// Update bot settings
router.patch('/settings', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { prefix?: string; logLevel?: string };
  if (body.prefix !== undefined) {
    await prisma.botState.upsert({
      where: { key: 'prefix' },
      update: { value: JSON.stringify(body.prefix.slice(0, 5)) },
      create: { key: 'prefix', value: JSON.stringify(body.prefix.slice(0, 5)) },
    });
  }
  if (body.logLevel !== undefined) {
    const level = ['debug', 'info', 'warn', 'error'].includes(body.logLevel) ? body.logLevel : 'info';
    await prisma.botState.upsert({
      where: { key: 'logLevel' },
      update: { value: JSON.stringify(level) },
      create: { key: 'logLevel', value: JSON.stringify(level) },
    });
  }
  const prefixRow = await prisma.botState.findUnique({ where: { key: 'prefix' } });
  const logLevelRow = await prisma.botState.findUnique({ where: { key: 'logLevel' } });
  res.json({
    success: true,
    data: {
      prefix: prefixRow?.value ? JSON.parse(prefixRow.value) : '!',
      logLevel: logLevelRow?.value ? JSON.parse(logLevelRow.value) : 'info',
    },
  });
}));

// Control flag for the bot process (no auth – bot polls this to know whether to stay running)
router.get('/control', asyncHandler(async (_req: Request, res: Response) => {
  let shouldRun = true;
  try {
    const row = await prisma.botState.findUnique({ where: { key: 'control' } });
    if (row?.value) {
      const parsed = JSON.parse(row.value) as { shouldRun?: boolean };
      shouldRun = parsed.shouldRun !== false;
    }
  } catch {
    // ignore
  }
  res.json({ success: true, data: { shouldRun } });
}));

// Set control so a newly started bot process will run; does not start the process
router.post('/start', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  const currentState = await getBotState();
  if (currentState.online) {
    throw new AppError(400, 'Bot is already running');
  }

  const newState = {
    ...currentState,
    online: true,
    uptime: Date.now(),
  };

  await prisma.$transaction([
    prisma.botState.upsert({
      where: { key: 'status' },
      update: { value: JSON.stringify(newState) },
      create: { key: 'status', value: JSON.stringify(newState) },
    }),
    prisma.botState.upsert({
      where: { key: 'control' },
      update: { value: JSON.stringify({ shouldRun: true }) },
      create: { key: 'control', value: JSON.stringify({ shouldRun: true }) },
    }),
  ]);

  broadcastBotStatus(newState);

  res.json({
    success: true,
    message: 'Bot started successfully',
    data: newState,
  });
}));

// Stop bot (signals running bot process to disconnect and exit). Always persist control so the bot sees it.
router.post('/stop', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  const currentState = await getBotState();
  const newState = {
    ...currentState,
    online: false,
    uptime: 0,
  };

  await prisma.$transaction([
    prisma.botState.upsert({
      where: { key: 'status' },
      update: { value: JSON.stringify(newState) },
      create: { key: 'status', value: JSON.stringify(newState) },
    }),
    prisma.botState.upsert({
      where: { key: 'control' },
      update: { value: JSON.stringify({ shouldRun: false }) },
      create: { key: 'control', value: JSON.stringify({ shouldRun: false }) },
    }),
  ]);

  broadcastBotStatus(newState);

  res.json({
    success: true,
    message: 'Bot stopped successfully',
    data: newState,
  });
}));

// Restart bot (signals bot to exit; set control.shouldRun true after delay so a restarted process will run)
router.post('/restart', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  const currentState = await getBotState();

  const stoppedState = { ...currentState, online: false };
  await prisma.botState.upsert({
    where: { key: 'control' },
    update: { value: JSON.stringify({ shouldRun: false }) },
    create: { key: 'control', value: JSON.stringify({ shouldRun: false }) },
  });
  await prisma.botState.upsert({
    where: { key: 'status' },
    update: { value: JSON.stringify(stoppedState) },
    create: { key: 'status', value: JSON.stringify(stoppedState) },
  });
  broadcastBotStatus(stoppedState);

  setTimeout(async () => {
    const startedState = { ...currentState, online: true, uptime: Date.now() };
    await prisma.$transaction([
      prisma.botState.upsert({
        where: { key: 'status' },
        update: { value: JSON.stringify(startedState) },
        create: { key: 'status', value: JSON.stringify(startedState) },
      }),
      prisma.botState.upsert({
        where: { key: 'control' },
        update: { value: JSON.stringify({ shouldRun: true }) },
        create: { key: 'control', value: JSON.stringify({ shouldRun: true }) },
      }),
    ]);
    broadcastBotStatus(startedState);
  }, 2000);

  res.json({
    success: true,
    message: 'Bot restarting...',
    data: stoppedState,
  });
}));

// Get bot stats
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalServers, totalTransactions, currentState] = await Promise.all([
    prisma.user.count(),
    prisma.server.count(),
    prisma.transaction.count(),
    getBotState()
  ]);

  res.json({
    success: true,
    data: {
      bot: currentState,
      database: {
        users: totalUsers,
        servers: totalServers,
        transactions: totalTransactions,
      },
    },
  });
}));

// Historical stats (last 7 days from DB: new users and transactions per day)
router.get('/stats/historical', asyncHandler(async (_req: Request, res: Response) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const history: { name: string; users: number; commands: number; good: number; bad: number; coins: number }[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    const [newUsers, transactionsByDay] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
      prisma.transaction.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
    ]);

    history.push({
      name: days[d.getDay()],
      users: newUsers,
      commands: transactionsByDay,
      good: 0,
      bad: 0,
      coins: 0,
    });
  }

  res.json({
    success: true,
    data: history,
  });
}));

// Top commands (by transaction reason / type for economy; placeholder counts for others)
router.get('/stats/top-commands', asyncHandler(async (_req: Request, res: Response) => {
  const transactions = await prisma.transaction.groupBy({
    by: ['type'],
    _count: { id: true },
  });
  const sorted = transactions.sort((a, b) => b._count.id - a._count.id).slice(0, 10);
  const typeLabels: Record<string, string> = {
    DAILY: '/daily',
    TRANSFER_IN: '/pay (in)',
    TRANSFER_OUT: '/pay (out)',
    GAME_WIN: 'Games',
    GAME_LOSS: 'Games',
    SHOP_PURCHASE: 'Shop',
    ADMIN_GRANT: 'Admin',
    ADMIN_DEDUCT: 'Admin',
  };
  const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#0ea5e9'];
  res.json({
    success: true,
    data: sorted.map((t, i) => ({
      name: typeLabels[t.type] ?? t.type,
      count: t._count.id,
      fill: colors[i % colors.length],
    })),
  });
}));

// Send custom embed via Discord REST API (bot must have access to the channel)
router.post('/send-embed', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as { channelId?: string; embed?: { title?: string; description?: string; color?: string; footer?: string } };
  if (!body?.channelId || !body?.embed) {
    throw new AppError(400, 'channelId and embed are required');
  }
  if (!DISCORD_BOT_TOKEN) {
    throw new AppError(503, 'Discord bot not configured');
  }
  const { channelId, embed } = body;
  const colorHex = typeof embed.color === 'string' ? embed.color.replace(/^#/, '') : undefined;
  const discordEmbed: { title?: string; description?: string; color?: number; footer?: { text: string } } = {};
  if (embed.title) discordEmbed.title = embed.title.slice(0, 256);
  if (embed.description) discordEmbed.description = embed.description.slice(0, 4096);
  if (colorHex) discordEmbed.color = parseInt(colorHex, 16);
  if (embed.footer) discordEmbed.footer = { text: embed.footer.slice(0, 2048) };
  if (!discordEmbed.title && !discordEmbed.description) {
    throw new AppError(400, 'embed must have at least title or description');
  }
  const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    },
    body: JSON.stringify({ embeds: [discordEmbed] }),
  });
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 403) throw new AppError(403, 'Bot cannot send messages to this channel');
    if (response.status === 404) throw new AppError(404, 'Channel not found');
    throw new AppError(response.status >= 500 ? 502 : 400, `Discord API: ${text || response.statusText}`);
  }
  const data = (await response.json()) as { id: string };
  res.json({ success: true, data: { messageId: data.id } });
}));

// List commands from Discord API (live)
router.get('/commands/discord', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  if (!DISCORD_BOT_TOKEN || !DISCORD_CLIENT_ID) {
    throw new AppError(503, 'Discord bot not configured');
  }
  const response = await fetch(`${DISCORD_API_BASE}/applications/${DISCORD_CLIENT_ID}/commands`, {
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new AppError(response.status === 401 ? 503 : 502, `Discord API: ${text || response.statusText}`);
  }
  const data = (await response.json()) as Array<{ id: string; name: string; description: string; options?: unknown[] }>;
  res.json({
    success: true,
    data: data.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || '',
      category: getCategoryForCommand(c.name),
      usage: `/${c.name}`,
    })),
  });
}));

function getCategoryForCommand(name: string): string {
  const map: Record<string, string> = {
    good: 'Karma', bad: 'Karma', profile: 'General', help: 'General',
    daily: 'Economy', balance: 'Economy', pay: 'Economy', leaderboard: 'Economy',
    ban: 'Moderation', kick: 'Moderation', warn: 'Moderation', purge: 'Moderation',
    play: 'Music', skip: 'Music', stop: 'Music',
    trivia: 'Games', rps: 'Games', guess: 'Games',
    command: 'Utility',
  };
  return map[name] ?? 'General';
}

// List commands (fallback static list)
router.get('/commands', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  const commands = [
    { name: 'bad', description: 'Record a bad deed (be honest!)', category: 'Karma', usage: '/bad' },
    { name: 'balance', description: 'Check your or someone else\'s coin balance', category: 'Economy', usage: '/balance [@user]' },
    { name: 'ban', description: 'Bans a user from the server', category: 'Moderation', usage: '/ban @user [reason]' },
    { name: 'command', description: 'Manage custom commands in your server', category: 'Utility', usage: '/command create|delete|list' },
    { name: 'daily', description: 'Claim your daily coin reward', category: 'Economy', usage: '/daily' },
    { name: 'good', description: 'Record a good deed', category: 'Karma', usage: '/good' },
    { name: 'guess', description: 'Guess the number (1-10) and win coins!', category: 'Games', usage: '/guess <number>' },
    { name: 'help', description: 'View all available commands', category: 'General', usage: '/help' },
    { name: 'kick', description: 'Kicks a user from the server', category: 'Moderation', usage: '/kick @user [reason]' },
    { name: 'leaderboard', description: 'View the top coin holders', category: 'Economy', usage: '/leaderboard' },
    { name: 'pay', description: 'Send coins to another user', category: 'Economy', usage: '/pay @user <amount>' },
    { name: 'play', description: 'Plays a song from YouTube/Spotify', category: 'Music', usage: '/play <query>' },
    { name: 'profile', description: 'View your or someone else\'s Clout profile', category: 'General', usage: '/profile [@user]' },
    { name: 'purge', description: 'Deletes multiple messages', category: 'Moderation', usage: '/purge <number>' },
    { name: 'rps', description: 'Play Rock Paper Scissors', category: 'Games', usage: '/rps <choice>' },
    { name: 'skip', description: 'Skips the current song', category: 'Music', usage: '/skip' },
    { name: 'stop', description: 'Stops the music and clears the queue', category: 'Music', usage: '/stop' },
    { name: 'trivia', description: 'Test your knowledge with a trivia question', category: 'Games', usage: '/trivia' },
    { name: 'warn', description: 'Warns a user', category: 'Moderation', usage: '/warn @user [reason]' },
  ];

  res.json({
    success: true,
    data: commands,
  });
}));

export { router as botRouter };