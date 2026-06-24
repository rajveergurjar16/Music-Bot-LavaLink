import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
} from "discord.js";
import { Poru } from "poru";

const PREFIX = "!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});

const nodes = [
  {
    name: "main",
    host: process.env.LAVALINK_HOST || "127.0.0.1",
    port: Number(process.env.LAVALINK_PORT || 2333),
    password: process.env.LAVALINK_PASSWORD,
    secure: false,
  },
];

const poru = new Poru(client, nodes, {
  library: "discord.js",
  defaultPlatform: "ytmsearch",
  reconnectTries: 10,
  reconnectTimeout: 5000,
  resumeKey: process.env.LAVALINK_RESUME_KEY,
  resumeTimeout: 120,
  send: (guildId, packet) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(packet);
  },
});

function makeQueryCandidates(query) {
  return [`ytmsearch:${query}`, `ytsearch:${query}`, `scsearch:${query}`, query];
}

function scoreCandidate(meta, track) {
  let score = 0;
  const info = track.info || {};
  const candidateTitle = (info.title || "").toLowerCase();
  const candidateAuthor = (info.author || "").toLowerCase();

  if (meta.isrc && info.isrc && meta.isrc === info.isrc) score += 70;
  if (meta.artist && candidateAuthor.includes(meta.artist.toLowerCase())) score += 12;
  if (meta.album && candidateTitle.includes(meta.album.toLowerCase())) score += 6;

  const duration = Number(info.length || 0);
  const durationDiff = Math.abs((meta.durationMs || 0) - duration);
  if (durationDiff <= 2000) score += 8;
  else if (durationDiff <= 5000) score += 4;

  if (Number.isFinite(meta.popularity)) score += Math.min(4, Math.floor(meta.popularity / 25));
  return score;
}

async function resolveWithFallback(query, requester) {
  const meta = {
    query,
    requester,
    isrc: null,
    artist: null,
    album: null,
    durationMs: 0,
    popularity: 0,
  };

  let best = null;
  for (const candidateQuery of makeQueryCandidates(query)) {
    try {
      const result = await poru.resolve({ query: candidateQuery, requester });
      const tracks = result?.tracks || [];
      if (!tracks.length) continue;

      const top = tracks
        .map((track) => ({ track, score: scoreCandidate(meta, track) }))
        .sort((a, b) => b.score - a.score)[0];

      if (!best || top.score > best.score) best = top;
      if (best && best.score >= 75) break;
    } catch {
      // Continue fallback chain.
    }
  }

  return best?.track || null;
}

async function getOrCreatePlayer(message) {
  const guild = message.guild;
  const voiceChannel = message.member?.voice?.channel;

  if (!guild || !voiceChannel) {
    await message.reply("Join a voice channel first.");
    return null;
  }

  const me = guild.members.me;
  const perms = voiceChannel.permissionsFor(me);
  if (!perms?.has(PermissionsBitField.Flags.Connect) || !perms?.has(PermissionsBitField.Flags.Speak)) {
    await message.reply("I need Connect + Speak permissions in your voice channel.");
    return null;
  }

  let player = poru.players.get(guild.id);
  if (!player) {
    player = await poru.createConnection({
      guildId: guild.id,
      voiceChannel: voiceChannel.id,
      textChannel: message.channel.id,
      deaf: true,
      mute: false,
    });
  }

  return player;
}

client.once("ready", async () => {
  await poru.init();
  console.log(`[READY] ${client.user.tag}`);
});

poru.on("nodeConnect", (node) => {
  console.log(`[Poru] Node connected: ${node.name}`);
});

poru.on("nodeReconnect", (node) => {
  console.log(`[Poru] Node reconnecting: ${node.name}`);
});

poru.on("nodeDisconnect", (node, reason) => {
  console.error(`[Poru] Node disconnected: ${node.name}`, reason || "No reason");
});

poru.on("nodeError", (node, error) => {
  console.error(`[Poru] Node error: ${node.name}`, error);
});

poru.on("trackStart", (player, track) => {
  const ch = client.channels.cache.get(player.textChannel);
  if (ch?.isTextBased()) ch.send(`Now playing: **${track.info.title}**`);
});

poru.on("trackError", (player, track, error) => {
  console.error(`[Poru] Track error in guild ${player.guildId}`, error);
  const ch = client.channels.cache.get(player.textChannel);
  if (ch?.isTextBased()) ch.send(`Track failed: **${track?.info?.title || "Unknown"}**. Skipping.`);
  player.skip();
});

poru.on("queueEnd", (player) => {
  const ch = client.channels.cache.get(player.textChannel);
  if (ch?.isTextBased()) ch.send("Queue ended.");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const [cmd, ...args] = message.content.slice(PREFIX.length).trim().split(/\s+/);

  if (cmd === "play") {
    const query = args.join(" ");
    if (!query) {
      await message.reply("Usage: !play <song name or url>");
      return;
    }

    const player = await getOrCreatePlayer(message);
    if (!player) return;

    const track = await resolveWithFallback(query, message.author);
    if (!track) {
      await message.reply("No playable track found across fallback sources.");
      return;
    }

    player.queue.add(track);
    await message.reply(`Queued: **${track.info.title}**`);
    if (!player.isPlaying && !player.isPaused) player.play();
    return;
  }

  if (cmd === "skip") {
    const player = poru.players.get(message.guild.id);
    if (!player) return void message.reply("Nothing is playing.");
    player.skip();
    return void message.reply("Skipped.");
  }

  if (cmd === "stop") {
    const player = poru.players.get(message.guild.id);
    if (!player) return void message.reply("Nothing is active.");
    player.destroy();
    return void message.reply("Stopped and disconnected.");
  }

  if (cmd === "now") {
    const player = poru.players.get(message.guild.id);
    const current = player?.currentTrack;
    if (!current) return void message.reply("Nothing is playing.");
    return void message.reply(`Now playing: **${current.info.title}**`);
  }
});

client.login(process.env.DISCORD_TOKEN);
