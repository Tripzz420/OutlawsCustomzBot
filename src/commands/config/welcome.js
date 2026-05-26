const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../services/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configure welcome messages.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setup')
        .setDescription('Enable welcome messages')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('Welcome channel').setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('message')
            .setDescription('Use {user} and {server} as placeholders')
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('disable').setDescription('Disable welcome messages')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('test').setDescription('Send a test welcome message')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'disable') {
      updateGuildConfig(interaction.guildId, (config) => {
        config.welcome.enabled = false;
      });
      await interaction.reply({ content: 'Welcome messages are now disabled.', ephemeral: true });
      return;
    }

    if (subcommand === 'setup') {
      const channel = interaction.options.getChannel('channel', true);
      const message = interaction.options.getString('message');

      updateGuildConfig(interaction.guildId, (config) => {
        config.welcome.enabled = true;
        config.welcome.channelId = channel.id;
        if (message) config.welcome.message = message;
      });

      await interaction.reply({ content: `Welcome messages will be sent in ${channel}.`, ephemeral: true });
      return;
    }

    const config = getGuildConfig(interaction.guildId).welcome;

    if (!config.enabled || !config.channelId) {
      await interaction.reply({ content: 'Welcome messages are not configured yet.', ephemeral: true });
      return;
    }

    const channel = await interaction.guild.channels.fetch(config.channelId).catch(() => null);
    const text = config.message
      .replaceAll('{user}', `${interaction.user}`)
      .replaceAll('{server}', interaction.guild.name);

    await channel?.send(text);
    await interaction.reply({ content: 'Sent a test welcome message.', ephemeral: true });
  }
};
