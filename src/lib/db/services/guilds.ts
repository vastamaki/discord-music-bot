import type { InferInsertModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { db } from '../index';
import { guilds } from '../schema';

type NewGuild = InferInsertModel<typeof guilds>;

export const findGuildById = async (id: string) => {
  const result = await db.select().from(guilds).where(eq(guilds.id, id));
  return result[0];
};

export const findAllGuilds = async () => {
  return await db.select().from(guilds);
};

export const createGuild = async (data: NewGuild) => {
  return await db.insert(guilds).values(data).returning();
};

export const updateGuildPrefix = async (id: string, prefix: string) => {
  return await db.update(guilds).set({ prefix, updatedAt: new Date() }).where(eq(guilds.id, id)).returning();
};

export const updateGuildMusicChannel = async (id: string, musicChannelId: string) => {
  return await db.update(guilds).set({ musicChannelId, updatedAt: new Date() }).where(eq(guilds.id, id)).returning();
};

export const updateGuildMessageId = async (id: string, messageId: string) => {
  return await db.update(guilds).set({ messageId, updatedAt: new Date() }).where(eq(guilds.id, id)).returning();
};
