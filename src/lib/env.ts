import { z } from 'zod';

const envSchema = z.object({
  // Discord
  TOKEN: z.string().min(1, 'Discord bot token is required'),
  CLIENT_ID: z.string().min(1, 'Discord client ID is required'),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('discord_bot'),
  DB_SSL: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export type Env = z.infer<typeof envSchema>;

const parseEnv = (): Env => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }

  return parsed.data;
};

export const env = parseEnv();
