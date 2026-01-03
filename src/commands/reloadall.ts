import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REST, Routes, type SlashCommandBuilder } from 'discord.js';
import { color } from '../functions';
import type { Command, SlashCommand } from '../types';

const command: Command = {
  name: 'reloadall',
  aliases: [],
  permissions: [],
  execute: async (message) => {
    const slashCommands: SlashCommandBuilder[] = [];
    const commands: Command[] = [];

    const slashCommandsDir = join(__dirname, '../slashCommands');
    const commandsDir = __dirname;

    readdirSync(slashCommandsDir).forEach((file) => {
      if (!file.endsWith('.ts')) return;
      message.client.slashCommands.delete(file.split('.')[0]);
      delete require.cache[require.resolve(`${slashCommandsDir}/${file}`)];
      const command: SlashCommand = require(`${slashCommandsDir}/${file}`).default;
      slashCommands.push(command.command);
      message.client.slashCommands.set(command.command.name, command);
      console.log(message.client.slashCommands.get('ban')?.execute.toString());
    });

    readdirSync(commandsDir).forEach((file) => {
      if (!file.endsWith('.ts')) return;
      message.client.commands.delete(file.split('.')[0]);
      delete require.cache[require.resolve(`${commandsDir}/${file}`)];
      const command: Command = require(`${commandsDir}/${file}`).default;
      commands.push(command);
      message.client.commands.set(command.name, command);
    });

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    rest
      .put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: slashCommands.map((command) => command.toJSON()),
      })
      .then((data: any) => {
        console.log(color('text', `🔥 Successfully loaded ${color('variable', data.length)} slash command(s)`));
        console.log(color('text', `🔥 Successfully loaded ${color('variable', commands.length)} command(s)`));
      })
      .catch((e) => {
        console.log(e);
      });
  },
};

export default command;
