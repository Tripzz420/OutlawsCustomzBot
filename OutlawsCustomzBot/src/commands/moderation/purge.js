const {
  PermissionFlagsBits,
  SlashCommandBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete recent messages from this channel.')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete, from 1 to 100')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount', true);

    if (!interaction.channel?.bulkDelete) {
      await interaction.reply({
        content: 'This command can only be used in a server text channel.',
        ephemeral: true
      });
      return;
    }

    const deleted = await interaction.channel.bulkDelete(amount, true);

    await interaction.reply({
      content: `Deleted ${deleted.size} message(s). Messages older than 14 days cannot be bulk deleted.`,
      ephemeral: true
    });
  }
};
