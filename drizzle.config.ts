import { defineConfig } from 'drizzle-kit';

const {
  DB_HOST = 'localhost',
  DB_USER = 'postgres',
  DB_PASS = 'postgres',
  DB_PORT = '5432',
  DB_DB = 'discord_bot',
} = process.env;

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: DB_HOST,
    port: parseInt(DB_PORT, 10),
    user: DB_USER,
    password: DB_PASS,
    database: DB_DB,
  },
});
