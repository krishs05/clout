import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, EmbedBuilder } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';
import play from 'play-dl';
import { queues, GuildQueue } from '../utils/music.js';

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube')
    .addStringOption(option =>
        option.setName('query')
            .setDescription('The song name or URL')
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString('query', true);
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
        return interaction.reply({ content: 'You must be in a voice channel to play music.', ephemeral: true });
    }

    if (!interaction.guildId || !interaction.channel) {
        return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
        let queue = queues.get(interaction.guildId);

        if (!queue) {
            queue = new GuildQueue(interaction.channel);
            queues.set(interaction.guildId, queue);
        }

        if (!queue.connection) {
            queue.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild!.voiceAdapterCreator as any,
            });
        }

        const searchResult = await play.search(query, { limit: 1 });

        if (!searchResult || searchResult.length === 0) {
            return interaction.editReply({ content: 'No results found for that query.' });
        }

        const video = searchResult[0];
        const song = {
            title: video.title ?? 'Unknown Title',
            url: video.url,
            duration: video.durationRaw,
            requestedBy: interaction.user.tag,
        };

        queue.songs.push(song);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Song Added to Queue')
            .setDescription(`[${song.title}](${song.url})`)
            .addFields(
                { name: 'Duration', value: song.duration, inline: true },
                { name: 'Position in Queue', value: `${queue.songs.length}`, inline: true }
            )
            .setThumbnail(video.thumbnails[0]?.url ?? null)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        if (!queue.playing) {
            queue.playNext();
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'An error occurred while trying to play the song.' });
    }
}
