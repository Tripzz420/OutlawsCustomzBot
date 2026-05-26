const express = require('express');
const { getAllGuilds, getGuildConfig, updateGuildConfig } = require('../services/store');
const { connectAndPlay, stopGuildMusic } = require('../services/musicService');

function startPanel(client) {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const panelKey = process.env.PANEL_KEY;

  app.use(express.urlencoded({ extended: true }));

  app.use((request, response, next) => {
    if (!panelKey) {
      response.status(503).send('Set PANEL_KEY before using the web panel.');
      return;
    }

    if (request.query.key !== panelKey && request.body.key !== panelKey) {
      response.status(401).send(loginPage());
      return;
    }

    next();
  });

  app.get('/', async (request, response) => {
    const guilds = await client.guilds.fetch();
    const savedGuilds = getAllGuilds();

    response.send(layout('Bot Panel', `
      <section class="hero">
        <h1>Discord Bot Panel</h1>
        <p>Online as ${client.user?.tag ?? 'starting...'}</p>
      </section>
      <section class="grid">
        ${guilds.map((guild) => guildCard(guild, savedGuilds[guild.id], request.query.key)).join('')}
      </section>
    `));
  });

  app.get('/guild/:guildId', async (request, response) => {
    const guild = await client.guilds.fetch(request.params.guildId).catch(() => null);
    if (!guild) {
      response.status(404).send('Guild not found.');
      return;
    }

    const config = getGuildConfig(guild.id);
    response.send(layout(guild.name, guildSettings(guild, config, request.query.key)));
  });

  app.post('/guild/:guildId', async (request, response) => {
    const guildId = request.params.guildId;
    const action = request.body.action;

    updateGuildConfig(guildId, (config) => {
      if (action === 'welcome') {
        config.welcome.enabled = request.body.enabled === 'on';
        config.welcome.channelId = clean(request.body.channelId);
        config.welcome.message = clean(request.body.message) || config.welcome.message;
      }

      if (action === 'counting') {
        config.counting.enabled = request.body.enabled === 'on';
        config.counting.channelId = clean(request.body.channelId);
        config.counting.goal = Number(request.body.goal) || config.counting.goal;
        config.counting.suddenDeath = request.body.suddenDeath === 'on';
        config.counting.noDoubleCount = request.body.noDoubleCount === 'on';
      }

      if (action === 'music') {
        config.music.enabled = request.body.enabled === 'on';
        config.music.voiceChannelId = clean(request.body.voiceChannelId);
        config.music.textChannelId = clean(request.body.textChannelId);
        config.music.streamUrl = clean(request.body.streamUrl);
      }

      if (action === 'tickets') {
        config.tickets.enabled = request.body.enabled === 'on';
        config.tickets.supportRoleId = clean(request.body.supportRoleId);
        config.tickets.categoryId = clean(request.body.categoryId);
        config.tickets.transcriptChannelId = clean(request.body.transcriptChannelId);
      }
    });

    if (action === 'music') {
      const config = getGuildConfig(guildId).music;
      if (config.enabled) {
        await connectAndPlay(client, guildId);
      } else {
        stopGuildMusic(guildId);
      }
    }

    response.redirect(`/guild/${guildId}?key=${encodeURIComponent(request.body.key)}`);
  });

  app.listen(port, () => {
    console.log(`Web panel listening on port ${port}`);
  });
}

function clean(value) {
  return value?.trim() || null;
}

function loginPage() {
  return layout('Login', `
    <main class="login">
      <form method="get" action="/">
        <h1>Bot Panel</h1>
        <label>Panel Key</label>
        <input name="key" type="password" autocomplete="current-password">
        <button type="submit">Open Panel</button>
      </form>
    </main>
  `);
}

function guildCard(guild, config, key) {
  return `
    <article class="card">
      <h2>${escapeHtml(guild.name)}</h2>
      <p>${config ? 'Configured' : 'Not configured yet'}</p>
      <a class="button" href="/guild/${guild.id}?key=${encodeURIComponent(key)}">Manage</a>
    </article>
  `;
}

function guildSettings(guild, config, key) {
  return `
    <a href="/?key=${encodeURIComponent(key)}" class="back">Back</a>
    <section class="hero">
      <h1>${escapeHtml(guild.name)}</h1>
      <p>Paste Discord IDs for channels, categories, and roles.</p>
    </section>
    <section class="settings">
      ${settingsForm(guild.id, key, 'welcome', 'Welcome Messages', [
        checkbox('enabled', config.welcome.enabled, 'Enabled'),
        input('channelId', config.welcome.channelId, 'Welcome Channel ID'),
        input('message', config.welcome.message, 'Welcome Message')
      ])}
      ${settingsForm(guild.id, key, 'counting', 'Counting', [
        checkbox('enabled', config.counting.enabled, 'Enabled'),
        input('channelId', config.counting.channelId, 'Counting Channel ID'),
        input('goal', config.counting.goal, 'Goal', 'number'),
        checkbox('suddenDeath', config.counting.suddenDeath, 'Sudden Death'),
        checkbox('noDoubleCount', config.counting.noDoubleCount, 'No Double Count')
      ])}
      ${settingsForm(guild.id, key, 'tickets', 'Tickets', [
        checkbox('enabled', config.tickets.enabled, 'Enabled'),
        input('supportRoleId', config.tickets.supportRoleId, 'Support Role ID'),
        input('categoryId', config.tickets.categoryId, 'Ticket Category ID'),
        input('transcriptChannelId', config.tickets.transcriptChannelId, 'Transcript Channel ID')
      ])}
      ${settingsForm(guild.id, key, 'music', '24/7 Music', [
        checkbox('enabled', config.music.enabled, 'Enabled'),
        input('voiceChannelId', config.music.voiceChannelId, 'Voice Channel ID'),
        input('textChannelId', config.music.textChannelId, 'Text Channel ID'),
        input('streamUrl', config.music.streamUrl, 'Stream URL')
      ])}
    </section>
  `;
}

function settingsForm(guildId, key, action, title, controls) {
  return `
    <form class="card form" method="post" action="/guild/${guildId}">
      <input type="hidden" name="key" value="${escapeHtml(key)}">
      <input type="hidden" name="action" value="${action}">
      <h2>${title}</h2>
      ${controls.join('')}
      <button type="submit">Save</button>
    </form>
  `;
}

function input(name, value, label, type = 'text') {
  return `
    <label>
      <span>${label}</span>
      <input name="${name}" type="${type}" value="${escapeHtml(value ?? '')}">
    </label>
  `;
}

function checkbox(name, checked, label) {
  return `
    <label class="check">
      <input name="${name}" type="checkbox" ${checked ? 'checked' : ''}>
      <span>${label}</span>
    </label>
  `;
}

function layout(title, body) {
  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(title)}</title>
        <style>
          :root {
            color-scheme: light;
            --bg: #f5f7fb;
            --ink: #172033;
            --muted: #647084;
            --panel: #ffffff;
            --line: #dfe5ef;
            --blue: #3164d9;
            --green: #148a62;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            background: var(--bg);
            color: var(--ink);
            font-family: Inter, Segoe UI, Arial, sans-serif;
          }
          main, body > section, .settings, .grid, .hero, .back { max-width: 1100px; margin-inline: auto; }
          .hero { padding: 32px 20px 16px; }
          h1 { margin: 0 0 8px; font-size: 32px; }
          h2 { margin: 0 0 16px; font-size: 18px; }
          p { color: var(--muted); margin: 0; }
          .grid, .settings {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
            padding: 16px 20px 40px;
          }
          .card {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 18px;
            box-shadow: 0 10px 24px rgba(20, 32, 55, 0.06);
          }
          .button, button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 40px;
            border: 0;
            border-radius: 6px;
            background: var(--blue);
            color: white;
            font-weight: 700;
            text-decoration: none;
            padding: 0 14px;
            cursor: pointer;
          }
          label { display: grid; gap: 6px; margin: 12px 0; color: var(--muted); font-size: 13px; }
          input {
            width: 100%;
            min-height: 40px;
            border: 1px solid var(--line);
            border-radius: 6px;
            padding: 8px 10px;
            color: var(--ink);
            font: inherit;
          }
          .check { display: flex; align-items: center; gap: 8px; color: var(--ink); }
          .check input { width: 18px; min-height: 18px; }
          .back { display: block; padding: 20px 20px 0; color: var(--blue); font-weight: 700; }
          .login { min-height: 100vh; display: grid; place-items: center; padding: 20px; }
          .login form { width: min(420px, 100%); background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 24px; }
        </style>
      </head>
      <body>${body}</body>
    </html>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

module.exports = {
  startPanel
};
