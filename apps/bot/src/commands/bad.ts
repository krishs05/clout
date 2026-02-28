import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { prisma } from '@clout/database';

export const data = new SlashCommandBuilder()
  .setName('bad')
  .setDescription('Record a bad deed (be honest!)')
  .addStringOption(option =>
    option
      .setName('deed')
      .setDescription('What did you do?')
      .setRequired(true)
      .setMaxLength(500)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const deed = interaction.options.getString('deed', true);
  
  await interaction.deferReply();

  try {
    // Upsert user and increment bad deeds
    const user = await prisma.user.upsert({
      where: { discordId: interaction.user.id },
      update: { 
        badDeeds: { increment: 1 },
        username: interaction.user.username,
        avatar: interaction.user.avatarURL(),
      },
      create: {
        discordId: interaction.user.id,
        username: interaction.user.username,
        avatar: interaction.user.avatarURL(),
        goodDeeds: 0,
        badDeeds: 1,
        balance: 0,
      },
    });

    // Calculate karma ratio
    const totalDeeds = user.goodDeeds + user.badDeeds;
    const karmaRatio = totalDeeds > 0 
      ? ((user.goodDeeds / totalDeeds) * 100).toFixed(1)
      : '0.0';

    // Roast messages based on bad deed count
    const roasts = [
      "Well, at least you're honest...",
      "That's not very clout of you.",
      "Your karma is crying right now.",
      "Someone's going on the naughty list!",
      "Yikes. Hope that was worth it.",
    ];
    const roast = roasts[Math.min(user.badDeeds - 1, roasts.length - 1)] || roasts[roasts.length - 1];

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('😈 Bad Deed Recorded')
      .setDescription(`**${interaction.user.username}** fessed up!`)
      .addFields(
        { name: '📝 The Deed', value: deed, inline: false },
        { name: '💬 The Verdict', value: roast, inline: false },
        { name: '📊 Karma Status', value: 
          `Good: ${user.goodDeeds} | Bad: ${user.badDeeds}\n` +
          `${karmaRatio}% positive`, inline: false }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error recording bad deed:', error);
    await interaction.editReply({ 
      content: '❌ Failed to record your bad deed. Please try again.' 
    });
  }
}