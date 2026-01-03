import { index, integer, pgTable, primaryKey, timestamp, varchar } from 'drizzle-orm/pg-core';

export const guilds = pgTable('guilds', {
  id: varchar('id').primaryKey().notNull(),
  prefix: varchar('prefix').notNull(),
  ownerId: varchar('owner_id').notNull(),
  musicChannelId: varchar('music_channel_id'),
  messageId: varchar('message_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const playHistory = pgTable(
  'play_history',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    videoId: varchar('video_id').notNull(),
    userId: varchar('user_id').notNull(),
    username: varchar('username').notNull(),
    searchString: varchar('search_string').notNull(),
    resultUrl: varchar('result_url').notNull(),
    resultName: varchar('result_name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('play_history_video_id_idx').on(table.videoId)],
);

export const bannedWords = pgTable(
  'banned_words',
  {
    guildId: varchar('guild_id')
      .notNull()
      .references(() => guilds.id),
    keyword: varchar('keyword').notNull(),
    bannedBy: varchar('banned_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.guildId, table.keyword] })],
);

export const bannedUrls = pgTable(
  'banned_urls',
  {
    guildId: varchar('guild_id')
      .notNull()
      .references(() => guilds.id),
    videoId: varchar('video_id').notNull(),
    bannedBy: varchar('banned_by').notNull(),
    videoTitle: varchar('video_title').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.guildId, table.videoId] })],
);
