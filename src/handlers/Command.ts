import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REST } from '@discordjs/rest';
import { type Client, Routes, type SlashCommandBuilder, type SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import { env } from 'src/lib/env';
import { color } from '../functions';
import type { Command, SlashCommand } from '../types';

export default (client: Client) => {
  const slashCommands: (SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder)[] = [];
  const commands: Command[] = [];

  const slashCommandsDir = join(__dirname, '../slashCommands');
  const commandsDir = join(__dirname, '../commands');

  readdirSync(slashCommandsDir).forEach((file) => {
    if (!file.endsWith('.ts')) return;
    const command: SlashCommand = require(`${slashCommandsDir}/${file}`).default;
    slashCommands.push(command.command);
    client.slashCommands.set(command.command.name, command);
  });

  readdirSync(commandsDir).forEach((file) => {
    if (!file.endsWith('.ts')) return;
    const command: Command = require(`${commandsDir}/${file}`).default;
    commands.push(command);
    client.commands.set(command.name, command);
  });

  const rest = new REST({ version: '10' }).setToken(env.TOKEN);

  rest
    .put(Routes.applicationCommands(env.CLIENT_ID), {
      body: slashCommands.map((command) => command.toJSON()),
    })
    .then((data: unknown) => {
      console.log(
        color(
          'text',
          `🔥 Successfully loaded ${color('variable', (data as unknown[]).length.toString())} slash command(s)`,
        ),
      );
      console.log(color('text', `🔥 Successfully loaded ${color('variable', commands.length.toString())} command(s)`));
    })
    .catch((e) => {
      console.log(e);
    });
};
