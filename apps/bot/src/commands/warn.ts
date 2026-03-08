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
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The member to warn')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the warning')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('target', true);
    const reason = interaction.options.getString('reason', true);

    const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
        return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
    }

    try {
        await member.send(`⚠️ You have received a warning in **${interaction.guild?.name}**.\n**Reason:** ${reason}`).catch(() => null);

        if (interaction.guild) {
            await ensureServerAndRecord(
                interaction.guild.id,
                interaction.guild.name,
                interaction.guild.ownerId ?? interaction.user.id,
                'warn',
                targetUser.id,
                targetUser.username,
                interaction.user.id,
                interaction.user.username,
                reason
            ).catch(() => {});
        }

        const embed = createEmbed()
            .setColor('#FFFF00')
            .setTitle('User Warned')
            .setDescription(`⚠️ **${targetUser.tag}** has been warned.\n**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}`);

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'An error occurred while trying to warn this user.', ephemeral: true });
    }
}
