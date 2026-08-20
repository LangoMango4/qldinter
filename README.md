# Queensland Interactive

Queensland Interactive is a static Roblox roleplay community website with an Express API proxy in `server/`.

## Layout

- `assets/images/` - shared logos, icons, and page media
- `scripts/` - shared browser JavaScript
- `styles/` - shared CSS
- `admin/`, `faq/`, `legal/`, and other named folders - public page areas
- `server/` - Express API proxy and persistent moderation state
- `service-worker.js` and `manifest.json` - root-scoped PWA files

## Local development

```bash
cd server
npm install
npm start
```

The site and API are served at `http://localhost:3000`.

For production setup on your own Windows or Linux server, see [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md).
