import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { queues } from '../utils/music.js';

export const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the currently playing song');

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) return;

    const queue = queues.get(interaction.guildId);

    if (!queue || !queue.playing) {
        return interaction.reply({ content: 'There is no song currently playing.', ephemeral: true });
    }

    queue.player.stop();
    await interaction.reply({ content: '⏭️ Skipped the current song.' });
}
