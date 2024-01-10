import { Guild } from "discord.js";
import db from "../libs/database";

export const getRandomInt = (max: number) => Math.floor(Math.random() * max);

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const isAdmin = async (guildId: string, authorId: string) => {
  const row = await db("admins")
    .select("*")
    .where("guildId", "=", guildId)
    .andWhere("userId", "=", authorId)
    .first();

  return !!row;
};

export const initGuilds = async (guilds: Guild[]) => {
  for (const [guildId, guild] of guilds) {
    await db("servers")
      .insert({
        guildId,
        owner: guild.ownerId,
        prefix: ";",
      })
      .onConflict()
      .ignore();

    await db("admins")
      .insert({
        guildId,
        userId: guild.ownerId,
      })
      .onConflict()
      .ignore();
  }
};
