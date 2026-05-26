const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');

const durationChoices = [
  { name: '5 minutes', value: 5 * 60 * 1000 },
  { name: '30 minutes', value: 30 * 60 * 1000 },
  { name: '1 hour', value: 60 * 60 * 1000 },
  { name: '1 day', value: 24 * 60 * 60 * 1000 },
  { name: '1 week', value: 7 * 24 * 60 * 60 * 1000 }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member.')
    .addUserOption((option) =>
      option.setName('target').setDescription('Member to timeout').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('duration')
        .setDescription('Timeout duration')
        .setRequired(true)
        .addChoices(...durationChoices)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the timeout').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const duration = interaction.options.getInteger('duration', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!target) {
      await interaction.reply({ content: 'I could not find that member in this server.', ephemeral: true });
      return;
    }

    if (!target.moderatable) {
      await interaction.reply({ content: 'I cannot timeout that member. Check my role position and permissions.', ephemeral: true });
      return;
    }

    await target.timeout(duration, reason);
    await interaction.reply(`Timed out **${target.user.tag}**. Reason: ${reason}`);
  }
};
