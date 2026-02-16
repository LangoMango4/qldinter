# Queensland Interactive API Proxy Server

This Express server proxies requests to Roblox and TikTok APIs to avoid CORS issues.

## Deploying to Railway.app

1. **Sign up/Login** to [Railway.app](https://railway.app)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account if needed
   - Select this repository

3. **Configure Root Directory**
   - In your service settings, set **Root Directory** to: `server`
   - This tells Railway to deploy only the server folder

4. **Deploy**
   - Railway will automatically detect the `package.json` and deploy
   - Wait for deployment to complete

5. **Get Your URL**
   - After deployment, Railway will give you a URL like: `https://your-app.up.railway.app`
   - Copy this URL

6. **Update config.js**
   - Open `/config.js` in the root of your project
   - Update `robloxProxyBase` to your Railway URL:
   ```javascript
   robloxProxyBase: "https://your-app.up.railway.app",
   ```
   - Commit and push the changes

7. **Test**
   - Visit your website
   - The Roblox Group Status and TikTok stats should now load

## Local Development

To run locally:
```bash
cd server
npm install
npm start
```

Server runs on http://localhost:3000

## Environment Variables

### Required for Feedback System

- `DISCORD_WEBHOOK_URL` - Discord webhook URL for receiving feedback submissions

### Optional for Live Operations Status (SSU/Uptime)

- `BOTGHOST_DASHBOARD_URL` - Link opened from the Active SSU card (default: `https://botghost.com/`)
- `BOTGHOST_SSU_STATUS_URL` - JSON endpoint for SSU status (supports `active`, `isActive`, or `status`)
- `SSU_WEBHOOK_TOKEN` - Shared secret for `/api/ssu/start` and `/api/ssu/end` webhook auth
- `WEBSITE_STATUS_URL` - URL to check website uptime (default: production site)
- `BOT_STATUS_URL` - URL to check bot uptime (BotGhost/public bot status endpoint)
- `GAME_STATUS_URL` - URL to check game uptime (default: Roblox game URL)

**To set in Railway:**
1. Go to your project settings
2. Navigate to "Variables" tab
3. Add `DISCORD_WEBHOOK_URL` with your Discord webhook URL
4. Railway will auto-redeploy

See [FEEDBACK_SETUP.md](../FEEDBACK_SETUP.md) for detailed setup instructions.

## API Endpoints

- `GET /api/group-status` - Roblox group member count, games count, and active players
- `GET /api/team-members` - Roblox team members with rank 198+
- `GET /api/tiktok-stats` - TikTok followers, likes, and video count
- `GET /api/ssu-status` - Current SSU state from local webhook state
- `POST /api/ssu/start` - Mark SSU active (for BotGhost webhooks)
- `POST /api/ssu/end` - Mark SSU inactive (for BotGhost webhooks)
- `GET /api/live-status` - Active SSU status plus uptime checks for website, bot, and game
- `POST /api/feedback` - Submit feedback or bug reports (sends to Discord webhook)

### BotGhost session mode examples

The webhook endpoints accept `mode` (or `type`/`session`) so you can show `SSU`, `SSD`, `SSP`, etc:

- Start SSU: `GET /api/ssu/start?token=YOUR_TOKEN&mode=SSU`
- Start SSD: `GET /api/ssu/start?token=YOUR_TOKEN&mode=SSD`
- End SSP: `GET /api/ssu/end?token=YOUR_TOKEN&mode=SSP`

If `mode` is provided, the site label becomes `MODE Active` or `MODE Inactive`.

## Caching

All endpoints cache responses:
- Group status: 1 minute
- Team members: 5 minutes
- TikTok stats: 10 minutes
- Live status: 30 seconds
