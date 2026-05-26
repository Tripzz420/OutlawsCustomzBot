const { Events } = require('discord.js');
const { getGuildConfig } = require('../services/store');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const config = getGuildConfig(member.guild.id).welcome;

    if (!config.enabled || !config.channelId) return;

    const channel = await member.guild.channels.fetch(config.channelId).catch(() => null);
    if (!channel?.isTextBased()) return;

    const message = config.message
      .replaceAll('{user}', `${member}`)
      .replaceAll('{server}', member.guild.name);

    await channel.send(message).catch(console.error);
  }
};
