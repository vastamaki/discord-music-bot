import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  SlashCommandBuilder,
} from "discord.js";
import db, { tables } from "../libs/database";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Registers music channel")
    .addChannelOption((channel) => {
      return channel
        .setName("channel")
        .setDescription("Channel you want to use only for music requests")
        .setRequired(true);
    }),
  execute: async (interaction, data) => {
    if (interaction.user.id !== data.owner_id) {
      return interaction.reply(
        "You do not have permissions to perform this action"
      );
    }

    await db(tables.guilds)
      .update({
        music_channel_id: interaction.channelId,
      })
      .where("id", "=", interaction.guildId);

    const embedMessage = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Paskan musiikin lista")
      .setDescription("Tässä näet listan paskasta musiikista")
      .addFields(
        {
          name: "Now playing",
          value: "Pelaamisen &ääniä",
          inline: false,
        },
        { name: "\u200B", value: "\u200B", inline: false },
        {
          name: "Queue",
          value: "Täällä on hiljaista.",
          inline: false,
        }
      );

    const confirm = new ButtonBuilder()
      .setCustomId("skip")
      .setLabel("Skip current song")
      .setStyle(ButtonStyle.Secondary);

    const cancel = new ButtonBuilder()
      .setCustomId("modify-queue")
      .setLabel("Modify queue")
      .setStyle(ButtonStyle.Secondary);

    const ullatus = new ButtonBuilder()
      .setCustomId("ullatus")
      .setLabel("Nappi")
      .setStyle(ButtonStyle.Secondary);

    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        cancel,
        confirm,
        ullatus
      );

    const message = await interaction.reply({
      embeds: [embedMessage],
      components: [row],
    });

    await db(tables.guilds)
      .update({
        message_id: message?.id,
      })
      .where("id", "=", interaction.guildId);

    await interaction.reply("Music channel registered");

    await interaction.deleteReply();
  },
};

export default command;
