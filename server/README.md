# Queensland Interactive Server

This Express server serves the website and proxies requests to Roblox and TikTok. For self-hosting instructions, see [docs/SELF_HOSTING.md](../docs/SELF_HOSTING.md).

## Quick start

```bash
cd server
npm install
npm start
```

The server listens on `http://localhost:3000` by default. Set `PORT` to use another port.

Feedback is submitted through `/feedback.html` and delivered using `DISCORD_WEBHOOK_URL`.

## Environment variables

Copy `.env.example` to `.env`, then set the values required by your deployment. The provided start scripts load this file. Never commit `.env`.

The server exposes Roblox, TikTok, feedback, moderation, Discord OAuth, notification, and live status endpoints under `/api` and `/auth`.
