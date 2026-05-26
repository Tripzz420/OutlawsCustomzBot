const {
  ChannelType,
  Events,
  PermissionFlagsBits
} = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../services/store');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isButton() && interaction.customId === 'ticket:create') {
      await handleTicketCreate(interaction);
      return;
    }

    if (interaction.isButton() && interaction.customId === 'ticket:close') {
      await handleTicketClose(interaction);
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);

      const message = {
        content: 'Something went wrong while running that command.',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(message);
      } else {
        await interaction.reply(message);
      }
    }
  }
};

async function handleTicketCreate(interaction) {
  const config = getGuildConfig(interaction.guildId).tickets;

  if (!config.enabled || !config.supportRoleId) {
    await interaction.reply({ content: 'Tickets are not configured yet.', ephemeral: true });
    return;
  }

  if (config.openTickets[interaction.user.id]) {
    await interaction.reply({
      content: `You already have an open ticket: <#${config.openTickets[interaction.user.id].channelId}>`,
      ephemeral: true
    });
    return;
  }

  const ticketNumber = config.nextTicketNumber;
  const channel = await interaction.guild.channels.create({
    name: `ticket-${ticketNumber}`,
    type: ChannelType.GuildText,
    parent: config.categoryId,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ]
      },
      {
        id: config.supportRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages
        ]
      }
    ],
    reason: `Ticket opened by ${interaction.user.tag}`
  });

  updateGuildConfig(interaction.guildId, (guildConfig) => {
    guildConfig.tickets.nextTicketNumber += 1;
    guildConfig.tickets.openTickets[interaction.user.id] = {
      channelId: channel.id,
      openedAt: Date.now()
    };
  });

  const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Ticket Opened')
    .setDescription(`${interaction.user}, a support team member will help you soon.`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket:close')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `<@&${config.supportRoleId}>`,
    embeds: [embed],
    components: [row]
  });

  await interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });
}

async function handleTicketClose(interaction) {
  const config = getGuildConfig(interaction.guildId).tickets;
  const ticket = Object.entries(config.openTickets).find(([, data]) => data.channelId === interaction.channelId);

  if (!ticket) {
    await interaction.reply({ content: 'This channel is not registered as an open ticket.', ephemeral: true });
    return;
  }

  updateGuildConfig(interaction.guildId, (guildConfig) => {
    delete guildConfig.tickets.openTickets[ticket[0]];
  });

  if (config.transcriptChannelId) {
    const transcriptChannel = await interaction.guild.channels.fetch(config.transcriptChannelId).catch(() => null);
    await transcriptChannel?.send(`Ticket ${interaction.channel} was closed by ${interaction.user}.`).catch(() => null);
  }

  await interaction.reply('Closing this ticket in 5 seconds.');
  setTimeout(() => interaction.channel.delete('Ticket closed').catch(() => null), 5000);
}
