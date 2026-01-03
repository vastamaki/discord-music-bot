import { GuildQueuePlayerNode } from 'discord-player';
import type { Command } from 'src/types';

const command: Command = {
  name: 'skip',
  aliases: ['s'],
  permissions: [],
  execute: async (message) => {
    if (!message.guildId) return;

    const guildQueue = message.client.player.queues.get(message.guildId);

    if (!guildQueue) return;

    const queue = new GuildQueuePlayerNode(guildQueue);

    queue.skip();

    await message.delete();
  },
};

export default command;
