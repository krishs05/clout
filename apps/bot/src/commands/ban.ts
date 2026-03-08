import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { prisma } from '@clout/database';
import { createEmbed } from '../utils/embed.js';

async function ensureServerAndRecord(guildId: string, guildName: string, ownerId: string, action: string, targetUserId: string, targetUsername: string, moderatorUserId: string, moderatorUsername: string, reason: string | null) {
  let server = await prisma.server.findUnique({ where: { discordId: guildId } });
  if (!server) {
    server = await prisma.server.create({
      data: { discordId: guildId, name: guildName, ownerId },
    });
  }
  await (prisma as any).moderationEvent.create({
    data: {
      serverId: server.id,
      action,
      targetUserId,
      targetUsername,
      moderatorUserId,
      moderatorUsername,
      reason,
    },
  });
}

export const data = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The member to ban')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the ban')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!targetUser) return interaction.reply({ content: 'Invalid user', ephemeral: true });

    const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

    if (member && !member.bannable) {
        return interaction.reply({ content: 'I cannot ban this user. They may have higher permissions than me.', ephemeral: true });
    }

    try {
        if (member) {
            await member.send(`You have been banned from **${interaction.guild?.name}**.\nReason: ${reason}`).catch(() => null);
        }
        await interaction.guild?.members.ban(targetUser, { reason });

        if (interaction.guild) {
            await ensureServerAndRecord(
                interaction.guild.id,
                interaction.guild.name,
                interaction.guild.ownerId ?? interaction.user.id,
                'ban',
                targetUser.id,
                targetUser.username,
                interaction.user.id,
                interaction.user.username,
                reason
            ).catch(() => {});
        }

        const embed = createEmbed()
            .setColor('#FF0000')
            .setTitle('User Banned')
            .setDescription(`🔨 **${targetUser.tag}** has been banned.\n**Reason:** ${reason}`);

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'An error occurred while trying to ban this user.', ephemeral: true });
    }
}
