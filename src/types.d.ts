import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Message,
  PermissionResolvable,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import type { Player } from 'discord-player';

export interface SlashCommand {
  command: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction, data) => void;
  autocomplete?: (interaction: AutocompleteInteraction) => void;
  cooldown?: number; // in seconds
}

export interface ChannelData {
  id: string;
  ownerId: string;
  prefix: string;
  musicChannelId: string | null;
  messageId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Command {
  name: string;
  execute: (message: Message, args: Array<string>, data: ChannelData) => void;
  permissions: Array<PermissionResolvable>;
  aliases: Array<string>;
  cooldown?: number;
}

interface GuildOptions {
  prefix: string;
}

export type GuildOption = keyof GuildOptions;
export interface BotEvent {
  name: string;
  once?: boolean | false;
  execute: (...args) => void;
}

declare module 'discord.js' {
  export interface Client {
    slashCommands: Collection<string, SlashCommand>;
    commands: Collection<string, Command>;
    cooldowns: Collection<string, number>;
    player: Player;
  }
}
