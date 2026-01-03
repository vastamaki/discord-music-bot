import type { InferInsertModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { db } from '../index';
import { playHistory } from '../schema';

type NewPlayHistory = InferInsertModel<typeof playHistory>;

export const createPlayHistory = async (data: NewPlayHistory) => {
  return await db.insert(playHistory).values(data).returning();
};

export const findPlayHistoryByVideoId = async (videoId: string) => {
  return await db.select().from(playHistory).where(eq(playHistory.videoId, videoId));
};

export const findAllPlayHistory = async () => {
  return await db.select().from(playHistory);
};
