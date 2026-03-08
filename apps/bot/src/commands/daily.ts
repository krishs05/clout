import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '@clout/database';
import { createEmbed } from '../utils/embed.js';

const DAILY_REWARD = 100;
const COOLDOWN_HOURS = 24;

export const data = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('Claim your daily coin reward');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    // Get or create user
    let user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    });

    if (!user) {
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
    }

    // Check cooldown
    const now = new Date();
    if (user.lastDailyAt) {
      const hoursSinceLastDaily = (now.getTime() - user.lastDailyAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastDaily < COOLDOWN_HOURS) {
        const hoursRemaining = COOLDOWN_HOURS - hoursSinceLastDaily;
        const minutesRemaining = Math.ceil(hoursRemaining * 60);

        return interaction.editReply({
          content: `⏰ You've already claimed your daily reward! Come back in ${minutesRemaining} minutes.`
        });
      }
    }

    // Update user balance and last daily
    const updatedUser = await prisma.user.update({
      where: { discordId: interaction.user.id },
      data: {
        balance: { increment: DAILY_REWARD },
        lastDailyAt: now,
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'DAILY',
        amount: DAILY_REWARD,
        reason: 'Daily reward claimed',
      },
    });

    const embed = createEmbed()
      .setColor('#00FF00')
      .setTitle('💰 Daily Reward Claimed!')
      .setDescription(`You received **${DAILY_REWARD}** coins!`)
      .addFields(
        { name: 'New Balance', value: `${updatedUser.balance.toLocaleString()} coins`, inline: true },
        { name: 'Next Claim', value: '24 hours from now', inline: true }
      )
      .setThumbnail(interaction.user.displayAvatarURL());

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error claiming daily:', error);
    await interaction.editReply({
      content: '❌ Failed to claim daily reward. Please try again.'
    });
  }
}