import type { InferInsertModel } from 'drizzle-orm';
import { and, eq } from 'drizzle-orm';
import { db } from 'src/lib/db';
import { bannedUrls } from 'src/lib/db/schema';

type NewBannedUrl = InferInsertModel<typeof bannedUrls>;

export const findBannedUrlByVideoId = async (videoId: string) => {
  const result = await db.select().from(bannedUrls).where(eq(bannedUrls.videoId, videoId));
  return result[0];
};

export const findBannedUrlsByGuildId = async (guildId: string) => {
  return await db.select().from(bannedUrls).where(eq(bannedUrls.guildId, guildId));
};

export const createBannedUrl = async (data: NewBannedUrl) => {
  return await db.insert(bannedUrls).values(data).returning();
};

export const deleteBannedUrl = async (videoId: string) => {
  return await db.delete(bannedUrls).where(eq(bannedUrls.videoId, videoId)).returning();
};

export const deleteBannedUrlByGuildAndVideo = async (guildId: string, videoId: string) => {
  return await db
    .delete(bannedUrls)
    .where(and(eq(bannedUrls.guildId, guildId), eq(bannedUrls.videoId, videoId)))
    .returning();
};

export const countBannedUrlsByGuildId = async (guildId: string) => {
  const result = await db.select().from(bannedUrls).where(eq(bannedUrls.guildId, guildId));
  return result.length;
};
