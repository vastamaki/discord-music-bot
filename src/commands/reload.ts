import type { Command } from 'src/types';

const command: Command = {
  name: 'reload',
  aliases: ['r'],
  permissions: [],
  execute: async (message, args) => {
    const commandName = args[1];

    const command = message.client.commands.get(commandName);

    if (!command) {
      return message.reply(`Command ${commandName} not found`);
    }

    delete require.cache[require.resolve(`./${command.name}.ts`)];

    try {
      message.client.commands.delete(command.name);
      const { default: newCommand } = require(`./${command.name}.ts`);

      message.client.commands.set(newCommand.name, newCommand);
      await message.reply(`Command ${newCommand.name} reloaded`);
    } catch (error) {
      console.error(error);
      await message.reply(`There was an error while reloading a command ${command.name} :\n ${error.message}`);
    }
  },
};

export default command;
