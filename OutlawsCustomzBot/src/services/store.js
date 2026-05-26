const fs = require('node:fs');
const path = require('node:path');

const dataDirectory = path.join(__dirname, '..', '..', 'data');
const dataFile = path.join(dataDirectory, 'store.json');

const defaultState = {
  guilds: {}
};

function ensureStore() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(defaultState, null, 2));
  }
}

function readStore() {
  ensureStore();

  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (error) {
    console.error('Failed to read data store. Rebuilding it from defaults.', error);
    return structuredClone(defaultState);
  }
}

function writeStore(state) {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2));
}

function defaultGuildConfig() {
  return {
    welcome: {
      enabled: false,
      channelId: null,
      message: 'Welcome {user} to {server}!'
    },
    counting: {
      enabled: false,
      channelId: null,
      current: 0,
      goal: 100,
      suddenDeath: false,
      noDoubleCount: true,
      lastUserId: null
    },
    moderation: {
      warnings: {}
    },
    tickets: {
      enabled: false,
      panelChannelId: null,
      categoryId: null,
      supportRoleId: null,
      transcriptChannelId: null,
      nextTicketNumber: 1,
      openTickets: {}
    },
    music: {
      enabled: false,
      voiceChannelId: null,
      textChannelId: null,
      streamUrl: null,
      volume: 0.5
    }
  };
}

function getGuildConfig(guildId) {
  const state = readStore();

  if (!state.guilds[guildId]) {
    state.guilds[guildId] = defaultGuildConfig();
    writeStore(state);
  }

  return state.guilds[guildId];
}

function updateGuildConfig(guildId, updater) {
  const state = readStore();

  if (!state.guilds[guildId]) {
    state.guilds[guildId] = defaultGuildConfig();
  }

  updater(state.guilds[guildId]);
  writeStore(state);

  return state.guilds[guildId];
}

function getAllGuilds() {
  return readStore().guilds;
}

module.exports = {
  getAllGuilds,
  getGuildConfig,
  updateGuildConfig
};
