const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { updateGuildConfig, getGuildConfig } = require('../../services/store');
const { connectAndPlay, stopGuildMusic } = require('../../services/musicService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('music24')
    .setDescription('Configure 24/7 music streaming.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setup')
        .setDescription('Set the 24/7 voice channel and stream URL')
        .addChannelOption((option) =>
          option.setName('voice-channel').setDescription('Voice channel to stay in').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('stream-url').setDescription('YouTube, SoundCloud, or direct stream URL').setRequired(true)
        )
        .addChannelOption((option) =>
          option.setName('text-channel').setDescription('Updates channel').setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('start').setDescription('Start 24/7 music')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('stop').setDescription('Stop 24/7 music')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('status').setDescription('Show music settings')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'setup') {
      const voiceChannel = interaction.options.getChannel('voice-channel', true);
      const streamUrl = interaction.options.getString('stream-url', true);
      const textChannel = interaction.options.getChannel('text-channel');

      updateGuildConfig(interaction.guildId, (config) => {
        config.music.enabled = true;
        config.music.voiceChannelId = voiceChannel.id;
        config.music.textChannelId = textChannel?.id ?? interaction.channelId;
        config.music.streamUrl = streamUrl;
      });

      await interaction.deferReply({ ephemeral: true });
      const connected = await connectAndPlay(interaction.client, interaction.guildId);
      await interaction.editReply(connected
        ? `24/7 music is enabled in ${voiceChannel}.`
        : 'Settings saved, but I could not join/play yet. Check the channel and stream URL.'
      );
      return;
    }

    if (subcommand === 'start') {
      updateGuildConfig(interaction.guildId, (config) => {
        config.music.enabled = true;
      });

      await interaction.deferReply({ ephemeral: true });
      const connected = await connectAndPlay(interaction.client, interaction.guildId);
      await interaction.editReply(connected ? '24/7 music started.' : 'Music settings are incomplete.');
      return;
    }

    if (subcommand === 'stop') {
      updateGuildConfig(interaction.guildId, (config) => {
        config.music.enabled = false;
      });
      stopGuildMusic(interaction.guildId);
      await interaction.reply({ content: '24/7 music stopped.', ephemeral: true });
      return;
    }

    const config = getGuildConfig(interaction.guildId).music;
    await interaction.reply({
      content: `24/7 music is ${config.enabled ? 'enabled' : 'disabled'}.\nVoice Channel: ${config.voiceChannelId ? `<#${config.voiceChannelId}>` : 'none'}\nStream URL: ${config.streamUrl ?? 'none'}`,
      ephemeral: true
    });
  }
};
