import "dotenv/config";

import {
  Client,
  GatewayIntentBits,
  Collection,
  MessageManager,
  TextChannel,
  EmbedBuilder,
  Message,
  Events,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Command, SlashCommand } from "./types";
import { readdirSync } from "fs";
import { join } from "path";
import { GuildQueue, GuildQueuePlayerNode, Player } from "discord-player";
import knex from "./libs/database/index";
import db from "./libs/database/index";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

const getEmbedMessage = async (queue: GuildQueue<any>): Promise<Message> => {
  const guild = await db("guilds")
    .select("music_channel_id", "message_id")
    .where("id", "=", queue.guild.id)
    .first();

  const channel = (await client.channels.fetch(
    guild.music_channel_id
  )) as TextChannel;

  return channel.messages.fetch(guild.message_id);
};

const mapQueue = (queue: GuildQueue<any>) => {
  return queue.tracks.data.length > 0
    ? queue.tracks.data
        .map(
          (track, index) =>
            `${index + 1}. ${track.title} - ${track.author} \n Added by: ${
              track.requestedBy
            }`
        )
        .join("\n")
    : "Tyhjää täynnä.";
};

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === "ullatus") {
      await interaction.deferUpdate();

      if (!interaction.guildId) return;

      const randomNumber = Math.floor(Math.random() * 10) + 1;

      if (randomNumber !== 10) return;

      let guildQueue = client.player.queues.get(interaction.guildId);

      const guild = client.guilds.cache.get(interaction.guildId);
      const member = guild?.members.cache.get(interaction.member?.user.id!);
      const voiceChannel = member?.voice.channel;

      if (!guildQueue) {
        guildQueue = client.player.queues.create(interaction.guildId);
        guildQueue.connect(voiceChannel?.id as string);
      }

      if (guildQueue.tracks.data.length === 0) {
        const queue = new GuildQueuePlayerNode(guildQueue);

        queue.skip();

        client.player.play(
          voiceChannel?.id as string,
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        );
      }
    }
    if (interaction.customId === "skip") {
      await interaction.deferUpdate();

      if (!interaction.guildId) return;

      const guildQueue = client.player.queues.get(interaction.guildId);

      if (!guildQueue) return;

      const queue = new GuildQueuePlayerNode(guildQueue);

      queue.skip();

      return;
    }

    if (interaction.customId === "modify-queue") {
      const modal = new ModalBuilder()
        .setCustomId("modify-queue-modal")
        .setTitle("Remove songs from queue");

      const firstActionRow = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("songToRemove")
          .setLabel("Give song position to remove")
          .setStyle(TextInputStyle.Short)
      );

      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
    }
  }

  if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId === "modify-queue-modal") {
      const response = interaction.fields.getTextInputValue("songToRemove");

      const guildQueue = interaction.client.player.queues.get(
        interaction.guildId as string
      );

      const queue = new GuildQueuePlayerNode(guildQueue as GuildQueue);

      const song = guildQueue?.tracks.at(parseInt(response) - 1);

      if (song) {
        queue.remove(song);
      }

      await interaction.deferUpdate();
    }
  }
});

(async () => {
  await knex.migrate.latest();

  client.slashCommands = new Collection<string, SlashCommand>();
  client.commands = new Collection<string, Command>();
  client.cooldowns = new Collection<string, number>();
  client.player = new Player(client);

  await client.player.extractors.loadDefault();

  client.player.extractors.loadDefault();

  client.player.events.on("playerStart", async (queue, track) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[0].value = `${track.title} - ${track.author} (${track.duration}) \n Added by: ${track.requestedBy}`;

    embedMessage.embeds[0].fields[2].value = mapQueue(queue);

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on("audioTrackRemove", async (queue, track) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[2].value = mapQueue(queue);

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on("connection", async (queue) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[2].value = "Tyhjää täynnä.";

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on("emptyQueue", async (queue) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[2].value = "Jono on tyhjä.";

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on("playerFinish", async (queue) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[0].value = "Pelaamisen &ääniä";

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on("audioTrackAdd", async (queue, track) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[2].value = mapQueue(queue);

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on("audioTrackRemove", async (queue, track) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[2].value = mapQueue(queue);

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  const handlersDir = join(__dirname, "./handlers");

  readdirSync(handlersDir).forEach((handler) => {
    require(`${handlersDir}/${handler}`)(client);
  });

  process
    .on("unhandledRejection", (reason, p) => {
      console.error(reason, "Unhandled Rejection at Promise", p);
    })
    .on("uncaughtException", (err) => {
      console.error(err, "Uncaught Exception thrown");
      process.exit(1);
    });

  client.login(process.env.TOKEN);
})();
