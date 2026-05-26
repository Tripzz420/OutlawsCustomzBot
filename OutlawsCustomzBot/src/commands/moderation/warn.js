const { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../services/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Manage member warnings.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Warn a member')
        .addUserOption((option) =>
          option.setName('target').setDescription('Member to warn').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('reason').setDescription('Reason for the warning').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('List warnings for a member')
        .addUserOption((option) =>
          option.setName('target').setDescription('Member to inspect').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('clear')
        .setDescription('Clear warnings for a member')
        .addUserOption((option) =>
          option.setName('target').setDescription('Member to clear').setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser('target', true);

    if (subcommand === 'add') {
      const reason = interaction.options.getString('reason', true);
      const warning = {
        reason,
        moderatorId: interaction.user.id,
        createdAt: Date.now()
      };

      const config = updateGuildConfig(interaction.guildId, (guildConfig) => {
        guildConfig.moderation.warnings[target.id] ??= [];
        guildConfig.moderation.warnings[target.id].push(warning);
      });

      const count = config.moderation.warnings[target.id].length;
      await interaction.reply(`Warned **${target.tag}**. They now have ${count} warning(s).`);
      return;
    }

    if (subcommand === 'clear') {
      updateGuildConfig(interaction.guildId, (guildConfig) => {
        guildConfig.moderation.warnings[target.id] = [];
      });

      await interaction.reply(`Cleared warnings for **${target.tag}**.`);
      return;
    }

    const warnings = getGuildConfig(interaction.guildId).moderation.warnings[target.id] ?? [];
    const description = warnings.length
      ? warnings
        .map((warning, index) => `${index + 1}. <t:${Math.floor(warning.createdAt / 1000)}:d> by <@${warning.moderatorId}> - ${warning.reason}`)
        .join('\n')
      : 'No warnings recorded.';

    const embed = new EmbedBuilder()
      .setColor(0xf2c94c)
      .setTitle(`Warnings for ${target.tag}`)
      .setDescription(description);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
