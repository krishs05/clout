import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { prisma } from '@clout/database';

export const data = new SlashCommandBuilder()
  .setName('guess')
  .setDescription('Guess the number (1-10) and win coins!')
  .addIntegerOption(option =>
    option
      .setName('number')
      .setDescription('Your guess (1-10)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(10)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guess = interaction.options.getInteger('number', true);
  const secretNumber = Math.floor(Math.random() * 10) + 1;
  
  await interaction.deferReply();

  const isCorrect = guess === secretNumber;
  const reward = 100;
  const closeReward = 20;
  
  // Check if close (within 1)
  const isClose = Math.abs(guess - secretNumber) === 1;
  
  let balanceChange = 0;
  let resultText = '';

  if (isCorrect) {
    balanceChange = reward;
    resultText = `🎉 **JACKPOT!** The number was **${secretNumber}**! You win **${reward}** coins!`;
  } else if (isClose) {
    balanceChange = closeReward;
    resultText = `👏 **Close!** You guessed ${guess}, the number was **${secretNumber}**. You still get **${closeReward}** coins!`;
  } else {
    balanceChange = -5;
    resultText = `❌ **Wrong!** You guessed ${guess}, but the number was **${secretNumber}**. You lose 5 coins.`;
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

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: isCorrect || isClose ? 'GAME_WIN' : 'GAME_LOSS',
      amount: balanceChange,
      reason: `Guess the number - ${isCorrect ? 'correct' : isClose ? 'close' : 'wrong'}`,
    },
  });

  const embedColor = isCorrect ? 0x00FF00 : isClose ? 0xFFA500 : 0xFF0000;

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle('🎲 Guess the Number')
    .setDescription(resultText)
    .addFields(
      { name: 'Your Guess', value: guess.toString(), inline: true },
      { name: 'Secret Number', value: secretNumber.toString(), inline: true },
      { name: 'Balance', value: `${user.balance.toLocaleString()} coins`, inline: false }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}