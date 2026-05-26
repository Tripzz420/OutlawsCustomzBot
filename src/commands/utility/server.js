const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Show information about this server.'),
  async execute(interaction) {
    const { guild } = interaction;

    const embed = new EmbedBuilder()
      .setColor(0x2f80ed)
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 128 }))
      .addFields(
        { name: 'Members', value: `${guild.memberCount}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: 'Owner ID', value: guild.ownerId, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  }
};
