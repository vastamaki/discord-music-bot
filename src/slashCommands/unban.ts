import { SlashCommandBuilder } from "discord.js";
import ytdl from "ytdl-core";
import db, { tables } from "../libs/database";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unbans url or keywords")
    .addStringOption((option) =>
      option
        .setName("keywords")
        .setDescription("Give keywords or link")
        .setRequired(true)
    ),
  execute: async (interaction) => {
    if (
      ![
        "247819946522968074",
        "250682869297446922",
        "239086506252173314",
        "190912995180806145",
      ].includes(interaction.user.id)
    ) {
      return interaction.reply("HOMO HOMO HOMO :DDDDD");
    }

    const keyword = interaction.options.getString("keywords") as string;

    let youtubeId = null;

    try {
      youtubeId = ytdl.getURLVideoID(keyword);
    } catch {}

    if (youtubeId) {
      await db(tables.bannedUrls).delete().where("video_id", "=", youtubeId);

      return interaction.reply("This video is now unbanned");
    }

    const result = await db(tables.bannedWords)
      .delete()
      .where("keyword", "=", keyword);

    interaction.reply(
      `Removed ${result} entries from database with keyword: ${keyword}`
    );
  },
};

export default command;
