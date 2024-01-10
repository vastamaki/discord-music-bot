import { ChannelType, Message } from "discord.js";
import { checkPermissions, sendTimedMessage } from "../functions";
import db, { tables } from "../libs/database";
import { BotEvent } from "../types";

const event: BotEvent = {
  name: "messageCreate",
  execute: async (message: Message) => {
    if (!message.member || message.member.user.bot) return;

    if (!message.guild) return;

    const data = await db(tables.guilds)
      .select("*")
      .where("id", "=", message.guildId)
      .first();

    if (
      data.music_channel_id === message.channelId &&
      !message.content.startsWith(data.prefix)
    ) {
      if (message.content === "skip") {
        const { default: func } = await import("../commands/skip");

        func.execute(message, [], data);
        return;
      }

      const { default: func } = await import("../commands/play");

      func.execute(message, ["play", ...message.content.split(" ")], data);
    }

    if (!message.content.startsWith(data.prefix)) return;
    if (message.channel.type !== ChannelType.GuildText) return;

    let args = message.content.substring(data.prefix.length).split(" ");
    let command = message.client.commands.get(args[0]);

    if (!command) {
      let commandFromAlias = message.client.commands.find((command) =>
        command.aliases.includes(args[0])
      );
      if (commandFromAlias) command = commandFromAlias;
      else return;
    }

    let neededPermissions = checkPermissions(
      message.member,
      command.permissions
    );
    if (neededPermissions !== null)
      return sendTimedMessage(
        `
            You don't have enough permissions to use this command. 
            \n Needed permissions: ${neededPermissions.join(", ")}
            `,
        message.channel,
        5000
      );

    command.execute(message, args, data);
  },
};

export default event;
