import { ChannelType, type Message } from 'discord.js';
import { guilds } from 'src/lib/db/services';
import { checkPermissions, sendTimedMessage } from '../functions';
import type { BotEvent, Command } from '../types';

const event: BotEvent = {
  name: 'messageCreate',
  execute: async (message: Message) => {
    if (!message.member || message.member.user.bot) return;

    if (!message.guild || !message.guildId) return;

    const data = await guilds.findGuildById(message.guildId);

    if (!data) return;

    if (data.musicChannelId === message.channelId && !message.content.startsWith(data.prefix)) {
      if (message.content === 'skip') {
        const { default: func } = await import('../commands/skip');

        func.execute(message, [], data);
        return;
      }

      const { default: func } = await import('../commands/play');

      func.execute(message, ['play', ...message.content.split(' ')], data);
    }

    if (!message.content.startsWith(data.prefix)) return;
    if (message.channel.type !== ChannelType.GuildText) return;

    const args = message.content.substring(data.prefix.length).split(' ');
    let command = message.client.commands.get(args[0]);

    if (!command) {
      const commandFromAlias = message.client.commands.find((cmd: Command) => cmd.aliases.includes(args[0]));
      if (commandFromAlias) command = commandFromAlias;
      else return;
    }

    const neededPermissions = checkPermissions(message.member, command.permissions);
    if (neededPermissions !== null)
      return sendTimedMessage(
        `
            You don't have enough permissions to use this command. 
            \n Needed permissions: ${neededPermissions.join(', ')}
            `,
        message.channel,
        5000,
      );

    command.execute(message, args, data);
  },
};

export default event;
