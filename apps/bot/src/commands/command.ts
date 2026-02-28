import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { prisma } from '@clout/database';

export const data = new SlashCommandBuilder()
  .setName('command')
  .setDescription('Manage custom commands')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a custom command')
      .addStringOption(option =>
        option.setName('name').setDescription('Command name').setRequired(true))
      .addStringOption(option =>
        option.setName('response').setDescription('What the bot will say').setRequired(true))
      .addStringOption(option =>
        option.setName('description').setDescription('Command description').setRequired(false))
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('delete')
      .setDescription('Delete a custom command')
      .addStringOption(option =>
        option.setName('name').setDescription('Command name to delete').setRequired(true))
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('List all custom commands'));

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply({ content: '❌ This command can only be used in servers.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  // Get or create server
  let server = await prisma.server.findUnique({
    where: { discordId: guildId },
  });

  if (!server) {
    server = await prisma.server.create({
      data: {
        discordId: guildId,
        name: interaction.guild?.name || 'Unknown',
        icon: interaction.guild?.iconURL(),
        ownerId: interaction.guild?.ownerId || '',
      },
    });
  }

  if (subcommand === 'create') {
    const name = interaction.options.getString('name', true).toLowerCase();
    const response = interaction.options.getString('response', true);
    const description = interaction.options.getString('description') || 'Custom command';

    // Check if command already exists
    const existing = await prisma.customCommand.findUnique({
      where: { serverId_name: { serverId: server.id, name } },
    });

    if (existing) {
      return interaction.editReply({ content: `❌ Command \`${name}\` already exists. Delete it first.` });
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    });

    if (!user) {
      user = await prisma.user.create({
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

    await prisma.customCommand.create({
      data: {
        serverId: server.id,
        name,
        description,
        response,
        createdBy: user.id,
      },
    });

    return interaction.editReply({ 
      content: `✅ Custom command \`/${name}\` created!\n\n**Description:** ${description}\n**Response:** ${response}` 
    });

  } else if (subcommand === 'delete') {
    const name = interaction.options.getString('name', true).toLowerCase();

    const command = await prisma.customCommand.findUnique({
      where: { serverId_name: { serverId: server.id, name } },
    });

    if (!command) {
      return interaction.editReply({ content: `❌ Command \`${name}\` not found.` });
    }

    await prisma.customCommand.delete({
      where: { id: command.id },
    });

    return interaction.editReply({ content: `✅ Custom command \`/${name}\` deleted.` });

  } else if (subcommand === 'list') {
    const commands = await prisma.customCommand.findMany({
      where: { serverId: server.id },
      include: { creator: true },
    });

    if (commands.length === 0) {
      return interaction.editReply({ content: '📋 No custom commands in this server. Use `/command create` to add one.' });
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📋 Custom Commands')
      .setDescription(commands.map(cmd => 
        `\`/${cmd.name}\` - ${cmd.description}\nCreated by: ${cmd.creator.username}`
      ).join('\n\n'))
      .setFooter({ text: `${commands.length} command${commands.length !== 1 ? 's' : ''}` })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
}