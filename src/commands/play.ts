import { GuildQueue, GuildQueuePlayerNode, QueryType } from "discord-player";
import ytdl from "@distube/ytdl-core";
import db, { tables } from "../libs/database";
import { Command } from "../types";

const command: Command = {
  name: "play",
  aliases: ["p"],
  permissions: [],
  execute: async (message, args) => {
    const voiceChannelId = message.member?.voice.channel?.id;

    if (!voiceChannelId) {
      return message.reply(
        "Please join to voice channel before using this command"
      );
    }

    const search = args.slice(1).join(" ");

    if (!search) {
      return message.reply("No search or url provided :(");
    }

    await message.delete();

    if (!message.guild) return;

    const queue = message.client.player.queues.create(message.guild);
    if (!queue.connection) queue.connect(voiceChannelId);

    const guildQueue = new GuildQueuePlayerNode(queue as GuildQueue);

    const isUrl = ytdl.validateURL(search);

    const result = await message.client.player.search(search, {
      requestedBy: message.member,
      searchEngine: isUrl ? QueryType.YOUTUBE_VIDEO : QueryType.YOUTUBE_SEARCH,
    });

    if (result.tracks.length === 0) {
      return message.reply("No results..");
    }

    const song = result.tracks[0];

    const video_id = ytdl.getURLVideoID(song.url);

    const isBannedUrl = await db(tables.bannedUrls)
      .select("*")
      .where("video_id", "=", video_id)
      .first();

    if (isBannedUrl) {
      message.reply({
        content: "homo homo homo homo :D Tällästä paskaa ei täällä kuunnella",
      });

      return;
    }

    const bannedWords = await db(tables.bannedWords)
      .select("*")
      .where("guild_id", "=", message.guildId);

    const bannedWordsList = bannedWords.map((entry) =>
      entry.keyword.toLowerCase().split(" ")
    );

    const song_title = song.title
      .split(" ")
      .map((entry) => entry.toLowerCase());

    let foundBannedWord = false;

    for (const array of bannedWordsList) {
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
      message.reply({
        content: "homo homo homo homo :D Paska biisi on banaanisaarilla",
      });
      return;
    }

    queue.addTrack(song);

    if (!queue.isPlaying()) {
      guildQueue.play();
    }

    await db(tables.playHistory).insert({
      video_id: video_id,
      user_id: message.member?.id,
      username: message.member.user.username,
      search_string: isUrl ? "" : search,
      result_url: song.url,
      result_name: song_title.join(" "),
    });
  },
};

export default command;
