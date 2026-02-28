import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('View all available commands');

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🎯 Clout Bot - Commands')
    .setDescription('Track your deeds, earn coins, and climb the leaderboard!')
    .addFields(
      {
        name: '📊 Deeds',
        value: 
          '`/good <deed>` - Record a good deed\n' +
          '`/bad <deed>` - Record a bad deed\n' +
          '`/profile [@user]` - View your Clout profile',
        inline: false
      },
      {
        name: '💰 Economy',
        value:
          '`/daily` - Claim daily reward (100 coins)\n' +
          '`/balance [@user]` - Check coin balance\n' +
          '`/pay @user <amount>` - Send coins\n' +
          '`/leaderboard` - Top 10 richest users',
        inline: false
      },
      {
        name: '🎮 Games',
        value:
          '`/trivia` - Answer trivia for 50 coins\n' +
          '`/rps <choice>` - Rock Paper Scissors\n' +
          '`/guess <1-10>` - Guess the number',
        inline: false
      },
      {
        name: '⚙️ Admin',
        value:
          '`/command create <name> <response>` - Add custom command\n' +
          '`/command delete <name>` - Remove custom command\n' +
          '`/command list` - View custom commands',
        inline: false
      }
    )
    .setFooter({ text: 'Clout Bot - Your karma, your currency' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}