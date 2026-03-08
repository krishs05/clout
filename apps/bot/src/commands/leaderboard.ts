import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '@clout/database';
import { createEmbed } from '../utils/embed.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('View the top coin holders');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { balance: 'desc' },
      take: 10,
    });

    if (topUsers.length === 0) {
      return interaction.editReply({
        content: '📊 No one has any coins yet! Be the first to claim `/daily`!'
      });
    }

    // Find user's rank
    const userRank = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    }).then(async (user) => {
      if (!user) return null;
      const rank = await prisma.user.count({
        where: { balance: { gt: user.balance } }
      });
      return { rank: rank + 1, balance: user.balance };
    });

    const medals = ['🥇', '🥈', '🥉'];

    const description = topUsers.map((user, index) => {
      const medal = medals[index] || `\`${(index + 1).toString().padStart(2, '0')}\``;
      return `${medal} **${user.username}** — ${user.balance.toLocaleString()} coins`;
    }).join('\n');

    const embed = createEmbed()
      .setColor('#FFD700')
      .setTitle('🏆 Clout Leaderboard')
      .setDescription(description);

    if (userRank) {
      embed.setFooter({
        text: `Your rank: #${userRank.rank} with ${userRank.balance.toLocaleString()} coins`
      });
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    await interaction.editReply({
      content: '❌ Failed to load leaderboard. Please try again.'
    });
  }
}