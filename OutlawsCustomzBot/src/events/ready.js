const { Events, ActivityType } = require('discord.js');
const { restoreMusic } = require('../services/musicService');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    client.user.setPresence({
      activities: [{ name: '/help coming soon', type: ActivityType.Listening }],
      status: 'online'
    });

    await restoreMusic(client);
  }
};
