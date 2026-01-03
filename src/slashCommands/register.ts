import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { guilds } from 'src/lib/db/services';
import type { SlashCommand } from '../types';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Registers music channel')
    .addChannelOption((channel) => {
      return channel
        .setName('channel')
        .setDescription('Channel you want to use only for music requests')
        .setRequired(true);
    }),
  execute: async (interaction, data) => {
    if (interaction.user.id !== data.owner_id) {
      return interaction.reply('You do not have permissions to perform this action');
    }

    if (!interaction.guildId || !interaction.channelId) {
      return interaction.reply('This command can only be used in a server');
    }

    await guilds.updateGuildMusicChannel(interaction.guildId, interaction.channelId);

    const embedMessage = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('Paskan musiikin lista')
      .setDescription('Tässä näet listan paskasta musiikista')
      .addFields(
        {
          name: 'Now playing',
          value: 'Pelaamisen &ääniä',
          inline: false,
        },
        { name: '\u200B', value: '\u200B', inline: false },
        {
          name: 'Queue',
          value: 'Täällä on hiljaista.',
          inline: false,
        },
      );

    const confirm = new ButtonBuilder()
      .setCustomId('skip')
      .setLabel('Skip current song')
      .setStyle(ButtonStyle.Secondary);

    const cancel = new ButtonBuilder()
      .setCustomId('modify-queue')
      .setLabel('Modify queue')
      .setStyle(ButtonStyle.Secondary);

    const ullatus = new ButtonBuilder().setCustomId('ullatus').setLabel('Nappi').setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(cancel, confirm, ullatus);

    const message = await interaction.reply({
      embeds: [embedMessage],
      components: [row],
    });

    await guilds.updateGuildMessageId(interaction.guildId, message?.id);

    await interaction.reply('Music channel registered');

    await interaction.deleteReply();
  },
};

export default command;
