# Queensland Interactive Server

This Express server serves the website and proxies requests to Roblox and TikTok. For self-hosting instructions, see [docs/SELF_HOSTING.md](../docs/SELF_HOSTING.md).

## Quick start

```bash
cd server
npm install
npm start
```

The server listens on all network interfaces at port `3000` by default. Set `HOST` or `PORT` to change this. Check connectivity with `http://SERVER_ADDRESS:3000/api/health`. For public access, keep Node on port `3000` and use a router port forward plus an HTTPS reverse proxy.

Feedback is submitted through `/feedback.html` and delivered using `DISCORD_WEBHOOK_URL`.

## Environment variables

Copy `.env.example` to `.env`, then set the values required by your deployment. The provided start scripts load this file. Never commit `.env`.

The server exposes Roblox, TikTok, feedback, moderation, Discord OAuth, notification, and live status endpoints under `/api` and `/auth`. QLiTE Roblox player search, profile, and avatar lookups use the server-side `/api/roblox/users/search`, `/api/roblox/users/:userId`, and `/api/roblox/users/:userId/avatar` routes, so deploy the server when changing those dashboard features. Search results are cached briefly, and Roblox search rate limits are returned to the dashboard with a retry delay.

QLiTE sign-in requires Discord OAuth, `TRELLO_API_KEY`, and `TRELLO_API_TOKEN`. `QLITE_ALLOWED_ORIGINS` is a comma-separated allowlist for QLiTE browser requests; it defaults to the configured `WEBSITE_ORIGIN` and `WEBSITE_STATUS_URL` origins, with the production `www` hostname also allowed. Add any alternate deployment hostname there. Set `TRELLO_QLITE_ACCOUNTS_BOARD_ID` to the destination board; the server finds or creates a `QLiTE Accounts` list there. Optionally set `TRELLO_QLITE_ACCOUNTS_LIST_ID` to use a specific existing list instead. Users verify Discord, then set a password; the server stores only a salted scrypt password hash in `server/data/qlite-accounts.json`. Trello cards contain Discord account metadata only, never passwords or password hashes. Archive an account card or move it out of the configured list to revoke password access. Admins listed in `ADMIN_USER_IDS` can view QLiTE account status and re-allow or revoke accounts in the Admin Panel; re-allowing restores the Trello card to the configured accounts list. Keep `server/data` on persistent storage in deployments; the account database must survive server restarts.
