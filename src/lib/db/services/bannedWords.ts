import type { InferInsertModel } from 'drizzle-orm';
import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { bannedWords } from '../schema';

type NewBannedWord = InferInsertModel<typeof bannedWords>;

export const findBannedWordsByGuildId = async (guildId: string) => {
  return await db.select().from(bannedWords).where(eq(bannedWords.guildId, guildId));
};

export const findBannedWord = async (guildId: string, keyword: string) => {
  const result = await db
    .select()
    .from(bannedWords)
    .where(and(eq(bannedWords.guildId, guildId), eq(bannedWords.keyword, keyword)));
  return result[0];
};

export const createBannedWord = async (data: NewBannedWord) => {
  return await db.insert(bannedWords).values(data).returning();
};

export const deleteBannedWord = async (guildId: string, keyword: string) => {
  return await db
    .delete(bannedWords)
    .where(and(eq(bannedWords.guildId, guildId), eq(bannedWords.keyword, keyword)))
    .returning();
};

export const countBannedWordsByGuildId = async (guildId: string) => {
  const result = await db.select().from(bannedWords).where(eq(bannedWords.guildId, guildId));
  return result.length;
};
