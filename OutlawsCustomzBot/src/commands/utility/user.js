const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Show information about a user.')
    .addUserOption((option) =>
      option
        .setName('target')
        .setDescription('The user to inspect')
        .setRequired(false)
    ),
  async execute(interaction) {
    const member = interaction.options.getMember('target') ?? interaction.member;
    const user = member.user;

    const embed = new EmbedBuilder()
      .setColor(0x27ae60)
      .setTitle(user.tag)
      .setThumbnail(user.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: 'User ID', value: user.id, inline: true },
        { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true },
        { name: 'Discord Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  }
};
