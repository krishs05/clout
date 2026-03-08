import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from 'discord.js';
import { createEmbed } from '../utils/embed.js';

export const data = new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages at once')
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('Number of messages to delete (1-100)')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('amount', true);

    if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
        return interaction.reply({ content: 'This command can only be used in text channels.', ephemeral: true });
    }

    try {
        const messages = await interaction.channel.bulkDelete(amount, true);

        const embed = createEmbed()
            .setColor('#00FF00')
            .setDescription(`🧹 Successfully deleted **${messages.size}** messages.`);

        const reply = await interaction.reply({ embeds: [embed], fetchReply: true });

        // Cleanup reply after 3 seconds
        setTimeout(() => {
            reply.delete().catch(() => null);
        }, 3000);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'An error occurred while trying to purge messages. Note: I can only delete messages younger than 14 days.', ephemeral: true });
    }
}
