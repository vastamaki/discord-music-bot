import knex from "knex";

declare var process: {
  env: {
    DB_HOST: string;
    DB_USER: string;
    DB_PASS: string;
    DB_PORT: number;
    DB_DB: string;
  };
};

const { DB_HOST, DB_USER, DB_PASS, DB_PORT, DB_DB } = process.env;

export const tables = {
  guilds: "guilds",
  playHistory: "play_history",
  bannedWords: "banned_words",
  bannedUrls: "banned_urls",
};

const db = knex({
  client: "mysql2",
  pool: {
    min: 1,
    max: 1,
  },
  connection: {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    port: DB_PORT,
    database: DB_DB,
    typeCast: function (field: any, next: any) {
      if (field.type == "TINY" && field.length == 1) {
        let value = field.string();
        return value ? value == "1" : null;
      }

      if (field.type == "BLOB") {
        try {
          return JSON.parse(field.string());
        } catch (e) {
          console.error(e);
          return field.string();
        }
      }
      return next();
    },
  },
  migrations: {
    database: DB_DB,
    directory: "src/libs/database/migrations",
  },
});

export default db;
