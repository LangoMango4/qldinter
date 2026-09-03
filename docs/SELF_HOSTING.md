# Self-hosting Queensland Interactive

This project can run on your own Windows or Linux machine. If Node.js runs on a separate computer, that computer hosts the API while your normal web host serves the static website.

## Requirements

- Node.js 18 or newer
- A domain name pointing to your server
- HTTPS, especially for Discord OAuth, cookies, and the PWA
- A reverse proxy such as Nginx on Linux or IIS on Windows

## 1. Install and copy the project

Install Node.js from <https://nodejs.org/> on the separate Node.js computer. Copy or clone this repository there, then open a terminal in the repository folder.

```bash
cd server
npm install
cp .env.example .env
```

If the repository is not on the computer yet, copy or clone the complete project first. The `server` folder must contain `package.json`.

### Windows PowerShell

```powershell
cd C:\path\to\qldinter\server
Copy-Item .env.example .env
npm install
```

### Windows Command Prompt

```bat
cd /d C:\path\to\qldinter\server
copy .env.example .env
npm install
```

Replace `C:\path\to\qldinter` with the actual folder where you copied the project. `Copy-Item` only works in PowerShell; Command Prompt uses `copy`.

Edit `server/.env` and add the secrets you actually use. Set `WEBSITE_ORIGIN` to the exact public website origin, such as `https://queenslandinteractive-rblx.com`, without a trailing slash. At minimum, set `DISCORD_WEBHOOK_URL` if the feedback form should work. Set `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, and `ADMIN_USER_IDS` for Discord admin login.

## 2. Run the server

For a quick test:

```bash
cd server
node server.js
```

Or use the included scripts:

- Windows Command Prompt or File Explorer: `start-server.cmd`
- Windows PowerShell: `./start-server.ps1`
- Linux: `chmod +x start-server.sh && ./start-server.sh`

Do not double-click `server.js`. Windows opens `.js` files with Windows Script Host, but this file must be run by Node.js.

The default port is `3000`, and the server listens on all network interfaces. Test it on the Node.js computer with `http://localhost:3000/api/health`, then test it from another computer with `http://SERVER_LAN_IP:3000/api/health`. Find the server computer's LAN address with `ipconfig` and use its IPv4 address.

Allow the port through Windows Firewall (run PowerShell as Administrator on the server computer):

```powershell
New-NetFirewallRule -DisplayName "Queensland Interactive API" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

Set `API_SERVER_URL` in `scripts/config.js` to `http://SERVER_LAN_IP:3000` for LAN testing. For a public website, use the public HTTPS API URL instead, such as `https://api.your-domain.example`.

To use another port, set `PORT` in `.env` and allow that port in the firewall.

## Railway deployment

The API can run on Railway while the static site remains on GitHub Pages behind Cloudflare:

1. Create a Railway service from this repository and set its root directory to `server`.
2. Use `npm start` as the start command. Railway supplies `PORT`; do not hard-code it in Railway settings.
3. Copy the variables from `server/.env.example` into Railway Variables. Set `WEBSITE_ORIGIN` to the exact Cloudflare site origin.
4. Copy the Railway public domain into `scripts/config.js` as `API_SERVER_URL`, without a trailing slash.
5. Add the API domain and callback URL to the Discord Developer Portal. The callback is `/auth/discord/callback` on the Railway domain.

Railway's filesystem is not a durable backup location. The moderation state file should be backed up externally or moved to a database before relying on it in production.

## GitHub Pages and Cloudflare DNS

For an apex custom domain on GitHub Pages, create these four Cloudflare `A` records pointing to GitHub's documented Pages addresses:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

For an IPv6-enabled setup, GitHub also documents these `AAAA` records:

```text
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

Set the GitHub Pages DNS records to **DNS only** in Cloudflare while verifying the custom domain. A `CNAME` for `www` should point to the GitHub Pages hostname supplied by the repository owner. Keep the Railway API on its own hostname; do not point GitHub Pages records at Railway.

GitHub can change Pages infrastructure addresses, so verify this list against GitHub's current Pages documentation before applying DNS changes. Cloudflare does not require a special GitHub IP allowlist for normal DNS proxying.

## 3. Give the API computer a public address

Use a subdomain for the API, such as `api.your-domain.example`, and create a DNS `A` record pointing to the Node.js computer's public IPv4 address. If your provider supports it, also create an `AAAA` record for IPv6. The website computer and API computer can use different domains.

Configure the Node.js computer's router to forward ports `80` and `443` to it, and allow those ports through its firewall. Do not put `http://localhost:3000` in the frontend config: visitors' browsers interpret `localhost` as their own computer.

## 4. Add HTTPS with a reverse proxy

For Nginx on the Node.js computer, proxy the API subdomain to the Node process:

```nginx
server {
    listen 80;
    server_name api.your-domain.example;

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

Use Certbot or your host's certificate tooling to enable HTTPS, then redirect HTTP to HTTPS. On Windows, configure the equivalent reverse proxy in IIS with URL Rewrite and Application Request Routing. The API must use HTTPS when the website uses HTTPS.

## 5. Configure the website

Open `scripts/config.js` on the website computer and set the API computer's public HTTPS URL:

```javascript
API_SERVER_URL: "https://api.your-domain.example"
```

The frontend will call `/api/...` on that API host. Do not use the API computer's private address or `localhost` in this setting.

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

In the Discord Developer Portal, set the redirect URL to the API computer's exact HTTPS address in `.env`:

```text
https://api.your-domain.example/auth/discord/callback
```

Restart the server after changing environment variables. Do not put Discord client secrets or webhook URLs in browser files.

## Updating the site

Pull or copy new files, then restart the Node process. If the service worker serves old assets, increment `CACHE_NAME` in `service-worker.js` and reload the site once.
