const { Events } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../services/store');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const counting = getGuildConfig(message.guild.id).counting;
    if (!counting.enabled || message.channel.id !== counting.channelId) return;

    const value = Number.parseInt(message.content.trim(), 10);
    const expected = counting.current + 1;
    const isOnlyNumber = `${value}` === message.content.trim();
    const doubleCounted = counting.noDoubleCount && counting.lastUserId === message.author.id;

    if (!Number.isInteger(value) || !isOnlyNumber || value !== expected || doubleCounted) {
      await message.react('\u274c').catch(() => null);

      if (counting.suddenDeath) {
        updateGuildConfig(message.guild.id, (config) => {
          config.counting.current = 0;
          config.counting.lastUserId = null;
        });
        await message.channel.send(`Counting reset to 0. The next number is **1**.`);
      }
      return;
    }

    updateGuildConfig(message.guild.id, (config) => {
      config.counting.current = value;
      config.counting.lastUserId = message.author.id;
    });

    await message.react('\u2705').catch(() => null);

    if (value === counting.goal) {
      await message.channel.send(`Goal reached! You made it to **${counting.goal}**.`);
    }
  }
};
