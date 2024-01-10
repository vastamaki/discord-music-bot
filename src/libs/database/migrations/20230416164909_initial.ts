import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable("guilds", function (table) {
      table.string("id").notNullable().primary();
      table.string("prefix").notNullable();
      table.string("owner_id").notNullable();
      table.string("music_channel_id");
      table.timestamps(true, true);
    })
    .createTable("banned_words", function (table) {
      table.string("guild_id").notNullable().references("id").inTable("guilds");
      table.string("keyword").notNullable();
      table.string("banned_by").notNullable();
      table.primary(["guild_id", "keyword"]);
      table.timestamps(true, true);
    })
    .createTable("banned_urls", function (table) {
      table.string("guild_id").notNullable().references("id").inTable("guilds");
      table.string("video_id").notNullable();
      table.string("banned_by").notNullable();
      table.string("video_title").notNullable();
      table.primary(["guild_id", "video_id"]);
      table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("guilds").dropTable("play_history");
}
