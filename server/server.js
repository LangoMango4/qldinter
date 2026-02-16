const express = require("express");
const { randomUUID } = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const GROUP_ID = 35458162;
const TIKTOK_HANDLE = "qldinteractive";
const TIKTOK_URL = `https://www.tiktok.com/@${TIKTOK_HANDLE}`;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || "";
const SSU_CHANNEL_URL = "https://discord.com/channels/1325971748377595934/1326450150595624981";
const BOTGHOST_DASHBOARD_URL = process.env.BOTGHOST_DASHBOARD_URL || SSU_CHANNEL_URL;
const BOTGHOST_SSU_STATUS_URL = process.env.BOTGHOST_SSU_STATUS_URL || "";
const SSU_WEBHOOK_TOKEN = process.env.SSU_WEBHOOK_TOKEN || "";
const BOT_LINK_WEBHOOK_URL = process.env.BOT_LINK_WEBHOOK_URL || DISCORD_WEBHOOK_URL;
const BOT_AUTH_TOKEN = process.env.BOT_AUTH_TOKEN || SSU_WEBHOOK_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "https://queenslandinteractive-rblx.com/auth/discord/callback";
const DISCORD_OAUTH_SCOPES = process.env.DISCORD_OAUTH_SCOPES || "identify email guilds";
const SESSION_COOKIE_NAME = "qldinter_session";
const WEBSITE_STATUS_URL = process.env.WEBSITE_STATUS_URL || "https://queenslandinteractive-rblx.com/";
const GAME_STATUS_URL = process.env.GAME_STATUS_URL || "https://www.roblox.com/games/74079904616243/Westlands-Queenlands";
const WEBSITE_ROOT = path.resolve(__dirname, "..");
app.use(express.json());
app.set("trust proxy", 1);

const botAuthChallenges = new Map();
const oauthStates = new Map();
const discordSessions = new Map();

const fetchJson = async (url) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const cache = {
  groupStatus: { value: null, expiresAt: 0 },
  teamMembers: { value: null, expiresAt: 0 },
  tiktokStats: { value: null, expiresAt: 0 },
  liveStatus: { value: null, expiresAt: 0 }
};

const ssuState = {
  active: false,
  label: "Inactive",
  link: BOTGHOST_DASHBOARD_URL,
  source: "local",
  updatedAt: new Date().toISOString()
};

const withCache = async (key, ttlMs, loader) => {
  const now = Date.now();
  const entry = cache[key];
  if (entry.value && entry.expiresAt > now) {
    return entry.value;
  }
  const value = await loader();
  cache[key] = { value, expiresAt: now + ttlMs };
  return value;
};

const cleanupBotAuthChallenges = () => {
  const now = Date.now();
  for (const [id, challenge] of botAuthChallenges.entries()) {
    if (challenge.expiresAt <= now) {
      botAuthChallenges.delete(id);
    }
  }
};

const generateBotLoginCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};

const parseCookies = (req) => {
  const cookieHeader = req.headers.cookie || "";
  return cookieHeader.split(";").reduce((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) {
      return acc;
    }
    acc[rawKey] = decodeURIComponent(rawValue.join("=") || "");
    return acc;
  }, {});
};

const setSessionCookie = (res, token, maxAgeMs) => {
  const maxAgeSeconds = Math.max(0, Math.floor(maxAgeMs / 1000));
  const cookie = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ].join("; ");
  res.setHeader("Set-Cookie", cookie);
};

const clearSessionCookie = (res) => {
  const cookie = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0"
  ].join("; ");
  res.setHeader("Set-Cookie", cookie);
};

const cleanupDiscordAuthState = () => {
  const now = Date.now();
  for (const [key, state] of oauthStates.entries()) {
    if (state.expiresAt <= now) {
      oauthStates.delete(key);
    }
  }
};

const cleanupDiscordSessions = () => {
  const now = Date.now();
  for (const [token, session] of discordSessions.entries()) {
    if (session.expiresAt <= now) {
      discordSessions.delete(token);
    }
  }
};

const getDiscordSession = (req) => {
  cleanupDiscordSessions();
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }

  const session = discordSessions.get(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    discordSessions.delete(token);
    return null;
  }

  return {
    token,
    ...session
  };
};

const checkServiceHealth = async (url) => {
  if (!url) {
    return {
      state: "Not configured",
      online: false,
      responseMs: null,
      detail: "No URL configured"
    };
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "QI-StatusMonitor/1.0"
      }
    });

    clearTimeout(timeoutId);
    return {
      state: response.ok ? "Online" : "Offline",
      online: response.ok,
      responseMs: Date.now() - startedAt,
      detail: `HTTP ${response.status}`,
      url
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      state: "Offline",
      online: false,
      responseMs: null,
      detail: error && error.name === "AbortError" ? "Timed out" : "Request failed",
      url
    };
  }
};

const fetchSsuStatus = async () => {
  if (!BOTGHOST_SSU_STATUS_URL) {
    return {
      active: ssuState.active,
      label: ssuState.label,
      link: ssuState.link,
      source: ssuState.source,
      updatedAt: ssuState.updatedAt
    };
  }

  try {
    const data = await fetchJson(BOTGHOST_SSU_STATUS_URL);
    const statusText = typeof data.status === "string" ? data.status.toLowerCase() : "";
    const labelText = typeof data.label === "string" ? data.label : "";
    const modeText =
      typeof data.mode === "string"
        ? data.mode
        : typeof data.type === "string"
          ? data.type
          : typeof data.session === "string"
            ? data.session
            : "";
    const resolvedMode = normalizeSessionMode(modeText || labelText || statusText);
    const active =
      typeof data.active === "boolean"
        ? data.active
        : typeof data.isActive === "boolean"
          ? data.isActive
          : Boolean(resolvedMode) || statusText === "active" || statusText === "online" || statusText === "running";

    return {
      active,
      label: data.label || formatSessionLabel(resolvedMode, active),
      link: data.url || BOTGHOST_DASHBOARD_URL,
      source: "botghost",
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  } catch (error) {
    return {
      active: ssuState.active,
      label: ssuState.label,
      link: ssuState.link,
      source: "local-fallback",
      updatedAt: ssuState.updatedAt
    };
  }
};

const isWebhookAuthorized = (req) => {
  if (!SSU_WEBHOOK_TOKEN) {
    return true;
  }

  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const headerToken = req.headers["x-ssu-token"] || "";
  const bodyToken = (req.body && req.body.token) || "";
  const queryToken = (req.query && req.query.token) || "";

  return (
    bearerToken === SSU_WEBHOOK_TOKEN ||
    headerToken === SSU_WEBHOOK_TOKEN ||
    bodyToken === SSU_WEBHOOK_TOKEN ||
    queryToken === SSU_WEBHOOK_TOKEN
  );
};

const normalizeSessionMode = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  const upper = value.toUpperCase();
  const knownMatch = upper.match(/\b(SSU|SSD|SSP)\b/);
  if (knownMatch) {
    return knownMatch[1];
  }

  const genericMatch = upper.match(/\bSS[A-Z0-9]{1,4}\b/);
  if (genericMatch) {
    return genericMatch[0];
  }

  return "";
};

const formatSessionLabel = (mode, active) => {
  if (!mode) {
    return active ? "Active" : "Inactive";
  }

  if (mode === "SSP") {
    return active ? "SSP (Startup Poll) Active" : "SSP (Startup Poll) Inactive";
  }

  return `${mode} ${active ? "Active" : "Inactive"}`;
};

const getWebhookPayload = (req) => {
  const payload = req.body && typeof req.body === "object" ? req.body : {};
  const query = req.query && typeof req.query === "object" ? req.query : {};

  return {
    label: payload.label || query.label || "",
    url: payload.url || query.url || "",
    mode: payload.mode || payload.type || payload.session || query.mode || query.type || query.session || ""
  };
};

const updateSsuState = ({ active, label, url, mode }) => {
  const normalizedMode = normalizeSessionMode(mode || label);
  ssuState.active = active;
  ssuState.label = label || formatSessionLabel(normalizedMode, active);
  ssuState.link = url || BOTGHOST_DASHBOARD_URL;
  ssuState.source = "botghost-webhook";
  ssuState.updatedAt = new Date().toISOString();
  cache.liveStatus = { value: null, expiresAt: 0 };
};

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
});

app.use(express.static(WEBSITE_ROOT));

app.get("/api/group-status", async (req, res) => {
  try {
    const data = await withCache("groupStatus", 60 * 1000, async () => {
      const groupData = await fetchJson(`https://groups.roblox.com/v1/groups/${GROUP_ID}`);
      const gamesData = await fetchJson(
        `https://games.roblox.com/v2/groups/${GROUP_ID}/games?accessFilter=All&limit=50`
      );

      const games = Array.isArray(gamesData.data) ? gamesData.data : [];
      const gamesCount = typeof gamesData.total === "number" ? gamesData.total : games.length;
      const activeCount = games.reduce((sum, game) => sum + (game.playing || 0), 0);

      return {
        memberCount: groupData.memberCount || 0,
        gamesCount,
        activeCount
      };
    });

    res.json(data);
  } catch (error) {
    res.status(502).json({ error: "Failed to fetch group status." });
  }
});

app.get("/api/team-members", async (req, res) => {
  try {
    const data = await withCache("teamMembers", 5 * 60 * 1000, async () => {
      const rolesData = await fetchJson(`https://groups.roblox.com/v1/groups/${GROUP_ID}/roles`);
      const roles = (rolesData.roles || [])
        .filter((role) => role.rank >= 198)
        .sort((a, b) => b.rank - a.rank);

      const members = [];

      for (const role of roles) {
        let cursor = "";

        do {
          const url = `https://groups.roblox.com/v1/groups/${GROUP_ID}/roles/${role.id}/users?limit=100${
            cursor ? `&cursor=${cursor}` : ""
          }`;
          const usersData = await fetchJson(url);
          const users = usersData.data || [];

          users.forEach((user) => {
            members.push({
              id: user.userId,
              name: user.username,
              role: role.name,
              rank: role.rank
            });
          });

          cursor = usersData.nextPageCursor || "";
        } while (cursor);
      }

      members.sort((a, b) => {
        if (b.rank !== a.rank) {
          return b.rank - a.rank;
        }
        return a.name.localeCompare(b.name);
      });

      const avatarMap = new Map();
      const idChunks = chunkArray(members.map((member) => member.id), 100);

      for (const ids of idChunks) {
        const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${ids.join(",")}&size=150x150&format=Png&isCircular=false`;
        const data = await fetchJson(url);
        const thumbnails = Array.isArray(data.data) ? data.data : [];
        thumbnails.forEach((item) => {
          if (item && item.targetId && item.imageUrl) {
            avatarMap.set(item.targetId, item.imageUrl);
          }
        });
      }

      const enrichedMembers = members.map((member) => ({
        ...member,
        avatarUrl: avatarMap.get(member.id) || null
      }));

      return { members: enrichedMembers };
    });

    res.json(data);
  } catch (error) {
    res.status(502).json({ error: "Failed to fetch team members." });
  }
});

app.get("/api/tiktok-stats", async (req, res) => {
  try {
    const data = await withCache("tiktokStats", 10 * 60 * 1000, async () => {
      const response = await fetch(TIKTOK_URL, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9"
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const html = await response.text();
      const followerMatch = html.match(/"followerCount":(\d+)/);
      const likeMatch = html.match(/"heartCount":(\d+)/);
      const videoMatch = html.match(/"videoCount":(\d+)/);

      if (!followerMatch || !likeMatch || !videoMatch) {
        throw new Error("Unable to parse TikTok stats.");
      }

      return {
        followers: Number(followerMatch[1]),
        likes: Number(likeMatch[1]),
        videos: Number(videoMatch[1]),
        profileUrl: TIKTOK_URL
      };
    });

    res.json(data);
  } catch (error) {
    res.status(502).json({ error: "Failed to fetch TikTok stats." });
  }
});

app.get("/api/ssu-status", (req, res) => {
  res.json({
    active: ssuState.active,
    label: ssuState.label,
    url: ssuState.link,
    updatedAt: ssuState.updatedAt,
    source: ssuState.source
  });
});

const handleSsuStart = (req, res) => {
  if (!isWebhookAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { label, url, mode } = getWebhookPayload(req);
  updateSsuState({ active: true, label, url, mode });

  return res.json({ success: true, ssu: ssuState });
};

const handleSsuEnd = (req, res) => {
  if (!isWebhookAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { label, url, mode } = getWebhookPayload(req);
  updateSsuState({ active: false, label, url, mode });

  return res.json({ success: true, ssu: ssuState });
};

app.post("/api/ssu/start", handleSsuStart);
app.get("/api/ssu/start", handleSsuStart);

app.post("/api/ssu/end", handleSsuEnd);
app.get("/api/ssu/end", handleSsuEnd);

app.get("/api/live-status", async (req, res) => {
  try {
    const data = await withCache("liveStatus", 30 * 1000, async () => {
      const [website, game, ssu] = await Promise.all([
        checkServiceHealth(WEBSITE_STATUS_URL),
        checkServiceHealth(GAME_STATUS_URL),
        fetchSsuStatus()
      ]);

      return {
        checkedAt: new Date().toISOString(),
        ssu,
        services: {
          website,
          game
        }
      };
    });

    res.json(data);
  } catch (error) {
    res.status(502).json({ error: "Failed to fetch live status." });
  }
});

app.get("/auth/discord/start", (req, res) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    return res.status(500).json({ error: "Discord OAuth is not configured." });
  }

  cleanupDiscordAuthState();
  const state = randomUUID();
  oauthStates.set(state, {
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    response_type: "code",
    redirect_uri: DISCORD_REDIRECT_URI,
    scope: DISCORD_OAUTH_SCOPES,
    state
  });

  return res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

app.get("/auth/discord/callback", async (req, res) => {
  try {
    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      return res.status(500).send("Discord OAuth is not configured.");
    }

    cleanupDiscordAuthState();

    const code = String((req.query && req.query.code) || "").trim();
    const state = String((req.query && req.query.state) || "").trim();
    const error = String((req.query && req.query.error) || "").trim();

    if (error) {
      return res.status(400).send(`Discord OAuth error: ${error}`);
    }

    if (!code || !state) {
      return res.status(400).send("Missing code or state.");
    }

    const stateEntry = oauthStates.get(state);
    if (!stateEntry || stateEntry.expiresAt <= Date.now()) {
      oauthStates.delete(state);
      return res.status(400).send("Invalid or expired OAuth state.");
    }
    oauthStates.delete(state);

    const tokenBody = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: DISCORD_REDIRECT_URI
    });

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: tokenBody.toString()
    });

    const tokenPayload = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      return res.status(502).send("Failed to exchange Discord OAuth code.");
    }

    const meResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`
      }
    });

    const me = await meResponse.json().catch(() => ({}));
    if (!meResponse.ok || !me.id) {
      return res.status(502).send("Failed to fetch Discord user profile.");
    }

    cleanupDiscordSessions();
    const sessionToken = randomUUID();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    discordSessions.set(sessionToken, {
      user: {
        id: me.id,
        username: me.username,
        discriminator: me.discriminator,
        globalName: me.global_name || "",
        avatar: me.avatar || "",
        email: me.email || "",
        verified: Boolean(me.verified)
      },
      createdAt: Date.now(),
      expiresAt
    });

    setSessionCookie(res, sessionToken, 24 * 60 * 60 * 1000);
    return res.redirect("/");
  } catch (error) {
    return res.status(500).send("Discord OAuth callback failed.");
  }
});

app.get("/api/auth/me", (req, res) => {
  const session = getDiscordSession(req);
  if (!session) {
    return res.status(401).json({ authenticated: false });
  }

  return res.json({
    authenticated: true,
    user: session.user,
    expiresAt: new Date(session.expiresAt).toISOString()
  });
});

app.post("/api/auth/logout", (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME];
  if (token) {
    discordSessions.delete(token);
  }

  clearSessionCookie(res);
  return res.json({ success: true, authenticated: false });
});

app.post("/api/bot-auth/challenge", (req, res) => {
  cleanupBotAuthChallenges();

  const mode = String((req.body && req.body.mode) || "SSP").trim().toUpperCase();
  const challengeId = randomUUID();
  const code = generateBotLoginCode();
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000;

  botAuthChallenges.set(challengeId, {
    id: challengeId,
    code,
    mode,
    createdAt: now,
    expiresAt,
    verified: false,
    username: "",
    verifiedAt: 0
  });

  return res.json({
    success: true,
    challengeId,
    code,
    mode,
    expiresInSeconds: 300,
    instruction: `Use your bot command with code ${code}`
  });
});

app.get("/api/bot-auth/status", (req, res) => {
  cleanupBotAuthChallenges();

  const challengeId = String((req.query && req.query.challengeId) || "").trim();
  if (!challengeId) {
    return res.status(400).json({ error: "challengeId is required." });
  }

  const challenge = botAuthChallenges.get(challengeId);
  if (!challenge) {
    return res.status(404).json({ error: "Challenge not found or expired.", expired: true });
  }

  return res.json({
    success: true,
    verified: challenge.verified,
    username: challenge.username || "",
    mode: challenge.mode,
    expiresAt: new Date(challenge.expiresAt).toISOString(),
    expired: challenge.expiresAt <= Date.now()
  });
});

const handleBotAuthVerify = async (req, res) => {
  try {
    cleanupBotAuthChallenges();

    const providedToken =
      String(req.headers["x-bot-auth-token"] || "").trim() ||
      String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim() ||
      String((req.body && req.body.token) || "").trim() ||
      String((req.query && req.query.token) || "").trim();

    if (BOT_AUTH_TOKEN && providedToken !== BOT_AUTH_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const code = String((req.body && req.body.code) || (req.query && req.query.code) || "").trim().toUpperCase();
    const username = String((req.body && req.body.username) || (req.query && req.query.username) || "").trim();

    if (!code || !username) {
      return res.status(400).json({ error: "code and username are required." });
    }

    let matched = null;
    for (const challenge of botAuthChallenges.values()) {
      if (!challenge.verified && challenge.code === code && challenge.expiresAt > Date.now()) {
        matched = challenge;
        break;
      }
    }

    if (!matched) {
      return res.status(404).json({ error: "Invalid or expired code." });
    }

    matched.verified = true;
    matched.username = username;
    matched.verifiedAt = Date.now();

    if (BOT_LINK_WEBHOOK_URL) {
      const embed = {
        embeds: [
          {
            title: "Bot Sign-In Verified",
            color: 0x22c55e,
            fields: [
              { name: "Username", value: username, inline: true },
              { name: "Mode", value: matched.mode, inline: true },
              { name: "Code", value: matched.code, inline: true }
            ],
            timestamp: new Date().toISOString(),
            footer: { text: "Queensland Interactive Bot Auth" }
          }
        ]
      };

      await fetch(BOT_LINK_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(embed)
      });
    }

    return res.json({
      success: true,
      challengeId: matched.id,
      username,
      mode: matched.mode,
      verified: true
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to verify bot auth." });
  }
};

app.post("/api/bot-auth/verify", handleBotAuthVerify);
app.get("/api/bot-auth/verify", handleBotAuthVerify);

app.post("/api/bot-link", async (req, res) => {
  try {
    const username = String((req.body && req.body.username) || "").trim();
    const mode = String((req.body && req.body.mode) || "SSP").trim().toUpperCase();
    const action = String((req.body && req.body.action) || "login").trim().toLowerCase();

    if (!username) {
      return res.status(400).json({ error: "Username is required." });
    }

    if (!["login", "logout"].includes(action)) {
      return res.status(400).json({ error: "Action must be login or logout." });
    }

    if (!BOT_LINK_WEBHOOK_URL) {
      return res.status(500).json({ error: "Webhook not configured." });
    }

    const loggedIn = action === "login";
    const embed = {
      embeds: [
        {
          title: `Bot Link: ${loggedIn ? "Log In" : "Log Out"}`,
          color: loggedIn ? 0x22c55e : 0xef4444,
          fields: [
            {
              name: "Username",
              value: username,
              inline: true
            },
            {
              name: "Session Mode",
              value: mode || "SSP",
              inline: true
            },
            {
              name: "Status",
              value: loggedIn ? "Logged In" : "Logged Out",
              inline: true
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: "Queensland Interactive Bot Link"
          }
        }
      ]
    };

    const webhookResponse = await fetch(BOT_LINK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(embed)
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.status}`);
    }

    return res.json({
      success: true,
      loggedIn,
      username,
      mode: mode || "SSP",
      timestamp: new Date().toISOString(),
      message: loggedIn ? "Logged in and sent to webhook." : "Logged out and sent to webhook."
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to send bot link webhook." });
  }
});

app.post("/api/feedback", async (req, res) => {
  try {
    const { type, username, title, description, severity, captchaToken } = req.body;

    // Validate required fields only - content is not filtered to allow honest feedback
    if (!type || !username || !title || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify Turnstile captcha token if secret is configured and token provided
    if (CAPTCHA_SECRET && captchaToken) {
      try {
        const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            secret: CAPTCHA_SECRET,
            response: captchaToken
          })
        });

        const verifyData = await verifyResponse.json();
        
        if (!verifyData.success) {
          console.error('Captcha verification failed:', verifyData);
          return res.status(400).json({ error: "Captcha verification failed" });
        }
        
        console.log('Captcha verification successful');
      } catch (error) {
        console.error('Captcha verification error:', error);
        // Continue anyway if verification service is unavailable
        console.log('Continuing without captcha verification due to service error');
      }
    }

    // Check if webhook URL is configured
    if (!DISCORD_WEBHOOK_URL) {
      console.error("Discord webhook URL not configured");
      return res.status(500).json({ error: "Webhook not configured" });
    }

    // Determine color based on type and severity
    let color;
    if (type === "bug") {
      color = severity === "high" ? 0xdc3545 : severity === "medium" ? 0xff9800 : 0xffc107;
    } else {
      color = 0x1e90ff;
    }

    // Create Discord embed
    const embed = {
      embeds: [{
        title: `${type === "bug" ? "Bug Report" : "Feedback"}: ${title}`,
        description: description,
        color: color,
        fields: [
          {
            name: "Username",
            value: username,
            inline: true
          },
          {
            name: "Priority",
            value: severity.charAt(0).toUpperCase() + severity.slice(1),
            inline: true
          },
          {
            name: "Submitted",
            value: new Date().toLocaleString(),
            inline: false
          }
        ],
        footer: {
          text: "Queensland Interactive Feedback System"
        },
        timestamp: new Date().toISOString()
      }]
    };

    // Send to Discord webhook
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(embed)
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }

    res.json({ success: true, message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});


app.listen(PORT, () => {
  console.log(`Roblox proxy running on ${PORT}`);
});
