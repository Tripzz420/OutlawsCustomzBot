const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .addUserOption((option) =>
      option.setName('target').setDescription('Member to ban').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the ban').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!target) {
      await interaction.reply({ content: 'I could not find that member in this server.', ephemeral: true });
      return;
    }

    if (!target.bannable) {
      await interaction.reply({ content: 'I cannot ban that member. Check my role position and permissions.', ephemeral: true });
      return;
    }

    await target.ban({ reason });
    await interaction.reply(`Banned **${target.user.tag}**. Reason: ${reason}`);
  }
};
