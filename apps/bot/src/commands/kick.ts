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
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The member to kick')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the kick')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!targetUser) return interaction.reply({ content: 'Invalid user', ephemeral: true });

    const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
        return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
    }

    if (!member.kickable) {
        return interaction.reply({ content: 'I cannot kick this user. They may have higher permissions than me.', ephemeral: true });
    }

    try {
        await member.send(`You have been kicked from **${interaction.guild?.name}**.\nReason: ${reason}`).catch(() => null);
        await member.kick(reason);

        if (interaction.guild) {
            await ensureServerAndRecord(
                interaction.guild.id,
                interaction.guild.name,
                interaction.guild.ownerId ?? interaction.user.id,
                'kick',
                targetUser.id,
                targetUser.username,
                interaction.user.id,
                interaction.user.username,
                reason
            ).catch(() => {});
        }

        const embed = createEmbed()
            .setColor('#FFA500')
            .setTitle('User Kicked')
            .setDescription(`✅ **${targetUser.tag}** has been kicked.\n**Reason:** ${reason}`);

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'An error occurred while trying to kick this user.', ephemeral: true });
    }
}
