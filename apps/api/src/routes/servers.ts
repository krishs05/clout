import { Router, Response } from 'express';
import fetch from 'node-fetch';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { prisma, Prisma } from '@clout/database';
import { z } from 'zod';
import { DISCORD_API_BASE } from '@clout/shared';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const router = Router();

// Validation schemas
const serverSettingsSchema = z.object({
  economyEnabled: z.boolean().optional(),
  dailyReward: z.number().min(10).max(10000).optional(),
  gamesEnabled: z.boolean().optional(),
  musicEnabled: z.boolean().optional(),
  aiChatEnabled: z.boolean().optional(),
  aiPersonality: z.enum(['balanced', 'roast', 'compliment']).optional(),
  customCommandsEnabled: z.boolean().optional(),
  prefix: z.string().max(5).optional(),
  welcomeChannelId: z.string().nullable().optional(),
  welcomeMessage: z.string().max(2000).nullable().optional(),
  leaveChannelId: z.string().nullable().optional(),
  leaveMessage: z.string().max(2000).nullable().optional(),
  antiSpamEnabled: z.boolean().optional(),
  antiLinkEnabled: z.boolean().optional(),
  antiInvitesEnabled: z.boolean().optional(),
  modLogChannelId: z.string().nullable().optional(),
  modRoleIdsWarn: z.array(z.string()).nullable().optional(),
  modRoleIdsKick: z.array(z.string()).nullable().optional(),
  modRoleIdsBan: z.array(z.string()).nullable().optional(),
});

const embedConfigSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  title: z.string().max(256).optional(),
  description: z.string().max(4096).optional(),
  thumbnail: z.string().url().nullable().optional(),
  image: z.string().url().nullable().optional(),
  footer: z.string().max(2048).optional(),
  showDeedsRatio: z.boolean().optional(),
  showBalance: z.boolean().optional(),
});

const customCommandSchema = z.object({
  name: z.string().min(1).max(32),
  description: z.string().max(100),
  response: z.string().min(1).max(2000),
});

// Get user's servers (syncs with bot's guilds so servers where the bot is in appear even if guildCreate didn't run)
router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  const rawCache = user && 'guildsCache' in user ? (user as { guildsCache?: unknown }).guildsCache : undefined;
  const userGuilds = Array.isArray(rawCache) ? (rawCache as { id?: string; permissions?: number }[]) : [];
  const guildIds = userGuilds.map((g) => g?.id).filter(Boolean) as string[];

  let botGuildIds: string[] = [];
  try {
    const botGuildsRow = await prisma.botState.findUnique({ where: { key: 'guildIds' } });
    if (botGuildsRow?.value) botGuildIds = JSON.parse(botGuildsRow.value) as string[];
  } catch {
    // ignore
  }

  const botGuildSet = new Set(botGuildIds);
  const syncGuildIds = guildIds.filter((id) => botGuildSet.has(id));

  for (const guildId of syncGuildIds) {
    let server = await prisma.server.findUnique({ where: { discordId: guildId } });
    if (!server && DISCORD_BOT_TOKEN) {
      try {
        const guildRes = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
          headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
        });
        if (guildRes.ok) {
          const guild = (await guildRes.json()) as { id: string; name: string; icon: string | null; owner_id: string };
          server = await prisma.server.create({
            data: {
              discordId: guild.id,
              name: guild.name,
              icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
              ownerId: guild.owner_id,
            },
          });
        }
      } catch {
        // skip this guild
      }
    }
    if (server) {
      await prisma.serverMember.upsert({
        where: { serverId_userId: { serverId: server.id, userId } },
        update: {},
        create: { serverId: server.id, userId },
      });
    }
  }

  if (guildIds.length > 0 && syncGuildIds.length === 0) {
    const serversInUserGuilds = await prisma.server.findMany({
      where: { discordId: { in: guildIds } },
      select: { id: true },
    });
    for (const server of serversInUserGuilds) {
      await prisma.serverMember.upsert({
        where: { serverId_userId: { serverId: server.id, userId } },
        update: {},
        create: { serverId: server.id, userId },
      });
    }
  }

  const memberships = await prisma.serverMember.findMany({
    where: { userId },
    include: {
      server: {
        include: {
          settings: true,
          embedConfig: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: memberships.map((m) => ({
      ...m.server,
      memberSince: m.joinedAt,
    })),
  });
}));

// Get moderation events across all of the user's servers (for admin panel)
router.get('/moderation/events', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const memberships = await prisma.serverMember.findMany({
    where: { userId },
    select: { serverId: true },
  });
  const serverIds = memberships.map((m) => m.serverId);
  if (serverIds.length === 0) {
    res.json({ success: true, data: [] });
    return;
  }
  const events = await (prisma as any).moderationEvent.findMany({
    where: { serverId: { in: serverIds } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const serverIdList = [...new Set((events as { serverId: string }[]).map((e) => e.serverId))];
  const servers = await prisma.server.findMany({
    where: { id: { in: serverIdList } },
    select: { id: true, name: true, discordId: true },
  });
  const serverMap = new Map(servers.map((s) => [s.id, s]));
  res.json({
    success: true,
    data: (events as { serverId: string; id: string; action: string; targetUsername: string; moderatorUsername: string; reason: string | null; createdAt: Date }[]).map((e) => ({
      ...e,
      serverName: serverMap.get(e.serverId)?.name ?? 'Unknown',
      serverDiscordId: serverMap.get(e.serverId)?.discordId,
    })),
  });
}));

// Get server details
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const server = await prisma.server.findUnique({
    where: { discordId: id },
    include: {
      settings: true,
      embedConfig: {
        include: { fields: true },
      },
      customCommands: {
        include: { creator: true },
      },
    },
  });

  if (!server) {
    throw new AppError(404, 'Server not found');
  }

  res.json({
    success: true,
    data: server,
  });
}));

// Update server settings
router.patch('/:id/settings', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const validated = serverSettingsSchema.parse(req.body);

  let server = await prisma.server.findUnique({
    where: { discordId: id },
  });

  if (!server) {
    throw new AppError(404, 'Server not found');
  }

  const jsonNull = Prisma.JsonNull;
  const toSettingsData = (v: typeof validated) => ({
    ...v,
    modRoleIdsWarn: v.modRoleIdsWarn === null ? jsonNull : v.modRoleIdsWarn,
    modRoleIdsKick: v.modRoleIdsKick === null ? jsonNull : v.modRoleIdsKick,
    modRoleIdsBan: v.modRoleIdsBan === null ? jsonNull : v.modRoleIdsBan,
  });
  const settings = await prisma.serverSettings.upsert({
    where: { serverId: server.id },
    update: toSettingsData(validated),
    create: {
      serverId: server.id,
      ...toSettingsData(validated),
    },
  });

  res.json({
    success: true,
    data: settings,
  });
}));

// Get moderation events (warn, kick, ban)
router.get('/:id/moderation/events', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const server = await prisma.server.findUnique({ where: { discordId: id } });
  if (!server) throw new AppError(404, 'Server not found');

  const events = await (prisma as any).moderationEvent.findMany({
    where: { serverId: server.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({ success: true, data: events });
}));

// Bot leaves a guild (Discord API); removes server from DB so it no longer appears as connected
router.post('/:id/leave', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: guildId } = req.params;
  const userId = req.user!.id;
  const server = await prisma.server.findUnique({ where: { discordId: guildId } });
  if (!server) throw new AppError(404, 'Server not found');
  const member = await prisma.serverMember.findUnique({
    where: { serverId_userId: { serverId: server.id, userId } },
  });
  if (!member) throw new AppError(403, 'You do not have access to this server in the dashboard');
  if (!DISCORD_BOT_TOKEN) throw new AppError(503, 'Bot not configured');
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds/${guildId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
  });
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 403) throw new AppError(403, 'Bot cannot leave this guild');
    if (response.status === 404) throw new AppError(404, 'Guild not found');
    throw new AppError(502, `Discord API: ${text || response.statusText}`);
  }
  await prisma.server.delete({ where: { id: server.id } });
  res.json({ success: true, message: 'Bot has left the server' });
}));

// Reset moderation data for a server (deletes all moderation events)
router.post('/:id/moderation/reset', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const server = await prisma.server.findUnique({ where: { discordId: id } });
  if (!server) throw new AppError(404, 'Server not found');
  const member = await prisma.serverMember.findUnique({
    where: { serverId_userId: { serverId: server.id, userId } },
  });
  if (!member) throw new AppError(403, 'You do not have access to this server');
  await (prisma as any).moderationEvent.deleteMany({ where: { serverId: server.id } });
  res.json({ success: true, message: 'Moderation data reset' });
}));

// Get Discord guild roles (live from Discord API)
router.get('/:id/roles', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: guildId } = req.params;
  if (!DISCORD_BOT_TOKEN) throw new AppError(503, 'Bot not configured');
  const server = await prisma.server.findUnique({ where: { discordId: guildId } });
  if (!server) throw new AppError(404, 'Server not found');

  const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new AppError(response.status === 404 ? 404 : 502, `Discord API: ${text || response.statusText}`);
  }
  const roles = (await response.json()) as Array<{ id: string; name: string; position: number }>;
  res.json({
    success: true,
    data: roles.filter((r) => !r.name.startsWith('@')).map((r) => ({ id: r.id, name: r.name, position: r.position })),
  });
}));

// Get embed config
router.get('/:id/embed', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const server = await prisma.server.findUnique({
    where: { discordId: id },
    include: {
      embedConfig: {
        include: { fields: true },
      },
    },
  });

  if (!server) {
    throw new AppError(404, 'Server not found');
  }

  res.json({
    success: true,
    data: server.embedConfig || {
      color: '#5865F2',
      title: "{username}'s Profile",
      description: 'Good deeds: {goodDeeds} | Bad deeds: {badDeeds}',
      thumbnail: null,
      image: null,
      footer: 'Clout Bot',
      showDeedsRatio: true,
      showBalance: true,
      fields: [],
    },
  });
}));

// Update embed config
router.patch('/:id/embed', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const validated = embedConfigSchema.parse(req.body);

  let server = await prisma.server.findUnique({
    where: { discordId: id },
  });

  if (!server) {
    // Create server if it doesn't exist
    server = await prisma.server.create({
      data: {
        discordId: id,
        name: 'Unknown',
        ownerId: req.user!.discordId,
      },
    });
  }

  const embedConfig = await prisma.embedConfig.upsert({
    where: { serverId: server.id },
    update: validated,
    create: {
      serverId: server.id,
      color: '#5865F2',
      title: "{username}'s Profile",
      description: 'Good deeds: {goodDeeds} | Bad deeds: {badDeeds}',
      footer: 'Clout Bot',
      showDeedsRatio: true,
      showBalance: true,
      ...validated,
    },
  });

  res.json({
    success: true,
    data: embedConfig,
  });
}));

// Get custom commands
router.get('/:id/commands', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const server = await prisma.server.findUnique({
    where: { discordId: id },
    include: {
      customCommands: {
        include: { creator: true },
      },
    },
  });

  if (!server) {
    throw new AppError(404, 'Server not found');
  }

  res.json({
    success: true,
    data: server.customCommands,
  });
}));

// Create custom command
router.post('/:id/commands', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const validated = customCommandSchema.parse(req.body);

  let server = await prisma.server.findUnique({
    where: { discordId: id },
  });

  if (!server) {
    server = await prisma.server.create({
      data: {
        discordId: id,
        name: 'Unknown',
        ownerId: req.user!.discordId,
      },
    });
  }

  // Get or create user
  let user = await prisma.user.findUnique({
    where: { discordId: req.user!.discordId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        discordId: req.user!.discordId,
        username: req.user!.username,
        goodDeeds: 0,
        badDeeds: 0,
        balance: 0,
      },
    });
  }

  const command = await prisma.customCommand.create({
    data: {
      serverId: server.id,
      name: validated.name.toLowerCase(),
      description: validated.description,
      response: validated.response,
      createdBy: user.id,
    },
  });

  res.json({
    success: true,
    data: command,
  });
}));

// Delete custom command
router.delete('/:id/commands/:commandId', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, commandId } = req.params;

  const server = await prisma.server.findUnique({
    where: { discordId: id },
  });

  if (!server) {
    throw new AppError(404, 'Server not found');
  }

  await prisma.customCommand.delete({
    where: { id: commandId },
  });

  res.json({
    success: true,
    message: 'Command deleted',
  });
}));

// Get command permission configs for server
router.get('/:id/command-config', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const server = await prisma.server.findUnique({ where: { discordId: id } });
  if (!server) throw new AppError(404, 'Server not found');
  const configs = await (prisma as any).serverCommandConfig.findMany({
    where: { serverId: server.id },
  });
  res.json({
    success: true,
    data: configs.map((c: { commandName: string; allowedRoleIds: unknown; allowedUserIds: unknown }) => ({
      commandName: c.commandName,
      allowedRoleIds: (c.allowedRoleIds as string[]) ?? [],
      allowedUserIds: (c.allowedUserIds as string[]) ?? [],
    })),
  });
}));

// Update command permission config for server
router.patch('/:id/command-config', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const body = z.object({
    commandName: z.string().min(1).max(32),
    allowedRoleIds: z.array(z.string()).optional(),
    allowedUserIds: z.array(z.string()).optional(),
  }).parse(req.body);
  const server = await prisma.server.findUnique({ where: { discordId: id } });
  if (!server) throw new AppError(404, 'Server not found');
  const config = await (prisma as any).serverCommandConfig.upsert({
    where: {
      serverId_commandName: { serverId: server.id, commandName: body.commandName },
    },
    update: {
      allowedRoleIds: body.allowedRoleIds ?? undefined,
      allowedUserIds: body.allowedUserIds ?? undefined,
      updatedAt: new Date(),
    },
    create: {
      serverId: server.id,
      commandName: body.commandName,
      allowedRoleIds: body.allowedRoleIds ?? [],
      allowedUserIds: body.allowedUserIds ?? [],
    },
  });
  res.json({ success: true, data: config });
}));

// Get economy settings
router.get('/:id/economy', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const server = await prisma.server.findUnique({
    where: { discordId: id },
    include: { settings: true },
  });

  if (!server) {
    throw new AppError(404, 'Server not found');
  }

  res.json({
    success: true,
    data: {
      enabled: server.settings?.economyEnabled ?? true,
      dailyReward: server.settings?.dailyReward ?? 100,
    },
  });
}));

// Get leaderboard
router.get('/:id/leaderboard', asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;

  const topUsers = await prisma.user.findMany({
    orderBy: { balance: 'desc' },
    take: 10,
  });

  res.json({
    success: true,
    data: topUsers,
  });
}));

export { router as serversRouter };