import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '@clout/database';
import { createEmbed } from '../utils/embed';

export const data = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('Check your or someone else\'s coin balance')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('User to check (defaults to you)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser('user') || interaction.user;

  await interaction.deferReply();

  try {
    let user = await prisma.user.findUnique({
      where: { discordId: targetUser.id },
    });

    if (!user) {
      if (targetUser.id === interaction.user.id) {
        user = await prisma.user.create({
          data: {
            discordId: interaction.user.id,
            username: interaction.user.username,
            avatar: interaction.user.avatarURL(),
            goodDeeds: 0,
            badDeeds: 0,
            balance: 0,
          },
        });
      } else {
        return interaction.editReply({
          content: `❌ ${targetUser.username} doesn't have a Clout profile yet.`
        });
      }
    }

    // Get rank
    const higherBalance = await prisma.user.count({
      where: { balance: { gt: user.balance } }
    });
    const rank = higherBalance + 1;

    const embed = createEmbed()
      .setColor('#FFD700')
      .setTitle('💰 Balance')
      .setDescription(targetUser.id === interaction.user.id
        ? `You have **${user.balance.toLocaleString()}** coins`
        : `**${targetUser.username}** has **${user.balance.toLocaleString()}** coins`
      )
      .addFields(
        { name: '🏆 Rank', value: `#${rank}`, inline: true },
        { name: '📊 Total Earned', value: 'Coming soon...', inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL());

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error checking balance:', error);
    await interaction.editReply({
      content: '❌ Failed to check balance. Please try again.'
    });
  }
}