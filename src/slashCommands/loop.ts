import { SlashCommandBuilder } from 'discord.js';
import { QueueRepeatMode } from 'discord-player';
import type { SlashCommand } from '../types';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Sets loop mode for bot')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Select loop type')
        .setRequired(true)
        .addChoices(
          { name: 'Whole queue', value: 'queue' },
          { name: 'Current or next song', value: 'track' },
          { name: 'Off', value: 'off' },
        ),
    ),
  execute: (interaction) => {
    if (!interaction.guildId) {
      interaction.reply('This command can only be used in a server.');
      return;
    }

    const guildQueue = interaction.client.player.queues.get(interaction.guildId);

    const type = interaction.options.getString('type');

    let repeatMode: QueueRepeatMode = 0;

    switch (type) {
      case 'queue':
        repeatMode = QueueRepeatMode.QUEUE;
        break;
      case 'track':
        repeatMode = QueueRepeatMode.TRACK;
        break;
      case 'off':
        repeatMode = QueueRepeatMode.OFF;
        break;
      default:
        break;
    }

    guildQueue?.setRepeatMode(repeatMode);

    interaction.reply(`Repeat mode is now: ${type}`);
  },
  cooldown: 10,
};

export default command;
