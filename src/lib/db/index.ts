import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import { migrate } from 'drizzle-orm/bun-sql/migrator';
import * as schema from 'src/lib/db/schema';
import { env } from 'src/lib/env';

export const databaseClient = new SQL({
  adapter: 'postgres',
  database: env.DB_NAME,
  host: env.DB_HOST ?? 'localhost',
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 10,
  idleTimeout: 0,
  maxLifetime: 3600,
  connectionTimeout: 30,
});

export const db = drizzle({
  client: databaseClient,
  schema,
});

export async function runMigrations() {
  console.log('Running database migrations...');
  await migrate(db, { migrationsFolder: './src/lib/db/migrations' });
  console.log('Database migrations completed');
}
