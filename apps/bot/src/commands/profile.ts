import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, User } from 'discord.js';
import { prisma } from '@clout/database';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('View your or someone else\'s Clout profile')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('User to view (defaults to you)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser('user') || interaction.user;
  
  await interaction.deferReply();

  try {
    // Get user from database
    let user = await prisma.user.findUnique({
      where: { discordId: targetUser.id },
    });

    // If user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          discordId: targetUser.id,
          username: targetUser.username,
          avatar: targetUser.avatarURL(),
          goodDeeds: 0,
          badDeeds: 0,
          balance: 0,
        },
      });
    }

    // Calculate stats
    const totalDeeds = user.goodDeeds + user.badDeeds;
    const karmaRatio = totalDeeds > 0 
      ? ((user.goodDeeds / totalDeeds) * 100).toFixed(1)
      : '50.0';

    // Determine clout level based on karma
    let cloutLevel = 'Neutral';
    let cloutColor = 0x808080;
    let cloutEmoji = '😐';

    const ratio = parseFloat(karmaRatio);
    if (ratio >= 80) {
      cloutLevel = 'Legendary';
      cloutColor = 0xFFD700;
      cloutEmoji = '👑';
    } else if (ratio >= 60) {
      cloutLevel = 'Respected';
      cloutColor = 0x00FF00;
      cloutEmoji = '✨';
    } else if (ratio >= 40) {
      cloutLevel = 'Neutral';
      cloutColor = 0x808080;
      cloutEmoji = '😐';
    } else if (ratio >= 20) {
      cloutLevel = 'Sus';
      cloutColor = 0xFFA500;
      cloutEmoji = '😬';
    } else {
      cloutLevel = 'Villain';
      cloutColor = 0xFF0000;
      cloutEmoji = '🔥';
    }

    // Get rank on leaderboard
    const higherBalance = await prisma.user.count({
      where: { balance: { gt: user.balance } }
    });
    const rank = higherBalance + 1;

    const embed = new EmbedBuilder()
      .setColor(cloutColor)
      .setTitle(`${cloutEmoji} ${targetUser.username}'s Clout Profile`)
      .setDescription(`**Clout Level:** ${cloutLevel}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        { 
          name: '📊 Karma', 
          value: `${user.goodDeeds} good | ${user.badDeeds} bad\n${karmaRatio}% positive`, 
          inline: true 
        },
        { 
          name: '💰 Balance', 
          value: `${user.balance.toLocaleString()} coins\nRank #${rank}`, 
          inline: true 
        },
        { 
          name: '📅 Joined', 
          value: `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>`, 
          inline: true 
        }
      )
      .setFooter({ text: 'Use /good and /bad to record deeds!' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error fetching profile:', error);
    await interaction.editReply({ 
      content: '❌ Failed to load profile. Please try again.' 
    });
  }
}