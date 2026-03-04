import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '@clout/database';
import { createEmbed } from '../utils/embed';

export const data = new SlashCommandBuilder()
  .setName('pay')
  .setDescription('Send coins to another user')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('User to pay')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('amount')
      .setDescription('Amount to send')
      .setRequired(true)
      .setMinValue(1)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const recipient = interaction.options.getUser('user', true);
  const amount = interaction.options.getInteger('amount', true);

  await interaction.deferReply();

  // Prevent paying yourself
  if (recipient.id === interaction.user.id) {
    return interaction.editReply({
      content: '❌ You can\'t pay yourself!'
    });
  }

  try {
    // Get sender
    let sender = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    });

    if (!sender) {
      sender = await prisma.user.create({
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

    // Check balance
    if (sender.balance < amount) {
      return interaction.editReply({
        content: `❌ You don't have enough coins! Your balance: **${sender.balance.toLocaleString()}** coins`
      });
    }

    // Get or create recipient
    let recipientUser = await prisma.user.findUnique({
      where: { discordId: recipient.id },
    });

    if (!recipientUser) {
      recipientUser = await prisma.user.create({
        data: {
          discordId: recipient.id,
          username: recipient.username,
          avatar: recipient.avatarURL(),
          goodDeeds: 0,
          badDeeds: 0,
          balance: 0,
        },
      });
    }

    // Perform transfer
    const [updatedSender, updatedRecipient] = await prisma.$transaction([
      prisma.user.update({
        where: { discordId: interaction.user.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.user.update({
        where: { discordId: recipient.id },
        data: { balance: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId: sender.id,
          type: 'TRANSFER_OUT',
          amount: -amount,
          reason: `Paid ${recipient.username}`,
          toUserId: recipientUser.id,
        },
      }),
      prisma.transaction.create({
        data: {
          userId: recipientUser.id,
          type: 'TRANSFER_IN',
          amount: amount,
          reason: `Received from ${interaction.user.username}`,
          fromUserId: sender.id,
        },
      }),
    ]);

    const embed = createEmbed()
      .setColor('#00FF00')
      .setTitle('💸 Payment Sent!')
      .setDescription(`You sent **${amount.toLocaleString()}** coins to **${recipient.username}**`)
      .addFields(
        { name: 'Your New Balance', value: `${updatedSender.balance.toLocaleString()} coins`, inline: true },
        { name: `${recipient.username}'s Balance`, value: `${updatedRecipient.balance.toLocaleString()} coins`, inline: true }
      )
      .setThumbnail(recipient.displayAvatarURL());

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error processing payment:', error);
    await interaction.editReply({
      content: '❌ Failed to process payment. Please try again.'
    });
  }
}