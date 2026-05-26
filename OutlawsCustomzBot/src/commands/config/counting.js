const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../services/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('counting')
    .setDescription('Configure the counting game.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setup')
        .setDescription('Enable counting in a channel')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('Counting channel').setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName('goal').setDescription('Counting goal').setMinValue(2).setRequired(false)
        )
        .addBooleanOption((option) =>
          option.setName('sudden-death').setDescription('Reset to 0 after mistakes').setRequired(false)
        )
        .addBooleanOption((option) =>
          option.setName('no-double-count').setDescription('Prevent same user counting twice').setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('status').setDescription('Show current counting status')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('reset').setDescription('Reset the current count')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('disable').setDescription('Disable counting')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'setup') {
      const channel = interaction.options.getChannel('channel', true);
      const goal = interaction.options.getInteger('goal') ?? 100;
      const suddenDeath = interaction.options.getBoolean('sudden-death') ?? false;
      const noDoubleCount = interaction.options.getBoolean('no-double-count') ?? true;

      updateGuildConfig(interaction.guildId, (config) => {
        config.counting = {
          enabled: true,
          channelId: channel.id,
          current: 0,
          goal,
          suddenDeath,
          noDoubleCount,
          lastUserId: null
        };
      });

      await interaction.reply({ content: `Counting is enabled in ${channel}. Goal: ${goal}.`, ephemeral: true });
      return;
    }

    if (subcommand === 'reset') {
      updateGuildConfig(interaction.guildId, (config) => {
        config.counting.current = 0;
        config.counting.lastUserId = null;
      });
      await interaction.reply({ content: 'Counting has been reset to 0.', ephemeral: true });
      return;
    }

    if (subcommand === 'disable') {
      updateGuildConfig(interaction.guildId, (config) => {
        config.counting.enabled = false;
      });
      await interaction.reply({ content: 'Counting is now disabled.', ephemeral: true });
      return;
    }

    const config = getGuildConfig(interaction.guildId).counting;
    await interaction.reply({
      content: `Counting is ${config.enabled ? 'enabled' : 'disabled'}.\nChannel: ${config.channelId ? `<#${config.channelId}>` : 'none'}\nCurrent: ${config.current}\nGoal: ${config.goal}\nSudden Death: ${config.suddenDeath ? 'on' : 'off'}\nNo Double Count: ${config.noDoubleCount ? 'on' : 'off'}`,
      ephemeral: true
    });
  }
};
