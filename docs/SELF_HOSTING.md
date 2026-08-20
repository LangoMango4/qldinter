# Self-hosting Queensland Interactive

This project can run entirely on your own Windows or Linux machine. The Express server serves the static website and API together, so the browser can use the same domain without a separate hosted API.

## Requirements

- Node.js 18 or newer
- A domain name pointing to your server
- HTTPS, especially for Discord OAuth, cookies, and the PWA
- A reverse proxy such as Nginx on Linux or IIS on Windows

## 1. Install and copy the project

Install Node.js from <https://nodejs.org/>. Copy or clone this repository to the server, then open a terminal in the repository folder.

```bash
cd server
npm install
cp .env.example .env
```

On Windows, use `Copy-Item .env.example .env` instead of `cp`.

Edit `server/.env` and add the secrets you actually use. At minimum, set `DISCORD_WEBHOOK_URL` if the feedback form should work. Set `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, and `ADMIN_USER_IDS` for Discord admin login.

## 2. Run the server

For a quick test:

```bash
cd server
npm start
```

Or use the included scripts:

- Windows PowerShell: `./start-server.ps1`
- Linux: `chmod +x start-server.sh && ./start-server.sh`

The default address is `http://localhost:3000`. Test it locally by opening that address and checking `/api/group-status`.

To use another port, set `PORT` in `.env`.

## 3. Point your domain to the server

Create a DNS `A` record for your domain pointing to the server's public IPv4 address. If your provider supports it, also create an `AAAA` record for IPv6.

Do not expose port `3000` directly to the public internet when a reverse proxy is available. Allow inbound ports `80` and `443`, and keep port `3000` local.

## 4. Add HTTPS with a reverse proxy

For Nginx, proxy your domain to the Node process:

```nginx
server {
    listen 80;
    server_name your-domain.example;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Use Certbot or your host's certificate tooling to enable HTTPS, then redirect HTTP to HTTPS. On Windows, configure the equivalent reverse proxy in IIS with URL Rewrite and Application Request Routing.

## 5. Configure the website

Open `scripts/config.js` and leave this setting empty when the website and API share the same domain:

```javascript
API_SERVER_URL: ""
```

The frontend will call `/api/...` on its current origin. Only set a full URL when the API is hosted on a different domain, for example `https://api.your-domain.example`.

## 6. Keep the process running

For Linux, use systemd, PM2, or Docker. A minimal systemd service looks like this:

```ini
[Unit]
Description=Queensland Interactive
After=network.target

[Service]
WorkingDirectory=/var/www/qldinter/server
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

For Windows, use NSSM or Task Scheduler to run `server/start-server.ps1` at startup. Restrict file permissions on `.env` and back up `server/data/moderation-state.json` regularly.

## 7. Update Discord OAuth

In the Discord Developer Portal, set the redirect URL to the exact HTTPS address in `.env`:

```text
https://your-domain.example/auth/discord/callback
```

Restart the server after changing environment variables. Do not put Discord client secrets or webhook URLs in browser files.

## Updating the site

Pull or copy new files, then restart the Node process. If the service worker serves old assets, increment `CACHE_NAME` in `service-worker.js` and reload the site once.
