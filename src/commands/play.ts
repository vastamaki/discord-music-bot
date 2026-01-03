import type { TextChannel } from 'discord.js';
import { type GuildQueue, GuildQueuePlayerNode } from 'discord-player';
import { bannedUrls, bannedWords, playHistory } from 'src/lib/db/services';
import { ytdlService } from 'src/lib/ytdl';
import type { Command } from '../types';

const command: Command = {
  name: 'play',
  aliases: ['p'],
  permissions: [],
  execute: async (message, args) => {
    const voiceChannelId = message.member?.voice.channel?.id;

    if (!voiceChannelId) {
      return message.reply('Please join to voice channel before using this command');
    }

    const search = args.slice(1).join(' ');

    if (!search) {
      return message.reply('No search or url provided :(');
    }

    await message.delete();

    if (!message.guild) return;

    const queue = message.client.player.queues.create(message.guild);
    if (!queue.connection) queue.connect(voiceChannelId);

    const guildQueue = new GuildQueuePlayerNode(queue as GuildQueue);

    const isUrl = ytdlService.validateURL(search);

    // If not a URL, search YouTube first to get a direct link
    let searchQuery = search;
    if (!isUrl) {
      const youtubeUrl = await ytdlService.search(search);
      if (!youtubeUrl) {
        const channel = message.channel as TextChannel;
        const msg = await channel.send({
          content: 'No results found :(',
        });
        setTimeout(() => {
          msg.delete();
        }, 5000);
        return;
      }
      searchQuery = youtubeUrl;
    }

    const result = await message.client.player.search(searchQuery, {
      requestedBy: message.member,
    });

    if (result.tracks.length === 0) {
      const channel = message.channel as TextChannel;

      const msg = await channel.send({
        content: 'No results found :(',
      });

      setTimeout(() => {
        msg.delete();
      }, 5000);

      return;
    }

    const song = result.tracks[0];

    const video_id = ytdlService.getVideoID(song.url);

    const isBannedUrl = await bannedUrls.findBannedUrlByVideoId(video_id);

    if (isBannedUrl) {
      const channel = message.channel as TextChannel;

      channel.send({
        content: 'homo homo homo homo :D Tällästä paskaa ei täällä kuunnella',
      });

      return;
    }

    const bannedWordsList = await bannedWords.findBannedWordsByGuildId(message.guildId ?? '');

    const bannedWordsArray = bannedWordsList.map((entry) => entry.keyword.toLowerCase().split(' '));

    const song_title = song.title.split(' ').map((entry) => entry.toLowerCase());

    let foundBannedWord = false;

    for (const array of bannedWordsArray) {
      let all_strings_found = true;
      for (const string of array) {
        if (!song_title.includes(string)) {
          all_strings_found = false;
          break;
        }
      }

      if (all_strings_found) {
        foundBannedWord = true;
      }
    }

    if (foundBannedWord) {
      const channel = message.channel as TextChannel;

      channel.send({
        content: 'homo homo homo homo :D Paska biisi on banaanisaarilla',
      });
      return;
    }

    queue.addTrack(song);

    if (!queue.isPlaying()) {
      guildQueue.play();
    }

    await playHistory.createPlayHistory({
      videoId: video_id,
      userId: message.member?.id ?? '',
      username: message.member?.user.username ?? '',
      searchString: isUrl ? '' : search,
      resultUrl: song.url,
      resultName: song_title.join(' '),
    });
  },
};

export default command;
