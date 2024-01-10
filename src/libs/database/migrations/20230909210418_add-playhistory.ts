import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("play_history", function (table) {
    table.increments("id").primary();
    table.string("video_id").notNullable();
    table.string("user_id").notNullable();
    table.string("username").notNullable();
    table.string("search_string").notNullable();
    table.string("result_url").notNullable();
    table.string("result_name").notNullable();

    table.index("video_id");

    table.timestamps(true, true, false);
  });
}

export async function down(knex: Knex): Promise<void> {}
