const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../services/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Configure and manage tickets.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setup')
        .setDescription('Create a ticket panel')
        .addChannelOption((option) =>
          option.setName('panel-channel').setDescription('Channel for the ticket panel').setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName('support-role').setDescription('Role that can see tickets').setRequired(true)
        )
        .addChannelOption((option) =>
          option.setName('category').setDescription('Category to create tickets in').setRequired(false)
        )
        .addChannelOption((option) =>
          option.setName('transcript-channel').setDescription('Where close logs should go').setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('status').setDescription('Show ticket settings')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('close')
        .setDescription('Close the current ticket channel')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'setup') {
      const panelChannel = interaction.options.getChannel('panel-channel', true);
      const supportRole = interaction.options.getRole('support-role', true);
      const category = interaction.options.getChannel('category');
      const transcriptChannel = interaction.options.getChannel('transcript-channel');

      updateGuildConfig(interaction.guildId, (config) => {
        config.tickets.enabled = true;
        config.tickets.panelChannelId = panelChannel.id;
        config.tickets.supportRoleId = supportRole.id;
        config.tickets.categoryId = category?.type === ChannelType.GuildCategory ? category.id : null;
        config.tickets.transcriptChannelId = transcriptChannel?.id ?? null;
      });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Support Tickets')
        .setDescription('Need help? Open a ticket and the support team will be with you soon.');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket:create')
          .setLabel('Open Ticket')
          .setStyle(ButtonStyle.Primary)
      );

      await panelChannel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `Ticket panel posted in ${panelChannel}.`, ephemeral: true });
      return;
    }

    if (subcommand === 'close') {
      const config = getGuildConfig(interaction.guildId).tickets;
      const ticket = Object.entries(config.openTickets).find(([, data]) => data.channelId === interaction.channelId);

      if (!ticket) {
        await interaction.reply({ content: 'This channel is not registered as an open ticket.', ephemeral: true });
        return;
      }

      updateGuildConfig(interaction.guildId, (guildConfig) => {
        delete guildConfig.tickets.openTickets[ticket[0]];
      });

      await interaction.reply('Closing this ticket in 5 seconds.');
      setTimeout(() => interaction.channel.delete('Ticket closed').catch(() => null), 5000);
      return;
    }

    const config = getGuildConfig(interaction.guildId).tickets;
    await interaction.reply({
      content: `Tickets are ${config.enabled ? 'enabled' : 'disabled'}.\nSupport Role: ${config.supportRoleId ? `<@&${config.supportRoleId}>` : 'none'}\nOpen Tickets: ${Object.keys(config.openTickets).length}`,
      ephemeral: true
    });
  }
};
