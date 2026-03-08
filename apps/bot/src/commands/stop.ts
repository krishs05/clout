import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { queues } from '../utils/music.js';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playing music and clear the queue');

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) return;

    const queue = queues.get(interaction.guildId);

    if (!queue) {
        return interaction.reply({ content: 'There is no music playing in this server.', ephemeral: true });
    }

    queue.stop();
    queues.delete(interaction.guildId);

    await interaction.reply({ content: '🛑 Stopped playing music and cleared the queue. Disconnecting from voice channel.' });
}
