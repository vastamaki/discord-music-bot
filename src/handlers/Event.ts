import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Client } from 'discord.js';
import { color } from '../functions';
import type { BotEvent } from '../types';

export default (client: Client) => {
  const eventsDir = join(__dirname, '../events');

  readdirSync(eventsDir).forEach((file) => {
    if (!file.endsWith('.ts')) return;
    const event: BotEvent = require(`${eventsDir}/${file}`).default;
    event.once
      ? client.once(event.name, (...args) => event.execute(...args))
      : client.on(event.name, (...args) => event.execute(...args));
    console.log(color('text', `🌠 Successfully loaded event ${color('variable', event.name)}`));
  });
};
