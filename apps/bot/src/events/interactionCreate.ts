import { Events, ChatInputCommandInteraction, Collection } from 'discord.js';
import { CloutClient } from '../index';

const COOLDOWN_SECONDS = 3;

export const name = Events.InteractionCreate;

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.isChatInputCommand()) return;

  const client = interaction.client as CloutClient;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  // Cooldown check
  const { cooldowns } = client;
  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.data.name)!;
  const defaultCooldownDuration = COOLDOWN_SECONDS * 1000;
  const cooldownAmount = (command.cooldown ?? defaultCooldownDuration);

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

    if (now < expirationTime) {
      const expiredTimestamp = Math.round(expirationTime / 1000);
      return interaction.reply({ 
        content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, 
        ephemeral: true 
      });
    }
  }

  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

  // Execute command
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const errorMessage = { 
      content: 'There was an error executing this command!', 
      ephemeral: true 
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}