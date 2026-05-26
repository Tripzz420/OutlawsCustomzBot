const {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnectionStatus
} = require('@discordjs/voice');
const play = require('play-dl');
const { getAllGuilds, getGuildConfig } = require('./store');

const players = new Map();

async function createResource(url, volume) {
  const stream = await play.stream(url);
  const resource = createAudioResource(stream.stream, {
    inputType: stream.type,
    inlineVolume: true
  });

  resource.volume?.setVolume(volume);
  return resource;
}

async function connectAndPlay(client, guildId) {
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return false;

  const config = getGuildConfig(guildId).music;
  if (!config.enabled || !config.voiceChannelId || !config.streamUrl) return false;

  const channel = await guild.channels.fetch(config.voiceChannelId).catch(() => null);
  if (!channel || !channel.isVoiceBased()) return false;

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true
  });

  const player = players.get(guildId) ?? createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play
    }
  });

  players.set(guildId, player);
  connection.subscribe(player);

  async function playConfiguredStream() {
    try {
      player.play(await createResource(config.streamUrl, config.volume ?? 0.5));
    } catch (error) {
      console.error(`Could not play music stream for ${guildId}`, error);
      setTimeout(playConfiguredStream, 15000);
    }
  }

  player.removeAllListeners(AudioPlayerStatus.Idle);
  player.on(AudioPlayerStatus.Idle, playConfiguredStream);

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5000)
      ]);
    } catch {
      connection.destroy();
      setTimeout(() => connectAndPlay(client, guildId), 15000);
    }
  });

  await playConfiguredStream();
  return true;
}

function stopGuildMusic(guildId) {
  const player = players.get(guildId);
  const connection = getVoiceConnection(guildId);

  player?.stop();
  connection?.destroy();
  players.delete(guildId);
}

async function restoreMusic(client) {
  const guilds = getAllGuilds();

  for (const guildId of Object.keys(guilds)) {
    if (guilds[guildId].music?.enabled) {
      await connectAndPlay(client, guildId);
    }
  }
}

module.exports = {
  connectAndPlay,
  restoreMusic,
  stopGuildMusic
};
