<p align="center">
  <img src="resources/logo.svg" width="80" alt="Clout" />
</p>

<h1 align="center">Clout</h1>
<p align="center"><strong>Karma, economy &amp; community for Discord.</strong></p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#docker">Docker</a> •
  <a href="#docs">Docs</a>
</p>

---

Clout is a full-stack Discord bot with a web dashboard: good/bad deeds, coins, mini-games, custom commands, music, and optional AI chat. One monorepo — bot, API, and Next.js frontend.

## Features

| Area | Highlights |
|------|------------|
| **Bot** | `/good` / `/bad` deeds, karma levels, `/daily`, `/balance`, `/pay`, `/leaderboard`, trivia, RPS, guess, custom slash commands, moderation (warn/kick/ban), music queue |
| **Dashboard** | Discord OAuth, start/stop/restart bot, **connected servers** (synced with bot guilds), server settings, embed editor, send embeds, commands, **live analytics** (DB + refresh), **admin** (mod log, bot settings, leave server, reset moderation) |
| **Stack** | Next.js 16, Express, PostgreSQL (Prisma), Discord.js v14, WebSocket, Docker |

## Quick Start

**Prerequisites:** Node.js 20+, PostgreSQL, [Discord Application](https://discord.com/developers/applications) (bot + OAuth2).

```bash
git clone https://github.com/krishs05/clout.git
cd clout
npm install
cp .env.example .env   # edit with your Discord credentials and JWT_SECRET
npm run db:push
npm run dev
```

- **Web:** http://localhost:3000  
- **API:** http://localhost:3001  
- **Bot:** run `npm run deploy-commands` once from `apps/bot`, then the bot process stays up via `npm run dev`. Connected servers in the dashboard sync with guilds the bot is in (even if the bot joined before the app was running).

## Docker

```bash
cp .env.example .env   # fill in Discord + JWT_SECRET
docker compose up -d --build
```

- **Web:** http://localhost:3000  
- **API:** http://localhost:3001  

See [DOCKER.md](DOCKER.md) for schema push, env vars, and port conflicts.

## GitHub Pages (frontend)

The frontend can be deployed as a static site to GitHub Pages. Pushes to `main` trigger a build and deploy.

1. **Enable Pages:** Repo **Settings → Pages → Build and deployment → Source** = **GitHub Actions**.
2. **Set build env (optional):** **Settings → Secrets and variables → Actions → Variables.** Add:
   - `NEXT_PUBLIC_API_URL` — your API base URL (e.g. `https://your-api.com`).
   - `NEXT_PUBLIC_DISCORD_CLIENT_ID` — Discord app client ID.
   - `NEXT_PUBLIC_WS_URL` — WebSocket URL (e.g. `wss://your-api.com/ws`).
   - `NEXT_PUBLIC_DISCORD_REDIRECT_URI` — OAuth callback (e.g. `https://<user>.github.io/clout/auth/callback`).
3. In your Discord app, set the OAuth2 redirect to `https://<your-github-username>.github.io/clout/auth/callback`.

Site URL: **https://\<username\>.github.io/clout/**

## Project layout

```
clout/
├── apps/
│   ├── web/       # Next.js (landing + dashboard)
│   ├── api/       # Express + WebSocket
│   └── bot/       # Discord.js bot
├── packages/
│   ├── database/  # Prisma schema & client
│   └── shared/    # Types & constants
├── resources/     # Logo and shared assets
├── docker-compose.yml
├── .env.example
├── DOCKER.md
└── AGENTS.md      # Dev guide for AI/contributors
```

## Docs

- **[AGENTS.md](AGENTS.md)** — Stack, structure, env, DB, commands, style.
- **[DOCKER.md](DOCKER.md)** — Docker run, env, troubleshooting.
- **[resources/](resources/)** — Logo and exportable assets.

## Bot commands (summary)

`/good`, `/bad`, `/profile`, `/daily`, `/balance`, `/pay`, `/leaderboard`, `/trivia`, `/rps`, `/guess`, `/command create|delete|list`, `/help`, plus moderation (`/warn`, `/kick`, `/ban`) and music. Moderation actions are logged and visible in the dashboard Admin panel.

## License

MIT.

<p align="center">
  <img src="resources/logo.svg" width="32" alt="" /> Clout — <em>Your karma, your currency.</em>
</p>
