import { Events, Client } from 'discord.js';

export const name = Events.ClientReady;
export const once = true;

export function execute(client: Client) {
  console.log(`✅ Ready! Logged in as ${client.user?.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
  
  // Set bot activity
  client.user?.setActivity('/help | clout.bot', { type: 4 }); // Custom status
}