import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '@clout/database';
import { createEmbed } from '../utils/embed.js';

const choices = ['rock', 'paper', 'scissors'] as const;
const emojis: Record<string, string> = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️'
};

export const data = new SlashCommandBuilder()
  .setName('rps')
  .setDescription('Play Rock Paper Scissors')
  .addStringOption(option =>
    option
      .setName('choice')
      .setDescription('Your choice')
      .setRequired(true)
      .addChoices(
        { name: '🪨 Rock', value: 'rock' },
        { name: '📄 Paper', value: 'paper' },
        { name: '✂️ Scissors', value: 'scissors' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const playerChoice = interaction.options.getString('choice', true);
  const botChoice = choices[Math.floor(Math.random() * choices.length)];

  await interaction.deferReply();

  // Determine winner
  let result: 'win' | 'lose' | 'tie';

  if (playerChoice === botChoice) {
    result = 'tie';
  } else if (
    (playerChoice === 'rock' && botChoice === 'scissors') ||
    (playerChoice === 'paper' && botChoice === 'rock') ||
    (playerChoice === 'scissors' && botChoice === 'paper')
  ) {
    result = 'win';
  } else {
    result = 'lose';
  }

  // Calculate reward/penalty
  const reward = 25;
  let balanceChange = 0;

  if (result === 'win') {
    balanceChange = reward;
  } else if (result === 'lose') {
    balanceChange = -10;
  }

  // Update database
  const user = await prisma.user.upsert({
    where: { discordId: interaction.user.id },
    update: {
      balance: { increment: balanceChange },
      username: interaction.user.username,
    },
    create: {
      discordId: interaction.user.id,
      username: interaction.user.username,
      avatar: interaction.user.avatarURL(),
      goodDeeds: 0,
      badDeeds: 0,
      balance: Math.max(0, balanceChange),
    },
  });

  if (balanceChange !== 0) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: result === 'win' ? 'GAME_WIN' : 'GAME_LOSS',
        amount: balanceChange,
        reason: `Rock Paper Scissors - ${result}`,
      },
    });
  }

  const resultColors = {
    win: 0x00FF00,
    lose: 0xFF0000,
    tie: 0x808080
  };

  const resultTexts = {
    win: `🎉 You win! +${reward} coins`,
    lose: `😔 You lose! -10 coins`,
    tie: `🤝 It's a tie!`
  };

  const embed = createEmbed()
    .setColor(resultColors[result])
    .setTitle('🎮 Rock Paper Scissors')
    .addFields(
      { name: 'You', value: `${emojis[playerChoice]} ${playerChoice.charAt(0).toUpperCase() + playerChoice.slice(1)}`, inline: true },
      { name: 'Bot', value: `${emojis[botChoice]} ${botChoice.charAt(0).toUpperCase() + botChoice.slice(1)}`, inline: true },
      { name: 'Result', value: resultTexts[result], inline: false },
      { name: 'Balance', value: `${user.balance.toLocaleString()} coins`, inline: false }
    );

  await interaction.editReply({ embeds: [embed] });
}