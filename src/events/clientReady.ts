import type { Client } from 'discord.js';
import { guilds } from 'src/lib/db/services';
import { color } from '../functions';
import type { BotEvent } from '../types';

const event: BotEvent = {
  name: 'clientReady',
  once: true,
  execute: async (client: Client) => {
    console.log(color('text', `💪 Logged in as ${color('variable', client.user?.tag ?? 'Unknown')}`));

    client.user?.setPresence({
      activities: [{ name: 'you', type: 3 }],
      status: 'online',
    });

    const allGuilds = await guilds.findAllGuilds();

    for (const [_, guild] of client.guilds.cache) {
      const result = allGuilds.find((g) => g.id === guild.id);

      if (!result) {
        await guilds.createGuild({
          id: guild.id,
          prefix: ';',
          ownerId: guild.ownerId,
        });
      }
    }
  },
};

export default event;
