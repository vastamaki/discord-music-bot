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
  for (const guild of guilds) {
    await db("servers")
      .insert({
        guildId: guild.id,
        owner: guild.ownerId,
        prefix: ";",
      })
      .onConflict()
      .ignore();

    await db("admins")
      .insert({
        guildId: guild.id,
        userId: guild.ownerId,
      })
      .onConflict()
      .ignore();
  }

  console.log("Guilds initialized.");
};
