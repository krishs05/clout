import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { createEmbed } from '../utils/embed.js';

const triviaQuestions = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correct: 2 // Paris
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: 1 // Mars
  },
  {
    question: "What is 2 + 2 × 2?",
    options: ["6", "8", "4", "10"],
    correct: 0 // 6
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Michelangelo"],
    correct: 2 // Da Vinci
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correct: 3 // Pacific
  },
  {
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correct: 2 // 1945
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correct: 2 // Au
  },
  {
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correct: 2 // 7
  },
  {
    question: "What is the speed of light?",
    options: ["300,000 km/s", "150,000 km/s", "400,000 km/s", "250,000 km/s"],
    correct: 0 // 300,000 km/s
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correct: 1 // Shakespeare
  }
];

export const data = new SlashCommandBuilder()
  .setName('trivia')
  .setDescription('Test your knowledge with a trivia question');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  // Select random question
  const question = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];

  // Create options text
  const optionsText = question.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n');

  const embed = createEmbed()
    .setColor('#9B59B6')
    .setTitle('🧠 Trivia Time!')
    .setDescription(`${question.question}\n\n${optionsText}\n\n*Reply with A, B, C, or D within 30 seconds!*`)
    .setFooter({ text: 'Win 50 coins for correct answer!' });

  await interaction.editReply({ embeds: [embed] });

  // Wait for answer
  const filter = (m: any) => {
    const content = m.content.toUpperCase().trim();
    return m.author.id === interaction.user.id && ['A', 'B', 'C', 'D'].includes(content);
  };

  try {
    const collected = await (interaction.channel as any)?.awaitMessages({
      filter,
      max: 1,
      time: 30000,
      errors: ['time']
    });

    if (!collected) return;

    const answer = collected.first()?.content.toUpperCase().trim();
    const answerIndex = answer ? answer.charCodeAt(0) - 65 : -1;
    const isCorrect = answerIndex === question.correct;

    if (isCorrect) {
      // Award coins
      const { prisma } = await import('@clout/database');
      const user = await prisma.user.upsert({
        where: { discordId: interaction.user.id },
        update: {
          balance: { increment: 50 },
          username: interaction.user.username,
        },
        create: {
          discordId: interaction.user.id,
          username: interaction.user.username,
          avatar: interaction.user.avatarURL(),
          goodDeeds: 0,
          badDeeds: 0,
          balance: 50,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'GAME_WIN',
          amount: 50,
          reason: 'Trivia correct answer',
        },
      });

      await interaction.followUp({
        content: `✅ **Correct!** The answer was **${question.options[question.correct]}**. You won **50** coins! Your balance: ${user.balance.toLocaleString()} coins`
      });
    } else {
      await interaction.followUp({
        content: `❌ **Wrong!** The correct answer was **${question.options[question.correct]}**. Better luck next time!`
      });
    }

  } catch {
    await interaction.followUp({
      content: `⏰ **Time's up!** The correct answer was **${question.options[question.correct]}**.`
    });
  }
}