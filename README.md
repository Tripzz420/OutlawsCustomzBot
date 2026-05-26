# Multi-Function Discord Bot

A clean Discord.js bot starter with slash commands, event loading, and room to add more features.

## Features

- Slash command loader
- Guild command deployment for fast testing
- Utility commands: `/ping`, `/server`, `/user`
- Fun command: `/coinflip`
- Moderation commands: `/ban`, `/kick`, `/timeout`, `/warn`, `/purge`
- Welcome messages
- Counting game with Sudden Death, goals, and No Double Count
- Ticket system with support roles and close buttons
- 24/7 music streaming
- Railway-friendly web panel
- Environment-based secrets

## Setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:

   - `DISCORD_TOKEN`: your bot token
   - `DISCORD_CLIENT_ID`: your Discord application client ID
   - `DISCORD_GUILD_ID`: your test server ID
   - `PANEL_KEY`: a private password for the web panel
   - `PUBLIC_URL`: your Railway public URL, once Railway gives you one

3. Deploy slash commands:

   ```powershell
   npm run deploy:commands
   ```

4. Start the bot:

   ```powershell
   npm start
   ```

## Discord Developer Portal Checklist

- Create an application at https://discord.com/developers/applications
- Add a bot user
- Enable the bot token and copy it into `.env`
- Invite the bot with the `bot` and `applications.commands` scopes
- Give it permissions for moderation, tickets, messages, and voice
- Enable the Server Members intent
- Enable the Message Content intent for the counting game

## Railway Hosting

1. Push this project to GitHub.
2. Create a new Railway project from the GitHub repo.
3. Add these Railway variables:

   ```text
   DISCORD_TOKEN=your_bot_token
   DISCORD_CLIENT_ID=your_application_client_id
   DISCORD_GUILD_ID=your_test_server_id
   PANEL_KEY=a_long_private_password
   PUBLIC_URL=https://your-railway-url.up.railway.app
   ```

4. Railway will install dependencies and run `npm start`.
5. Open the Railway public URL and enter your `PANEL_KEY`.

Railway's filesystem can reset between deploys. For a production bot, move `data/store.json` to a database such as PostgreSQL or MongoDB. The JSON store is perfect for getting the bot built and tested quickly.

## Main Commands

### Moderation

- `/ban target reason`
- `/kick target reason`
- `/timeout target duration reason`
- `/warn add target reason`
- `/warn list target`
- `/warn clear target`
- `/purge amount`

### Welcome

- `/welcome setup channel message`
- `/welcome test`
- `/welcome disable`

### Counting

- `/counting setup channel goal sudden-death no-double-count`
- `/counting status`
- `/counting reset`
- `/counting disable`

### Tickets

- `/ticket setup panel-channel support-role category transcript-channel`
- `/ticket status`
- `/ticket close`

### Music

- `/music24 setup voice-channel stream-url text-channel`
- `/music24 start`
- `/music24 stop`
- `/music24 status`

## Project Structure

```text
src/
  commands/
    config/
    fun/
    music/
    moderation/
    tickets/
    utility/
  events/
  services/
  web/
  deploy-commands.js
  index.js
```

Add a new command by creating a `.js` file under `src/commands/<category>/` that exports `data` and `execute`.
