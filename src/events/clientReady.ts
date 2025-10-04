import { Client } from "discord.js";
import { BotEvent } from "../types";
import { color } from "../functions";
import db, { tables } from "../libs/database";

const event: BotEvent = {
  name: "ready",
  once: true,
  execute: async (client: Client) => {
    console.log(
      color("text", `💪 Logged in as ${color("variable", client.user?.tag)}`)
    );

    client.user?.setPresence({
      activities: [{ name: "you", type: 3 }],
      status: "online",
    });

    const guilds = await db(tables.guilds).select("*");

    for (const [_, guild] of client.guilds.cache) {
      const result = guilds.find((g) => g.id === guild.id);

      if (!result) {
        await db(tables.guilds).insert({
          id: guild.id,
          prefix: ";",
          owner_id: guild.ownerId,
        });
      }
    }
  },
};

export default event;
