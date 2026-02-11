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

No environment variables needed - the server is pre-configured!

## API Endpoints

- `GET /api/group-status` - Roblox group member count, games count, and active players
- `GET /api/team-members` - Roblox team members with rank 198+
- `GET /api/tiktok-stats` - TikTok followers, likes, and video count

## Caching

All endpoints cache responses:
- Group status: 1 minute
- Team members: 5 minutes
- TikTok stats: 10 minutes
