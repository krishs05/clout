export const CONSTANTS = {
  DEFAULT_DAILY_REWARD: 100,
  MIN_DAILY_REWARD: 10,
  MAX_DAILY_REWARD: 10000,
  
  DEFAULT_EMBED_COLOR: '#5865F2',
  MAX_EMBED_FIELDS: 25,
  MAX_EMBED_FIELD_NAME_LENGTH: 256,
  MAX_EMBED_FIELD_VALUE_LENGTH: 1024,
  MAX_EMBED_DESCRIPTION_LENGTH: 4096,
  MAX_EMBED_TITLE_LENGTH: 256,
  MAX_EMBED_FOOTER_LENGTH: 2048,
  
  MAX_CUSTOM_COMMANDS_PER_SERVER: 50,
  MAX_CUSTOM_COMMAND_NAME_LENGTH: 32,
  MAX_CUSTOM_COMMAND_RESPONSE_LENGTH: 2000,
  
  CHAT_HISTORY_LIMIT: 50,
  MAX_CHAT_MESSAGE_LENGTH: 2000,
  
  MUSIC_MAX_QUEUE_SIZE: 100,
  MUSIC_DEFAULT_VOLUME: 50,
  
  TRIVIA_QUESTION_TIMEOUT: 30000,
  RPS_TIMEOUT: 60000,
  GUESS_NUMBER_TIMEOUT: 120000,
  
  WEBSOCKET_RECONNECT_INTERVAL: 5000,
  WEBSOCKET_MAX_RECONNECT_ATTEMPTS: 5,
} as const;

export const ROUTES = {
  AUTH: {
    DISCORD: '/auth/discord',
    CALLBACK: '/auth/callback',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },
  BOT: {
    STATUS: '/bot/status',
    START: '/bot/start',
    STOP: '/bot/stop',
    RESTART: '/bot/restart',
  },
  SERVERS: {
    LIST: '/servers',
    DETAIL: (id: string) => `/servers/${id}`,
    SETTINGS: (id: string) => `/servers/${id}/settings`,
    EMBED: (id: string) => `/servers/${id}/embed`,
    COMMANDS: (id: string) => `/servers/${id}/commands`,
    COMMAND_DETAIL: (id: string, cmdId: string) => `/servers/${id}/commands/${cmdId}`,
    ECONOMY: (id: string) => `/servers/${id}/economy`,
    LEADERBOARD: (id: string) => `/servers/${id}/economy/leaderboard`,
  },
  USERS: {
    PROFILE: (id: string) => `/users/${id}/profile`,
    BALANCE: (id: string) => `/users/${id}/balance`,
    TRANSACTIONS: (id: string) => `/users/${id}/transactions`,
  },
} as const;

export const DISCORD_SCOPES = ['identify', 'guilds', 'email'] as const;

export const DISCORD_API_BASE = 'https://discord.com/api/v10';

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Bad request',
  INTERNAL_ERROR: 'Internal server error',
  DISCORD_API_ERROR: 'Discord API error',
  DATABASE_ERROR: 'Database error',
  BOT_OFFLINE: 'Bot is currently offline',
  INVALID_TOKEN: 'Invalid or expired token',
  RATE_LIMITED: 'Rate limited, please try again later',
} as const;