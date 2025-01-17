import { format } from "date-fns";
import { GuildQueuePlayerNode } from "discord-player";
import {
  ChatInputCommandInteraction,
  CommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";
import ytdl from "@distube/ytdl-core";
import db, { tables } from "../libs/database";
import { SlashCommand } from "../types";

const ClearCommand: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Perfrom ban related actions")
    .addSubcommand((subcommand) =>
      subcommand.setName("current").setDescription("Ban currently playing song")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List banned stuff")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Select type")
            .setRequired(true)
            .addChoices(
              { name: "Keywords", value: "keywords" },
              { name: "Urls", value: "urls" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("keyword")
        .setDescription("Ban songs if the keyword is in the title")
        .addStringOption((option) =>
          option
            .setName("keywords")
            .setDescription("All words must be included in the video title")
            .setRequired(true)
        )
    ),
  execute: async (interaction) => {
    switch (interaction.options.getSubcommand()) {
      case "keyword":
        await banByKeyword(interaction);
        break;
      case "current":
        await banCurrentSong(interaction);
        break;
      case "list":
        await generateBannedList(
          interaction,
          interaction.options.getString("type") as string
        );
        break;
      default:
        break;
    }
  },
};

const banByKeyword = async (interaction: ChatInputCommandInteraction) => {
  const keywords = interaction.options.getString("keywords") as string;

  try {
    if (ytdl.validateURL(keywords)) {
      await db(tables.bannedUrls).insert({
        guild_id: interaction.guildId,
        video_id: ytdl.getURLVideoID(keywords),
        video_title: (await ytdl.getInfo(keywords)).videoDetails.title,
        banned_by: interaction.user.id,
      });
    } else {
      await db(tables.bannedWords).insert({
        guild_id: interaction.guildId,
        keyword: keywords,
        banned_by: interaction.user.id,
      });
    }
    interaction.reply(`${keywords} is now in banned list`);
  } catch (err) {
    console.error(err);

    interaction.reply({
      content: `Unable to ban this keyword, it's most likely already banned`,
    });
  }
};

const banCurrentSong = async (interaction: CommandInteraction) => {
  const guildQueue = interaction.client.player.queues.get(
    interaction.guildId as string
  );

  if (!guildQueue || !guildQueue.isPlaying()) return;

  const queue = new GuildQueuePlayerNode(guildQueue);

  const url = guildQueue?.currentTrack?.url as string;

  queue.skip();

  await db(tables.bannedUrls).insert({
    guild_id: interaction.guildId,
    video_id: ytdl.getURLVideoID(url),
    video_title: (await ytdl.getInfo(url)).videoDetails.title,
    banned_by: interaction.user.id,
  });

  interaction.reply(`${url} is now in banned list`);
  return;
};

const generateBannedList = async (
  interaction: ChatInputCommandInteraction,
  type: string
) => {
  const backId = "back";
  const forwardId = "forward";

  const backButton = new ButtonBuilder()
    .setCustomId(backId)
    .setEmoji("⬅️")
    .setLabel("Back")
    .setStyle(ButtonStyle.Secondary);

  const forwardButton = new ButtonBuilder()
    .setCustomId(forwardId)
    .setEmoji("➡️")
    .setLabel("Forward")
    .setStyle(ButtonStyle.Secondary);

  const table = type === "urls" ? tables.bannedUrls : tables.bannedWords;

  try {
    const count_rows: any = await db("guild_id")
      .count("guild_id")
      .from(table)
      .where("guild_id", "=", interaction.guildId)
      .first();

    const count = count_rows["count(`guild_id`)"];

    const banned_words = await db(table)
      .select("*")
      .where("guild_id", "=", interaction.guildId)
      .offset(0)
      .limit(11);

    const generateEmbed = async (start: number) => {
      const banned_words = await db(table)
        .select("*")
        .where("guild_id", "=", interaction.guildId)
        .offset(start)
        .limit(start + 11);

      const keywords = banned_words
        .map(
          (word) =>
            `\`${word.keyword}\` banned by: <@${word.banned_by}> @ ${format(
              new Date(word.updated_at),
              "dd-MM-yyyy HH:mm:ss"
            )}`
        )
        .join("\n");

      const urls = banned_words.map((word) => ({
        name: word.video_title,
        value: `youtube.com/watch?v=${word.video_id} \n banned by: <@${
          word.banned_by
        }> @ ${format(new Date(word.updated_at), "dd-MM-yyyy HH:mm:ss")}`,
      }));

      return new EmbedBuilder({
        title: `Banned words ${start + 1}-${start + 10} of ${count}`,
        ...(type === "urls" && {
          fields: urls,
        }),
        ...(type === "keywords" && {
          description: keywords,
        }),
      });
    };

    const canFitOnOnePage = banned_words.length <= 10;

    const embedMessage = await interaction.reply({
      embeds: [await generateEmbed(0)],
      components: canFitOnOnePage
        ? []
        : ([
            new ActionRowBuilder({
              components: [forwardButton],
            }),
          ] as any),
    });

    if (canFitOnOnePage) return;

    const collector = embedMessage?.createMessageComponentCollector({
      filter: ({ message }) => message.interaction?.id === interaction.id,
    });

    let currentIndex = 0;

    collector?.on("collect", async (interaction) => {
      interaction.customId === backId
        ? (currentIndex -= 10)
        : (currentIndex += 10);

      await interaction.deferUpdate();

      await interaction.message.edit({
        embeds: [await generateEmbed(currentIndex)],
        components: [
          new ActionRowBuilder().setComponents([
            ...(currentIndex ? [backButton] : []),
            ...(currentIndex + 10 < banned_words.length ? [forwardButton] : []),
          ]) as any,
        ],
      });
    });
  } catch (err) {
    console.error(err);
  }
};

export default ClearCommand;
