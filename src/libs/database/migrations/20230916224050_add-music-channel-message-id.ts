import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table("guilds", (table) => {
    table.string("message_id").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {}
