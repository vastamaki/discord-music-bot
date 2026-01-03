import { format } from 'date-fns';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type CommandInteraction,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { GuildQueuePlayerNode } from 'discord-player';
import { bannedUrls, bannedWords } from 'src/lib/db/services';
import { ytdlService } from 'src/lib/ytdl';
import type { SlashCommand } from 'src/types';

const ClearCommand: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Perfrom ban related actions')
    .addSubcommand((subcommand) => subcommand.setName('current').setDescription('Ban currently playing song'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('List banned stuff')
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Select type')
            .setRequired(true)
            .addChoices({ name: 'Keywords', value: 'keywords' }, { name: 'Urls', value: 'urls' }),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('keyword')
        .setDescription('Ban songs if the keyword is in the title')
        .addStringOption((option) =>
          option.setName('keywords').setDescription('All words must be included in the video title').setRequired(true),
        ),
    ),
  execute: async (interaction) => {
    switch (interaction.options.getSubcommand()) {
      case 'keyword':
        await banByKeyword(interaction);
        break;
      case 'current':
        await banCurrentSong(interaction);
        break;
      case 'list':
        await generateBannedList(interaction, interaction.options.getString('type') as string);
        break;
      default:
        break;
    }
  },
};

const banByKeyword = async (interaction: ChatInputCommandInteraction) => {
  const keywords = interaction.options.getString('keywords') as string;

  if (!interaction.guildId) {
    return interaction.reply('This command can only be used in a server');
  }

  try {
    if (ytdlService.validateURL(keywords)) {
      await bannedUrls.createBannedUrl({
        guildId: interaction.guildId,
        videoId: ytdlService.getVideoID(keywords),
        videoTitle: await ytdlService.getVideoTitle(keywords),
        bannedBy: interaction.user.id,
      });
    } else {
      await bannedWords.createBannedWord({
        guildId: interaction.guildId,
        keyword: keywords,
        bannedBy: interaction.user.id,
      });
    }
    interaction.reply(`${keywords} is now in banned list`);
  } catch (err) {
    console.error(err);

    interaction.reply({
      content: `Unable to ban this keyword, it's most likely already banned`,
    });
  }
};

const banCurrentSong = async (interaction: CommandInteraction) => {
  const guildQueue = interaction.client.player.queues.get(interaction.guildId as string);

  if (!guildQueue || !guildQueue.isPlaying()) return;

  if (!interaction.guildId) {
    return interaction.reply('This command can only be used in a server');
  }

  const queue = new GuildQueuePlayerNode(guildQueue);

  const url = guildQueue?.currentTrack?.url as string;

  queue.skip();

  await bannedUrls.createBannedUrl({
    guildId: interaction.guildId,
    videoId: ytdlService.getVideoID(url),
    videoTitle: await ytdlService.getVideoTitle(url),
    bannedBy: interaction.user.id,
  });

  interaction.reply(`${url} is now in banned list`);
  return;
};

const generateBannedList = async (interaction: ChatInputCommandInteraction, type: string) => {
  if (!interaction.guildId) {
    return interaction.reply('This command can only be used in a server');
  }

  const guildId = interaction.guildId;

  const backId = 'back';
  const forwardId = 'forward';

  const backButton = new ButtonBuilder()
    .setCustomId(backId)
    .setEmoji('⬅️')
    .setLabel('Back')
    .setStyle(ButtonStyle.Secondary);

  const forwardButton = new ButtonBuilder()
    .setCustomId(forwardId)
    .setEmoji('➡️')
    .setLabel('Forward')
    .setStyle(ButtonStyle.Secondary);

  try {
    const count =
      type === 'urls'
        ? await bannedUrls.countBannedUrlsByGuildId(guildId)
        : await bannedWords.countBannedWordsByGuildId(guildId);

    const generateEmbed = async (start: number) => {
      if (type === 'urls') {
        const allUrls = await bannedUrls.findBannedUrlsByGuildId(guildId);
        const items = allUrls.slice(start, start + 10);

        const urls = items.map((word) => ({
          name: word.videoTitle,
          value: `youtube.com/watch?v=${word.videoId} \n banned by: <@${
            word.bannedBy
          }> @ ${format(new Date(word.updatedAt), 'dd-MM-yyyy HH:mm:ss')}`,
        }));

        return new EmbedBuilder({
          title: `Banned URLs ${start + 1}-${Math.min(start + 10, count)} of ${count}`,
          fields: urls,
        });
      } else {
        const allWords = await bannedWords.findBannedWordsByGuildId(guildId);
        const items = allWords.slice(start, start + 10);

        const keywords = items
          .map(
            (word) =>
              `\`${word.keyword}\` banned by: <@${word.bannedBy}> @ ${format(
                new Date(word.updatedAt),
                'dd-MM-yyyy HH:mm:ss',
              )}`,
          )
          .join('\n');

        return new EmbedBuilder({
          title: `Banned words ${start + 1}-${Math.min(start + 10, count)} of ${count}`,
          description: keywords,
        });
      }
    };

    const canFitOnOnePage = count <= 10;

    const embedMessage = await interaction.reply({
      embeds: [await generateEmbed(0)],
      components: canFitOnOnePage
        ? []
        : [
            new ActionRowBuilder<MessageActionRowComponentBuilder>({
              components: [forwardButton],
            }),
          ],
    });

    if (canFitOnOnePage) return;

    const collector = embedMessage?.createMessageComponentCollector({
      filter: ({ message }) => message.interaction?.id === interaction.id,
    });

    let currentIndex = 0;

    collector?.on('collect', async (interaction) => {
      if (interaction.customId === backId) {
        currentIndex -= 10;
      } else {
        currentIndex += 10;
      }

      await interaction.deferUpdate();

      await interaction.message.edit({
        embeds: [await generateEmbed(currentIndex)],
        components: [
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents([
            ...(currentIndex ? [backButton] : []),
            ...(currentIndex + 10 < count ? [forwardButton] : []),
          ]),
        ],
      });
    });
  } catch (err) {
    console.error(err);
  }
};

export default ClearCommand;
