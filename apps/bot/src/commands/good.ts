import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js';
import { prisma } from '@clout/database';

export const data = new SlashCommandBuilder()
  .setName('good')
  .setDescription('Record a good deed')
  .addStringOption(option =>
    option
      .setName('deed')
      .setDescription('What good deed did you do?')
      .setRequired(true)
      .setMaxLength(500)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const deed = interaction.options.getString('deed', true);
  
  await interaction.deferReply();

  try {
    // Upsert user and increment good deeds
    const user = await prisma.user.upsert({
      where: { discordId: interaction.user.id },
      update: { 
        goodDeeds: { increment: 1 },
        username: interaction.user.username,
        avatar: interaction.user.avatarURL(),
      },
      create: {
        discordId: interaction.user.id,
        username: interaction.user.username,
        avatar: interaction.user.avatarURL(),
        goodDeeds: 1,
        badDeeds: 0,
        balance: 0,
      },
    });

    // Calculate karma ratio
    const totalDeeds = user.goodDeeds + user.badDeeds;
    const karmaRatio = totalDeeds > 0 
      ? ((user.goodDeeds / totalDeeds) * 100).toFixed(1)
      : '100.0';

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✨ Good Deed Recorded!')
      .setDescription(`**${interaction.user.username}** did something good!`)
      .addFields(
        { name: '📝 Deed', value: deed, inline: false },
        { name: '📊 Stats', value: 
          `Good: ${user.goodDeeds} | Bad: ${user.badDeeds}\n` +
          `Karma: ${karmaRatio}% positive`, inline: false }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error recording good deed:', error);
    await interaction.editReply({ 
      content: '❌ Failed to record your good deed. Please try again.' 
    });
  }
}