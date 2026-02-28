# Clout - Advanced Discord Bot

A full-stack Discord bot with a premium web dashboard, featuring good/bad deeds tracking, economy system, mini-games, music, and AI chat.

![Clout Banner](https://via.placeholder.com/1200x400/0a0a0f/6366f1?text=Clout+Bot)

## ✨ Features

### 🤖 Bot Features
- **Good/Bad Deeds System** — Users self-assign deeds, build karma reputation
- **Economy System** — Daily rewards, coin transfers, balance tracking
- **Mini-Games** — Trivia (50 coins), Rock Paper Scissors, Guess the Number
- **Custom Commands** — Server admins create custom slash commands
- **Music** — YouTube playback with queue management (coming soon)
- **AI Chat** — Conversational AI in DMs (coming soon)

### 🎨 Web Dashboard
- **3D Scrollytelling Landing Page** — Three.js with GSAP animations
- **Discord OAuth2 Login** — Secure authentication
- **Bot Controls** — Start/stop/restart from dashboard
- **Embed Editor** — Live preview with Discord-style rendering
- **Server Management** — Settings, custom commands, analytics

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 19, TypeScript, Tailwind CSS, Three.js, GSAP |
| **Backend** | Node.js, Express, TypeScript, WebSocket |
| **Database** | PostgreSQL, Prisma ORM |
| **Bot** | Discord.js v14 |
| **Deployment** | Docker, Docker Compose, Vercel |

## 📁 Project Structure

```
/clout
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # Express backend
│   └── bot/          # Discord bot
├── packages/
│   ├── database/     # Prisma schema & client
│   └── shared/       # Types & constants
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL
- Discord Application (Bot + OAuth2)

### 1. Clone & Install

```bash
git clone https://github.com/krishs05/clout.git
cd clout
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` in each app directory and fill in your values:

**Root `.env`:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/clout?schema=public"
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_REDIRECT_URI=http://localhost:3000/auth/callback
JWT_SECRET=your_random_secret
```

### 3. Database Setup

```bash
npm run db:push
```

### 4. Run Development

```bash
# Run all apps
npm run dev

# Or individually
cd apps/web && npm run dev    # http://localhost:3000
cd apps/api && npm run dev    # http://localhost:3001
cd apps/bot && npm run dev    # Bot process
```

### 5. Deploy Bot Commands

```bash
cd apps/bot
npm run deploy-commands
```

## 🐳 Docker Deployment

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## ☁️ Vercel Deployment (Frontend)

```bash
cd apps/web
vercel --prod
```

## 📝 Bot Commands

| Command | Description |
|---------|-------------|
| `/good <deed>` | Record a good deed |
| `/bad <deed>` | Record a bad deed |
| `/profile [@user]` | View karma profile |
| `/daily` | Claim daily reward (100 coins) |
| `/balance [@user]` | Check coin balance |
| `/pay @user <amount>` | Send coins |
| `/leaderboard` | Top 10 richest users |
| `/trivia` | Answer trivia for 50 coins |
| `/rps <choice>` | Rock Paper Scissors |
| `/guess <1-10>` | Guess the number |
| `/command create/delete/list` | Manage custom commands |
| `/help` | View all commands |

## 🔒 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `DISCORD_CLIENT_ID` | Discord app client ID |
| `DISCORD_CLIENT_SECRET` | Discord app client secret |
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `DISCORD_REDIRECT_URI` | OAuth callback URL |
| `JWT_SECRET` | Secret for JWT signing |
| `OPENAI_API_KEY` | (Optional) For AI chat feature |
| `YOUTUBE_API_KEY` | (Optional) For music feature |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License — feel free to use for personal or commercial projects.

## 🙏 Credits

Built with:
- [Discord.js](https://discord.js.org/)
- [Next.js](https://nextjs.org/)
- [Three.js](https://threejs.org/)
- [Prisma](https://prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Clout** — *Your karma, your currency.*
