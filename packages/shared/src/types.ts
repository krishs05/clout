export interface User {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  goodDeeds: number;
  badDeeds: number;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Server {
  id: string;
  discordId: string;
  name: string;
  icon: string | null;
  ownerId: string;
  settings: ServerSettings;
  embedConfig: EmbedConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerSettings {
  economyEnabled: boolean;
  dailyReward: number;
  gamesEnabled: boolean;
  musicEnabled: boolean;
  aiChatEnabled: boolean;
  aiPersonality: 'balanced' | 'roast' | 'compliment';
  customCommandsEnabled: boolean;
  prefix: string;
}

export interface EmbedConfig {
  color: string;
  title: string;
  description: string;
  thumbnail: string | null;
  image: string | null;
  footer: string;
  showDeedsRatio: boolean;
  showBalance: boolean;
  fields: EmbedField[];
}

export interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

export interface CustomCommand {
  id: string;
  serverId: string;
  name: string;
  description: string;
  response: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'daily' | 'transfer_in' | 'transfer_out' | 'game_win' | 'game_loss';
  amount: number;
  reason: string;
  fromUserId?: string;
  toUserId?: string;
  createdAt: Date;
}

export interface ChatHistory {
  id: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
}

export interface BotStatus {
  online: boolean;
  uptime: number;
  guilds: number;
  users: number;
  commands: number;
  websocketPing: number;
  memoryUsage: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}