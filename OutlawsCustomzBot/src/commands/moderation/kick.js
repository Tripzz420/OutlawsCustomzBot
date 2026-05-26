const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server.')
    .addUserOption((option) =>
      option.setName('target').setDescription('Member to kick').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the kick').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!target) {
      await interaction.reply({ content: 'I could not find that member in this server.', ephemeral: true });
      return;
    }

    if (!target.kickable) {
      await interaction.reply({ content: 'I cannot kick that member. Check my role position and permissions.', ephemeral: true });
      return;
    }

    await target.kick(reason);
    await interaction.reply(`Kicked **${target.user.tag}**. Reason: ${reason}`);
  }
};
