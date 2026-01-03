import { SlashCommandBuilder } from 'discord.js';
import { bannedUrls, bannedWords } from 'src/lib/db/services';
import { ytdlService } from 'src/lib/ytdl';
import type { SlashCommand } from '../types';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans url or keywords')
    .addStringOption((option) => option.setName('keywords').setDescription('Give keywords or link').setRequired(true)),
  execute: async (interaction) => {
    if (
      !['247819946522968074', '250682869297446922', '239086506252173314', '190912995180806145'].includes(
        interaction.user.id,
      )
    ) {
      return interaction.reply('HOMO HOMO HOMO :DDDDD');
    }

    const keyword = interaction.options.getString('keywords') as string;

    let youtubeId = null;

    try {
      youtubeId = ytdlService.getVideoID(keyword);
    } catch {}

    if (youtubeId) {
      await bannedUrls.deleteBannedUrl(youtubeId);

      return interaction.reply('This video is now unbanned');
    }

    if (!interaction.guildId) {
      return interaction.reply('This command can only be used in a server');
    }

    const result = await bannedWords.deleteBannedWord(interaction.guildId, keyword);

    interaction.reply(`Removed ${result.length} entries from database with keyword: ${keyword}`);
  },
};

export default command;
