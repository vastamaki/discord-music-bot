import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  ActionRowBuilder,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  InteractionType,
  type Message,
  type ModalActionRowComponentBuilder,
  ModalBuilder,
  type TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { type GuildQueue, GuildQueuePlayerNode, Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { runMigrations } from 'src/lib/db';
import { guilds } from 'src/lib/db/services';
import type { Command, SlashCommand } from './types';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

const getEmbedMessage = async (queue: GuildQueue): Promise<Message> => {
  const guild = await guilds.findGuildById(queue.guild.id);

  if (!guild?.musicChannelId || !guild?.messageId) {
    throw new Error('Music channel or message not configured');
  }

  const channel = (await client.channels.fetch(guild.musicChannelId)) as TextChannel;

  return channel.messages.fetch(guild.messageId);
};

const mapQueue = (queue: GuildQueue) => {
  return queue.tracks.data.length > 0
    ? queue.tracks.data
        .map((track, index) => `${index + 1}. ${track.title} - ${track.author} \n Added by: ${track.requestedBy}`)
        .join('\n')
    : 'Tyhjää täynnä.';
};

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === 'ullatus') {
      await interaction.deferUpdate();

      if (!interaction.guildId) return;

      const randomNumber = Math.floor(Math.random() * 10) + 1;

      if (randomNumber !== 10) return;

      let guildQueue = client.player.queues.get(interaction.guildId);

      const guild = client.guilds.cache.get(interaction.guildId);
      const userId = interaction.member?.user?.id;
      if (!userId) return;
      const member = guild?.members.cache.get(userId);
      const voiceChannel = member?.voice.channel;

      if (!guildQueue) {
        guildQueue = client.player.queues.create(interaction.guildId);
        guildQueue.connect(voiceChannel?.id as string);
      }

      if (guildQueue.tracks.data.length === 0) {
        const queue = new GuildQueuePlayerNode(guildQueue);

        queue.skip();

        client.player.play(voiceChannel?.id as string, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      }
    }
    if (interaction.customId === 'skip') {
      await interaction.deferUpdate();

      if (!interaction.guildId) return;

      const guildQueue = client.player.queues.get(interaction.guildId);

      if (!guildQueue) return;

      const queue = new GuildQueuePlayerNode(guildQueue);

      queue.skip();

      return;
    }

    if (interaction.customId === 'modify-queue') {
      const modal = new ModalBuilder().setCustomId('modify-queue-modal').setTitle('Remove songs from queue');

      const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('songToRemove')
          .setLabel('Give song position to remove')
          .setStyle(TextInputStyle.Short),
      );

      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
    }
  }

  if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId === 'modify-queue-modal') {
      const response = interaction.fields.getTextInputValue('songToRemove');

      const guildQueue = interaction.client.player.queues.get(interaction.guildId as string);

      const queue = new GuildQueuePlayerNode(guildQueue as GuildQueue);

      const song = guildQueue?.tracks.at(parseInt(response, 10) - 1);

      if (song) {
        queue.remove(song);
      }

      await interaction.deferUpdate();
    }
  }
});

(async () => {
  try {
    await runMigrations();
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }

  client.slashCommands = new Collection<string, SlashCommand>();
  client.commands = new Collection<string, Command>();
  client.cooldowns = new Collection<string, number>();
  client.player = new Player(client, {
    skipFFmpeg: false,
  });

  await client.player.extractors.register(YoutubeiExtractor, {});

  client.player.events.on('playerStart', async (queue, track) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[0].value = `${track.title} - ${track.author} (${track.duration}) \n Added by: ${track.requestedBy}`;

    embedMessage.embeds[0].fields[2].value = mapQueue(queue);

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on('audioTrackRemove', async (queue, _track) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[2].value = mapQueue(queue);

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on('connection', async (queue) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[2].value = 'Tyhjää täynnä.';

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on('emptyQueue', async (queue) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[2].value = 'Jono on tyhjä';

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on('playerFinish', async (queue) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[0].value = 'Pelaamisen &ääniä';

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on('audioTrackAdd', async (queue, _track) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[2].value = mapQueue(queue);

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on('audioTrackRemove', async (queue, _track) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[2].value = mapQueue(queue);

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on('disconnect', async (queue) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[0].value = 'Ikävän hiljaista...';
    embedMessage.embeds[0].fields[2].value = 'Jono on tyhjä';

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  client.player.events.on('emptyChannel', async (queue) => {
    const embedMessage = await getEmbedMessage(queue);

    embedMessage.embeds[0].fields[0].value = 'Ikävän hiljaista...';
    embedMessage.embeds[0].fields[2].value = 'Jono on tyhjä';

    await embedMessage.edit({
      embeds: [embedMessage.embeds[0]],
    });
  });

  const handlersDir = join(__dirname, './handlers');

  readdirSync(handlersDir).forEach((handler) => {
    const handlerModule = require(`${handlersDir}/${handler}`);
    const handlerFunction = handlerModule.default || handlerModule;
    handlerFunction(client);
  });

  process
    .on('unhandledRejection', (reason, p) => {
      console.error(reason, 'Unhandled Rejection at Promise', p);
    })
    .on('uncaughtException', (err) => {
      console.error(err, 'Uncaught Exception thrown');
      process.exit(1);
    });

  client.login(process.env.TOKEN);
})();
