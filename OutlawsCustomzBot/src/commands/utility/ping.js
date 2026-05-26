const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot response time.'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const roundTrip = sent.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply(`Pong! Round trip: ${roundTrip}ms. WebSocket: ${interaction.client.ws.ping}ms.`);
  }
};
