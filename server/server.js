const express = require("express");
const { randomUUID, randomBytes, scryptSync, timingSafeEqual } = require("crypto");
const fs = require("fs");
const path = require("path");

const loadEnvironmentFile = () => {
  const environmentFile = path.join(__dirname, ".env");
  if (!fs.existsSync(environmentFile)) {
    return;
  }

  const lines = fs.readFileSync(environmentFile, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    let value = trimmedLine.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

loadEnvironmentFile();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
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
const SECURITY_ALERTS_WEBHOOK = process.env.SECURITY_ALERTS_WEBHOOK || DISCORD_WEBHOOK_URL;
const BOT_AUTH_TOKEN = process.env.BOT_AUTH_TOKEN || SSU_WEBHOOK_TOKEN;
const STATUSAPI_WEBHOOK = process.env.STATUSAPI_WEBHOOK || "";
const TRELLO_API_KEY = process.env.TRELLO_API_KEY || "";
const TRELLO_API_TOKEN = process.env.TRELLO_API_TOKEN || "";
const TRELLO_BANS_LIST_ID = process.env.TRELLO_BANS_LIST_ID || "";
const TRELLO_QLITE_ACCOUNTS_BOARD_ID = process.env.TRELLO_QLITE_ACCOUNTS_BOARD_ID || "68d53ce4beaece9f9828096d";
const TRELLO_QLITE_ACCOUNTS_LIST_ID = process.env.TRELLO_QLITE_ACCOUNTS_LIST_ID || "";
const QLITE_LOGINS = [...new Set(String(process.env.QLITE_LOGINS || "")
  .replace(/["']/g, "")
  .split(/[,\s;]+/)
  .map((value) => value.replace(/^<@!?(\d+)>$/, "$1").trim())
  .filter((value) => /^\d{1,25}$/.test(value)))];
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "";
const DISCORD_OAUTH_SCOPES = process.env.DISCORD_OAUTH_SCOPES || "identify email guilds";
const ADMIN_USER_IDS = String(process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const SESSION_COOKIE_NAME = "qldinter_session";
const WEBSITE_ORIGIN = String(process.env.WEBSITE_ORIGIN || "").trim().replace(/\/$/, "");
const WEBSITE_STATUS_URL = process.env.WEBSITE_STATUS_URL || "https://queenslandinteractive-rblx.com/";
const QLITE_ALLOWED_ORIGINS = new Set([
  WEBSITE_ORIGIN,
  WEBSITE_STATUS_URL,
  ...(process.env.QLITE_ALLOWED_ORIGINS || "").split(",")
].map((value) => {
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) ? url.origin : "";
  } catch {
    return "";
  }
}).filter(Boolean));
QLITE_ALLOWED_ORIGINS.add("https://www.queenslandinteractive-rblx.com");
const GAME_STATUS_URL = process.env.GAME_STATUS_URL || "https://www.roblox.com/games/74079904616243/Westlands-Queenlands";
const WEBSITE_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const MODERATION_DATA_FILE = path.join(DATA_DIR, "moderation-state.json");
const QLITE_ACCOUNTS_FILE = path.join(DATA_DIR, "qlite-accounts.json");
const QLITE_RECORDS_FILE = path.join(DATA_DIR, "qlite-records.json");
const SERVER_STARTED_AT = Date.now();
const metrics = {
  requests: 0,
  responseTimeTotalMs: 0,
  statusChecks: {
    website: { online: null, checkedAt: null, downtimeStartedAt: null, downtimeMs: 0 },
    game: { online: null, checkedAt: null, downtimeStartedAt: null, downtimeMs: 0 }
  }
};
app.use(express.json());
app.set("trust proxy", 1);

app.use((req, res, next) => {
  const startedAt = Date.now();
  metrics.requests += 1;
  res.on("finish", () => {
    metrics.responseTimeTotalMs += Date.now() - startedAt;
  });
  next();
});

const botAuthChallenges = new Map();
const oauthStates = new Map();
const discordSessions = new Map();
let moderationState = {
  bans: [],
  notifications: [],
  reviews: []
};
let qliteAccounts = {};
let qliteRecords = {
  records: [],
  logs: []
};

const ensureDataDirectory = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const createDefaultModerationState = () => ({
  bans: [
    {
      id: "ban-h3yt5-2026-01-12",
      username: "h3yt5",
      altUsername: "jakobecollinsbbsc213",
      reason: "ToS Violation: Exploiting",
      type: "permanent",
      bannedBy: "SYSTEM",
      appealStatus: "Permanent Ban - Not Appealable",
      bannedAt: "2026-01-12T12:25:00.000Z",
      createdAt: "2026-01-12T12:25:00.000Z"
    },
    {
      id: "ban-officer2971-2026-01-12",
      username: "officer2971",
      altUsername: "",
      reason: "ToS Violation: Exploiting",
      type: "permanent",
      bannedBy: "SYSTEM",
      appealStatus: "Permanent Ban - Not Appealable",
      bannedAt: "2026-01-12T21:17:00.000Z",
      createdAt: "2026-01-12T21:17:00.000Z"
    },
    {
      id: "ban-bravo-delta54-2026-01-14",
      username: "BRAVO_DELTA54",
      altUsername: "",
      reason: "ToS Violation: Exploiting",
      type: "permanent",
      bannedBy: "SYSTEM",
      appealStatus: "Permanent Ban - Not Appealable",
      bannedAt: "2026-01-14T14:29:00.000Z",
      createdAt: "2026-01-14T14:29:00.000Z"
    },
    {
      id: "ban-skeeta2021-2026-01-12",
      username: "Skeeta2021",
      altUsername: "",
      reason: "Fail Roleplay, Mass Copbaiting, and Disrespecting Staff",
      type: "temporary",
      bannedBy: "lango_mango13",
      appealStatus: "Appealable - Must Appeal to be Unbanned",
      bannedAt: "2026-01-12T17:26:00.000Z",
      createdAt: "2026-01-12T17:26:00.000Z"
    },
    {
      id: "ban-mrogan-benchick-2026-02-03",
      username: "Mrogan_Benchick",
      altUsername: "",
      reason: "Joined Version Two and failed to listen to staff instructions to leave.",
      type: "temporary",
      bannedBy: "lango_mango13",
      appealStatus: "Appealable - Must Appeal to be Unbanned",
      bannedAt: "2026-02-03T19:48:00.000Z",
      createdAt: "2026-02-03T19:48:00.000Z"
    }
  ],
  notifications: [],
  reviews: []
});

const saveModerationState = () => {
  ensureDataDirectory();
  fs.writeFileSync(MODERATION_DATA_FILE, JSON.stringify(moderationState, null, 2), "utf8");
};

const loadQliteAccounts = () => {
  ensureDataDirectory();
  if (!fs.existsSync(QLITE_ACCOUNTS_FILE)) {
    qliteAccounts = {};
    return;
  }

  const parsed = JSON.parse(fs.readFileSync(QLITE_ACCOUNTS_FILE, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("QLiTE account database has an invalid format.");
  }
  qliteAccounts = parsed;
};

const saveQliteAccounts = () => {
  ensureDataDirectory();
  const temporaryFile = `${QLITE_ACCOUNTS_FILE}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(qliteAccounts, null, 2), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporaryFile, QLITE_ACCOUNTS_FILE);
};

const loadQliteRecords = () => {
  ensureDataDirectory();
  if (!fs.existsSync(QLITE_RECORDS_FILE)) {
    qliteRecords = { records: [], logs: [] };
    saveQliteRecords();
    return;
  }

  const parsed = JSON.parse(fs.readFileSync(QLITE_RECORDS_FILE, "utf8"));
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.records) || !Array.isArray(parsed.logs)) {
    throw new Error("QLiTE records database has an invalid format.");
  }
  qliteRecords = parsed;
};

const saveQliteRecords = () => {
  ensureDataDirectory();
  const temporaryFile = `${QLITE_RECORDS_FILE}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(qliteRecords, null, 2), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporaryFile, QLITE_RECORDS_FILE);
};

const nextQlitePropertySerial = (records) => {
  const highestSerial = records.reduce((highest, record) => {
    const match = /^RBX(\d{4,})$/.exec(String(record.serialNumber || ""));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 1233);
  const nextSerial = highestSerial + 1;
  return nextSerial <= 99999999 ? `RBX${String(nextSerial).padStart(4, "0")}` : null;
};

const isPasswordValid = (password) => typeof password === "string" && password.length >= 12 && password.length <= 128;

const hashQlitePassword = (password, salt = randomBytes(16).toString("hex")) => ({
  salt,
  passwordHash: scryptSync(password, salt, 64).toString("hex")
});

const verifyQlitePassword = (password, account) => {
  if (typeof password !== "string" || password.length === 0 || password.length > 128 ||
    typeof account?.salt !== "string" || typeof account?.passwordHash !== "string") {
    return false;
  }
  const storedHash = Buffer.from(account.passwordHash, "hex");
  const candidateHash = scryptSync(password, account.salt, 64);
  return storedHash.length === candidateHash.length && timingSafeEqual(storedHash, candidateHash);
};

const isTrelloConfiguredForQlite = () => Boolean(
  TRELLO_API_KEY && TRELLO_API_TOKEN && (TRELLO_QLITE_ACCOUNTS_LIST_ID || TRELLO_QLITE_ACCOUNTS_BOARD_ID)
);

let qliteAccountsListCache = { id: "", expiresAt: 0 };

const trelloApiUrl = (resource, params = {}) => {
  const query = new URLSearchParams({
    ...params,
    key: TRELLO_API_KEY,
    token: TRELLO_API_TOKEN
  });
  return `https://api.trello.com/1/${resource}?${query.toString()}`;
};

const resolveQliteAccountsListId = async () => {
  if (TRELLO_QLITE_ACCOUNTS_LIST_ID) return TRELLO_QLITE_ACCOUNTS_LIST_ID;
  if (!TRELLO_QLITE_ACCOUNTS_BOARD_ID) {
    throw new Error("A Trello QLiTE accounts board ID or list ID must be configured.");
  }
  if (qliteAccountsListCache.id && qliteAccountsListCache.expiresAt > Date.now()) {
    return qliteAccountsListCache.id;
  }

  const boardListsResponse = await fetch(trelloApiUrl(
    `boards/${encodeURIComponent(TRELLO_QLITE_ACCOUNTS_BOARD_ID)}/lists`,
    { filter: "open", fields: "id,name,closed" }
  ), {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000)
  });
  if (!boardListsResponse.ok) {
    console.error("Trello QLiTE board lookup failed:", boardListsResponse.status);
    throw new Error("Could not access the configured Trello board. Check the Trello API credentials and board ID.");
  }
  const boardLists = await boardListsResponse.json();
  const existingList = Array.isArray(boardLists)
    ? boardLists.find((list) => list.name === "QLiTE Accounts" && !list.closed)
    : null;

  let listId = existingList?.id;
  if (!listId) {
    const createListResponse = await fetch(trelloApiUrl("lists", {
      idBoard: TRELLO_QLITE_ACCOUNTS_BOARD_ID,
      name: "QLiTE Accounts",
      pos: "bottom"
    }), {
      method: "POST",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000)
    });
    if (!createListResponse.ok) {
      console.error("Trello QLiTE accounts list creation failed:", createListResponse.status);
      throw new Error("Could not create the QLiTE Accounts list on the Trello board.");
    }
    const createdList = await createListResponse.json();
    listId = createdList.id;
  }
  if (typeof listId !== "string" || !listId) {
    throw new Error("Trello did not return a valid QLiTE Accounts list ID.");
  }

  qliteAccountsListCache = { id: listId, expiresAt: Date.now() + 60 * 1000 };
  return listId;
};

const createQliteTrelloAccountCard = async (user, listId) => {
  const params = new URLSearchParams({
    idList: listId,
    name: `QLiTE account · ${user.username}`,
    desc: [
      "QLiTE account access record.",
      `Discord user ID: ${user.id}`,
      `Discord username: ${user.username}`,
      `Account status: Active`,
      `Linked at: ${new Date().toISOString()}`,
      "",
      "This card intentionally contains no password or password hash.",
      "Archive this card or move it out of the QLiTE accounts list to revoke password sign-in."
    ].join("\n"),
    pos: "top"
  });

  const response = await fetch(trelloApiUrl("cards"), {
    method: "POST",
    headers: { Accept: "application/json" },
    body: params,
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error("Trello QLiTE account card creation failed:", response.status, details);
    throw new Error("Could not link this QLiTE account to Trello.");
  }
  const card = await response.json();
  if (!card.id) {
    throw new Error("Trello did not return an account card ID.");
  }
  return card.id;
};

const deleteQliteTrelloAccountCard = async (cardId) => {
  const params = new URLSearchParams({
    key: TRELLO_API_KEY,
    token: TRELLO_API_TOKEN
  });
  const response = await fetch(`https://api.trello.com/1/cards/${encodeURIComponent(cardId)}?${params.toString()}`, {
    method: "DELETE",
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Trello returned HTTP ${response.status} while cleaning up an incomplete account.`);
  }
};

const isQliteTrelloAccountActive = async (cardId, expectedListId) => {
  if (!isTrelloConfiguredForQlite() || !cardId) {
    throw new Error("Trello account access could not be verified.");
  }
  const listId = expectedListId || await resolveQliteAccountsListId();
  const params = new URLSearchParams({
    fields: "id,idList,closed"
  });
  const response = await fetch(trelloApiUrl(`cards/${encodeURIComponent(cardId)}`, Object.fromEntries(params)), {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000)
  });
  if (response.status === 404) return false;
  if (!response.ok) {
    console.error("Trello QLiTE account status check failed:", response.status);
    throw new Error("Trello account access could not be verified.");
  }
  const card = await response.json();
  return card.closed === false && card.idList === listId;
};

const setQliteTrelloAccountAccess = async (cardId, listId, active) => {
  const params = new URLSearchParams({
    closed: String(!active),
    ...(active ? { idList: listId } : {})
  });
  const response = await fetch(trelloApiUrl(`cards/${encodeURIComponent(cardId)}`, Object.fromEntries(params)), {
    method: "PUT",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000)
  });
  if (response.status === 404) {
    const error = new Error("The Trello QLiTE account card no longer exists.");
    error.status = 404;
    throw error;
  }
  if (!response.ok) {
    console.error("Trello QLiTE account access update failed:", response.status);
    const error = new Error("Could not update this account's Trello access record.");
    error.status = response.status;
    throw error;
  }
  const card = await response.json();
  return card.closed === false && card.idList === listId;
};

const sendBanToTrello = async (ban) => {
  console.log("Trello config check:");
  console.log("- TRELLO_API_KEY:", !!TRELLO_API_KEY);
  console.log("- TRELLO_API_TOKEN:", !!TRELLO_API_TOKEN);
  console.log("- TRELLO_BANS_LIST_ID:", !!TRELLO_BANS_LIST_ID);

  if (!TRELLO_API_KEY || !TRELLO_API_TOKEN || !TRELLO_BANS_LIST_ID) {
    console.log("Trello not configured, skipping ban notification");
    return;
  }

  console.log("Sending ban to Trello:", ban.username);

  const cardName = `${ban.username || "Unknown"}`;
  const cardDesc = [
    `${ban.reason || "No reason provided"}`,
    `If you think this is a mistake, visit our website to appeal`
  ].join("\n");

  const params = new URLSearchParams({
    key: TRELLO_API_KEY,
    token: TRELLO_API_TOKEN,
    idList: TRELLO_BANS_LIST_ID,
    name: cardName,
    desc: cardDesc,
    pos: "top"
  });

  const response = await fetch(`https://api.trello.com/1/cards?${params.toString()}`, {
    method: "POST"
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Trello card creation failed: ${response.status} ${errorText}`);
  }

  return response.json();
};

const loadModerationState = () => {
  ensureDataDirectory();

  if (!fs.existsSync(MODERATION_DATA_FILE)) {
    moderationState = createDefaultModerationState();
    saveModerationState();
    return;
  }

  try {
    const raw = fs.readFileSync(MODERATION_DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    moderationState = {
      bans: Array.isArray(parsed.bans) ? parsed.bans : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : []
    };
  } catch (error) {
    moderationState = createDefaultModerationState();
    saveModerationState();
  }
};

const toIsoDate = (value) => {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
};

const getMissingDiscordOAuthConfig = () => {
  const missing = [];
  if (!DISCORD_CLIENT_ID) {
    missing.push("DISCORD_CLIENT_ID");
  }
  if (!DISCORD_CLIENT_SECRET) {
    missing.push("DISCORD_CLIENT_SECRET");
  }
  return missing;
};

const resolveDiscordRedirectUri = (req) => {
  if (DISCORD_REDIRECT_URI) {
    return DISCORD_REDIRECT_URI;
  }

  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const protocol = forwardedProto || req.protocol || "https";
  const host = String(req.headers.host || "").trim();

  if (!host) {
    return "";
  }

  return `${protocol}://${host}/auth/discord/callback`;
};

const fetchJson = async (url) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

const robloxProxyCache = new Map();
let robloxSearchRateLimitedUntil = 0;

const getRobloxCachedResponse = (key) => {
  const entry = robloxProxyCache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    robloxProxyCache.delete(key);
    return null;
  }
  return entry.value;
};

const cacheRobloxResponse = (key, value, ttlMs) => {
  if (robloxProxyCache.size >= 100 && !robloxProxyCache.has(key)) {
    const oldestKey = robloxProxyCache.keys().next().value;
    if (oldestKey !== undefined) robloxProxyCache.delete(oldestKey);
  }
  robloxProxyCache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

const fetchRobloxJson = async (url) => {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) {
    const error = new Error(`Roblox API returned HTTP ${response.status}.`);
    error.status = response.status;
    const retryAfter = Number(response.headers.get("retry-after"));
    error.retryAfterSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60;
    throw error;
  }
  return response.json();
};

const sendRobloxProxyError = (res, error) => {
  if (error.status === 429) {
    const retryAfterSeconds = Math.max(1, Math.ceil(error.retryAfterSeconds || 60));
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      error: `Roblox is rate-limiting requests. Try again in ${retryAfterSeconds} seconds.`,
      retryAfterSeconds
    });
  }
  if (error.name === "TimeoutError" || error.name === "AbortError") {
    return res.status(504).json({ error: "Roblox did not respond in time. Please try again." });
  }
  console.error("Roblox API proxy request failed:", error);
  return res.status(502).json({ error: "Could not reach the Roblox API. Please try again later." });
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
  liveStatus: { value: null, expiresAt: 0 },
  metrics: { value: null, expiresAt: 0 }
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
    "SameSite=None",
    `Max-Age=${maxAgeSeconds}`
  ].join("; ");
  res.setHeader("Set-Cookie", cookie);
};

const notifyNotFoundWebhook = async (req) => {
  if (!SECURITY_ALERTS_WEBHOOK) {
    return;
  }

  const webhookPayload = {
    embeds: [
      {
        title: "404 Not Found Alert",
        description: `A 404 page not found error occurred for ${req.method} ${req.originalUrl}`,
        color: 0xf59e0b,
        fields: [
          { name: "URL", value: `${req.originalUrl}`, inline: true },
          { name: "Method", value: `${req.method}`, inline: true }
        ],
        footer: {
          text: "Queensland Interactive Error Webhook"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    await fetch(SECURITY_ALERTS_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(webhookPayload)
    });
  } catch (error) {
    console.error("Failed to send 404 webhook:", error);
  }
};

const clearSessionCookie = (res) => {
  const cookie = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=None",
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

const requireAdmin = (req, res, next) => {
  const session = getDiscordSession(req);
  if (!session) {
    return res.status(401).json({ error: "Authentication required." });
  }

  if (ADMIN_USER_IDS.length === 0) {
    return res.status(503).json({
      error: "Admin allowlist is not configured.",
      hint: "Set ADMIN_USER_IDS to one or more Discord user IDs."
    });
  }

  if (!ADMIN_USER_IDS.includes(String(session.user.id))) {
    return res.status(403).json({ error: "Admin access required." });
  }

  req.adminUser = session.user;
  return next();
};

const isQliteLoginAllowed = (discordId) => QLITE_LOGINS.includes(String(discordId));
const qliteLoginDeniedMessage = (discordId) => QLITE_LOGINS.length
  ? `Discord user ID ${String(discordId)} is not listed in QLITE_LOGINS. Add this numeric ID to the Railway variable, separated from other IDs by a comma, then redeploy the server.`
  : "QLiTE sign-in is disabled because QLITE_LOGINS is empty. Add the permitted Discord user IDs to the Railway variable, then redeploy the server.";

const requireQliteSession = (req, res, next) => {
  const session = getDiscordSession(req);
  if (!session || session.authMethod !== "qlite-password") {
    return res.status(401).json({ authenticated: false, error: "QLiTE sign-in is required." });
  }
  if (!isQliteLoginAllowed(session.user.id)) {
    discordSessions.delete(session.token);
    clearSessionCookie(res);
    return res.status(403).json({ error: qliteLoginDeniedMessage(session.user.id) });
  }

  const account = qliteAccounts[String(session.user.id)];
  if (!account || account.trelloCardId !== session.trelloCardId) {
    discordSessions.delete(session.token);
    clearSessionCookie(res);
    return res.status(401).json({ authenticated: false, error: "QLiTE access is no longer active." });
  }
  req.qliteUser = session.user;
  return next();
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

const recordServiceCheck = (serviceName, service) => {
  const record = metrics.statusChecks[serviceName];
  if (!record || service.state === "Not configured") return;

  const checkedAt = Date.now();
  if (record.online === true && service.online === false) {
    record.downtimeStartedAt = checkedAt;
  } else if (record.online === false && service.online === true && record.downtimeStartedAt) {
    record.downtimeMs += checkedAt - record.downtimeStartedAt;
    record.downtimeStartedAt = null;
  }
  record.online = service.online;
  record.checkedAt = new Date(checkedAt).toISOString();
};

const formatDuration = (durationMs) => {
  const totalSeconds = Math.floor(durationMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const getServiceMetrics = (serviceName) => {
  const record = metrics.statusChecks[serviceName];
  const downtimeMs = record.downtimeStartedAt
    ? record.downtimeMs + Date.now() - record.downtimeStartedAt
    : record.downtimeMs;
  return { lastCheckedAt: record.checkedAt, downtimeMs, downtime: formatDuration(downtimeMs) };
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

const isTrustedQliteRequest = (req) => {
  const origin = String(req.headers.origin || "").trim();
  if (!origin) return true;
  return QLITE_ALLOWED_ORIGINS.has(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

const qliteLoginFailures = new Map();
const QLITE_LOGIN_MAX_ATTEMPTS = 8;
const QLITE_LOGIN_LOCKOUT_MS = 60 * 1000;

const normalizeQliteLogin = (value) => String(value || "").trim().replace(/^@/, "").toLowerCase();
const getQliteLoginKey = (req, username) => `${req.ip}:${normalizeQliteLogin(username)}`;

const createQlitePasswordSession = (res, user, trelloCardId) => {
  cleanupDiscordSessions();
  const sessionToken = randomUUID();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  discordSessions.set(sessionToken, {
    user,
    authMethod: "qlite-password",
    trelloCardId,
    createdAt: Date.now(),
    expiresAt
  });
  setSessionCookie(res, sessionToken, 24 * 60 * 60 * 1000);
};

const normalizeSessionMode = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  const upper = value.toUpperCase();
  if (
    upper === "SSP" ||
    upper === "SSUP" ||
    upper.includes("STARTUP_POLL") ||
    upper.includes("STARTUP POLL") ||
    (upper.includes("POLL") && upper.includes("STARTUP"))
  ) {
    return "SSP";
  }

  if (upper === "SSU" || upper.includes("SERVER STARTUP") || upper.includes("SERVER_STARTUP")) {
    return "SSU";
  }

  if (upper === "SSD" || upper.includes("SERVER SHUTDOWN") || upper.includes("SERVER_SHUTDOWN")) {
    return "SSD";
  }

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

  if (mode === "SSU") {
    return active ? "SSU (Server Startup) Active" : "SSU (Server Startup) Inactive";
  }

  if (mode === "SSD") {
    return active ? "SSD (Server Shutdown) Active" : "SSD (Server Shutdown) Inactive";
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
  const requestOrigin = String(req.headers.origin || "").trim();
  const isLocalDevelopmentOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);
  if (requestOrigin && (QLITE_ALLOWED_ORIGINS.has(requestOrigin) || isLocalDevelopmentOrigin)) {
    res.set("Access-Control-Allow-Origin", requestOrigin);
    res.set("Vary", "Origin");
  }

  res.set("Access-Control-Allow-Credentials", "true");
  res.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
});

app.get("/", (req, res) => {
  const code = String(req.query.code || "").trim();
  const state = String(req.query.state || "").trim();

  // If Discord redirects to /?code=...&state=..., forward to the callback route.
  if (code && state) {
    const queryParams = new URLSearchParams(req.query).toString();
    return res.redirect(`/auth/discord/callback?${queryParams}`);
  }

  res.sendFile(path.join(WEBSITE_ROOT, "index.html"));
});

app.use(express.static(WEBSITE_ROOT));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptimeSeconds: Math.floor(process.uptime()), checkedAt: new Date().toISOString() });
});

app.get("/api/roblox/users/search", async (req, res) => {
  const keyword = typeof req.query.keyword === "string" ? req.query.keyword.trim() : "";
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";
  if (!keyword || keyword.length > 50 || cursor.length > 1024) {
    return res.status(400).json({ error: "Provide a search term of 1–50 characters and a valid page cursor." });
  }

  const retryAfterSeconds = Math.ceil((robloxSearchRateLimitedUntil - Date.now()) / 1000);
  if (retryAfterSeconds > 0) {
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      error: `Roblox is rate-limiting searches. Try again in ${retryAfterSeconds} seconds.`,
      retryAfterSeconds
    });
  }

  const cacheKey = `search:${keyword.toLowerCase()}:${cursor}`;
  const cached = getRobloxCachedResponse(cacheKey);
  if (cached) return res.json(cached);

  const params = new URLSearchParams({ keyword, limit: "10" });
  if (cursor) params.set("cursor", cursor);

  try {
    const data = await fetchRobloxJson(`https://users.roblox.com/v1/users/search?${params.toString()}`);
    cacheRobloxResponse(cacheKey, data, 60 * 1000);
    return res.json(data);
  } catch (error) {
    if (error.status === 429) {
      robloxSearchRateLimitedUntil = Date.now() + Math.max(1, error.retryAfterSeconds || 60) * 1000;
    }
    return sendRobloxProxyError(res, error);
  }
});

app.get("/api/roblox/users/:userId/avatar", async (req, res) => {
  const userId = String(req.params.userId || "");
  if (!/^\d{1,20}$/.test(userId)) {
    return res.status(400).json({ error: "A numeric Roblox user ID is required." });
  }

  const cacheKey = `avatar:${userId}`;
  const cached = getRobloxCachedResponse(cacheKey);
  if (cached) return res.json(cached);

  const params = new URLSearchParams({
    userIds: userId,
    size: "150x150",
    format: "Png",
    isCircular: "false"
  });

  try {
    const data = await fetchRobloxJson(`https://thumbnails.roblox.com/v1/users/avatar-headshot?${params.toString()}`);
    if (Array.isArray(data.data) && data.data.some((thumbnail) => thumbnail?.imageUrl)) {
      cacheRobloxResponse(cacheKey, data, 5 * 60 * 1000);
    }
    return res.json(data);
  } catch (error) {
    return sendRobloxProxyError(res, error);
  }
});

app.get("/api/roblox/users/:userId", async (req, res) => {
  const userId = String(req.params.userId || "");
  if (!/^\d{1,20}$/.test(userId)) {
    return res.status(400).json({ error: "A numeric Roblox user ID is required." });
  }

  const cacheKey = `profile:${userId}`;
  const cached = getRobloxCachedResponse(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await fetchRobloxJson(`https://users.roblox.com/v1/users/${userId}`);
    cacheRobloxResponse(cacheKey, data, 5 * 60 * 1000);
    return res.json(data);
  } catch (error) {
    return sendRobloxProxyError(res, error);
  }
});

app.get("/api/metrics", requireAdmin, async (req, res) => {
  try {
    const data = await withCache("metrics", 30 * 1000, async () => {
      const [website, game] = await Promise.all([
        checkServiceHealth(WEBSITE_STATUS_URL),
        checkServiceHealth(GAME_STATUS_URL)
      ]);
      recordServiceCheck("website", website);
      recordServiceCheck("game", game);
      const uptimeMs = Date.now() - SERVER_STARTED_AT;
      return {
        checkedAt: new Date().toISOString(),
        uptimeSeconds: Math.floor(uptimeMs / 1000),
        uptime: formatDuration(uptimeMs),
        requests: metrics.requests,
        averageResponseMs: metrics.requests ? Math.round(metrics.responseTimeTotalMs / metrics.requests) : 0,
        services: {
          website: { ...website, ...getServiceMetrics("website") },
          game: { ...game, ...getServiceMetrics("game") }
        }
      };
    });
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: "Failed to collect server metrics." });
  }
});

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

const handleStartupPollStart = (req, res) => {
  if (!isWebhookAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { label, url } = getWebhookPayload(req);
  updateSsuState({
    active: true,
    label: label || "SSP (Startup Poll) Active",
    url,
    mode: "SSP"
  });

  return res.json({ success: true, ssu: ssuState });
};

const handleStartupPollEnd = (req, res) => {
  if (!isWebhookAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { label, url } = getWebhookPayload(req);
  updateSsuState({
    active: false,
    label: label || "SSP (Startup Poll) Inactive",
    url,
    mode: "SSP"
  });

  return res.json({ success: true, ssu: ssuState });
};

app.post("/api/ssu/start", handleSsuStart);
app.get("/api/ssu/start", handleSsuStart);

app.post("/api/ssu/end", handleSsuEnd);
app.get("/api/ssu/end", handleSsuEnd);

app.post("/api/ssu/startup-poll/start", handleStartupPollStart);
app.get("/api/ssu/startup-poll/start", handleStartupPollStart);

app.post("/api/ssu/startup-poll/end", handleStartupPollEnd);
app.get("/api/ssu/startup-poll/end", handleStartupPollEnd);

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
          website: { ...website, ...getServiceMetrics("website") },
          game: { ...game, ...getServiceMetrics("game") }
        }
      };
    });

    res.json(data);
  } catch (error) {
    res.status(502).json({ error: "Failed to fetch live status." });
  }
});

app.get("/api/auth/config", (req, res) => {
  const missing = getMissingDiscordOAuthConfig();
  const effectiveRedirectUri = resolveDiscordRedirectUri(req);
  return res.json({
    oauthConfigured: missing.length === 0,
    missing,
    redirectUri: DISCORD_REDIRECT_URI,
    effectiveRedirectUri
  });
});

app.get("/auth/discord/start", (req, res) => {
  const missing = getMissingDiscordOAuthConfig();
  if (missing.length > 0) {
    return res.status(500).json({
      error: "Discord OAuth is not configured.",
      missing,
      hint: "Set the missing variables in your server environment and restart the service."
    });
  }

  const redirectUri = resolveDiscordRedirectUri(req);
  if (!redirectUri) {
    return res.status(500).json({
      error: "Discord OAuth redirect URI could not be resolved.",
      hint: "Set DISCORD_REDIRECT_URI in your environment."
    });
  }

  cleanupDiscordAuthState();
  const state = randomUUID();
  const returnTo = String((req.query && req.query.returnTo) || "").trim();
  let safeReturnTo = "/";

  if (returnTo) {
    try {
      const parsed = new URL(returnTo);
      if (["http:", "https:"].includes(parsed.protocol)) {
        safeReturnTo = returnTo;
      }
    } catch (error) {
      safeReturnTo = "/";
    }
  }

  oauthStates.set(state, {
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
    returnTo: safeReturnTo,
    redirectUri
  });

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: DISCORD_OAUTH_SCOPES,
    state
  });

  return res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

app.get("/auth/discord/callback", async (req, res) => {
  try {
    const missing = getMissingDiscordOAuthConfig();
    if (missing.length > 0) {
      return res.status(500).send(`Discord OAuth is not configured. Missing: ${missing.join(", ")}`);
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

    const redirectUri = stateEntry.redirectUri || resolveDiscordRedirectUri(req);
    if (!redirectUri) {
      return res.status(500).send("Discord OAuth redirect URI could not be resolved.");
    }

    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri
    });

    const authHeader = `Basic ${Buffer.from(`${DISCORD_CLIENT_ID}:${DISCORD_CLIENT_SECRET}`).toString("base64")}`;

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader
      },
      body: tokenBody.toString()
    });

    let tokenPayload;
    let tokenText;
    try {
      tokenText = await tokenResponse.text();
      tokenPayload = JSON.parse(tokenText);
    } catch (e) {
      tokenPayload = { error: 'invalid_json', details: tokenText || 'empty' };
    }

    if (!tokenResponse.ok || !tokenPayload.access_token) {
      console.error('Discord token exchange failed', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: tokenPayload
      });
      return res.status(502).send(`Failed to exchange Discord OAuth code. status=${tokenResponse.status} body=${JSON.stringify(tokenPayload)}`);
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
    const redirectTo = typeof stateEntry.returnTo === "string" && stateEntry.returnTo ? stateEntry.returnTo : "/";
    return res.redirect(redirectTo);
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

app.get("/api/qlite/account/status", async (req, res) => {
  const session = getDiscordSession(req);
  if (!session) return res.status(401).json({ authenticated: false });
  if (!isQliteLoginAllowed(session.user.id)) {
    return res.status(403).json({
      error: qliteLoginDeniedMessage(session.user.id)
    });
  }

  const account = qliteAccounts[String(session.user.id)];
  if (!account) {
    return res.json({
      authenticated: true,
      username: session.user.username,
      discordId: String(session.user.id),
      accountConfigured: false
    });
  }

  try {
    const active = await isQliteTrelloAccountActive(account.trelloCardId, account.trelloListId);
    return res.json({
      authenticated: true,
      username: account.username,
      discordId: account.discordId || String(session.user.id),
      accountConfigured: true,
      accessActive: active
    });
  } catch (error) {
    console.error("Unable to check QLiTE account status in Trello:", error);
    return res.status(503).json({ error: "Trello account access could not be verified. Please try again later." });
  }
});

app.post("/api/qlite/account/setup", async (req, res) => {
  if (!isTrustedQliteRequest(req)) {
    return res.status(403).json({ error: "Requests from this website are not allowed." });
  }
  const session = getDiscordSession(req);
  if (!session) return res.status(401).json({ error: "Sign in with Discord before setting a QLiTE password." });
  if (!isQliteLoginAllowed(session.user.id)) {
    return res.status(403).json({ error: qliteLoginDeniedMessage(session.user.id) });
  }
  if (!isPasswordValid(req.body?.password)) {
    return res.status(400).json({ error: "Choose a password between 12 and 128 characters." });
  }
  if (!isTrelloConfiguredForQlite()) {
    return res.status(503).json({ error: "Trello account linking is not configured on the server." });
  }

  const discordId = String(session.user.id);
  const discordUsername = String(session.user.username || "").trim();
  if (!discordUsername) return res.status(400).json({ error: "Discord did not provide a username for this account." });
  const existingAccount = qliteAccounts[discordId];
  if (existingAccount) {
    try {
      if (!await isQliteTrelloAccountActive(existingAccount.trelloCardId, existingAccount.trelloListId)) {
        return res.status(403).json({ error: "QLiTE access has been revoked. Contact an administrator." });
      }
    } catch (error) {
      console.error("Unable to verify QLiTE account status before password update:", error);
      return res.status(503).json({ error: "Trello account access could not be verified. Please try again later." });
    }
  }
  const usernameTaken = Object.entries(qliteAccounts).some(([id, account]) => {
    return id !== discordId && String(account.username || "").toLowerCase() === discordUsername.toLowerCase();
  });
  if (usernameTaken) {
    return res.status(409).json({ error: "This Discord username is already linked to a QLiTE account. Contact an administrator." });
  }

  try {
    const { salt, passwordHash } = hashQlitePassword(req.body.password);
    const trelloListId = existingAccount?.trelloListId || await resolveQliteAccountsListId();
    const trelloCardId = existingAccount
      ? existingAccount.trelloCardId
      : await createQliteTrelloAccountCard(session.user, trelloListId);
    const nextAccount = {
      discordId,
      username: discordUsername,
      globalName: String(session.user.globalName || "").trim(),
      salt,
      passwordHash,
      trelloCardId,
      trelloListId,
      createdAt: existingAccount?.createdAt || new Date().toISOString(),
      passwordUpdatedAt: new Date().toISOString()
    };
    qliteAccounts[discordId] = nextAccount;
    try {
      saveQliteAccounts();
    } catch (error) {
      if (existingAccount) qliteAccounts[discordId] = existingAccount;
      else {
        delete qliteAccounts[discordId];
        try {
          await deleteQliteTrelloAccountCard(trelloCardId);
        } catch (cleanupError) {
          console.error("Unable to remove an incomplete QLiTE account card from Trello:", cleanupError);
        }
      }
      console.error("Unable to persist the QLiTE account database:", error);
      return res.status(500).json({ error: "The account could not be saved on the QLiTE server. Please contact support." });
    }
    createQlitePasswordSession(res, {
      id: discordId,
      username: nextAccount.username,
      globalName: nextAccount.username,
      avatar: session.user.avatar || "",
      verified: Boolean(session.user.verified)
    }, trelloCardId);
    return res.status(existingAccount ? 200 : 201).json({
      success: true,
      username: nextAccount.username,
      passwordUpdated: Boolean(existingAccount)
    });
  } catch (error) {
    console.error("Unable to create QLiTE account:", error);
    return res.status(502).json({ error: error.message || "Could not link the account to Trello." });
  }
});

app.post("/api/qlite/auth/login", async (req, res) => {
  if (!isTrustedQliteRequest(req)) {
    return res.status(403).json({ error: "Requests from this website are not allowed." });
  }
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = req.body?.password;
  if (!username || username.length > 64 || typeof password !== "string" || password.length > 128) {
    return res.status(400).json({ error: "Enter your Discord username and password." });
  }
  const loginKey = getQliteLoginKey(req, username);
  const now = Date.now();
  const failureState = qliteLoginFailures.get(loginKey);
  if (failureState && failureState.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((failureState.lockedUntil - now) / 1000);
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({ error: `Too many sign-in attempts. Try again in ${retryAfterSeconds} seconds.` });
  }

  try {
    loadQliteAccounts();
  } catch (error) {
    console.error("Unable to load QLiTE accounts for password sign-in:", error);
    return res.status(500).json({ error: "QLiTE account records could not be loaded. Please try again later." });
  }
  const normalizedUsername = normalizeQliteLogin(username);
  const accounts = Object.entries(qliteAccounts);
  const accountEntry = accounts.find(([id, entry]) => {
    return normalizeQliteLogin(entry.username) === normalizedUsername ||
      String(entry.discordId || id) === username.trim();
  });
  const displayNameMatches = accounts.filter(([, entry]) => {
    return entry.globalName && normalizeQliteLogin(entry.globalName) === normalizedUsername;
  });
  const matchedEntry = accountEntry || (displayNameMatches.length === 1 ? displayNameMatches[0] : null);
  const account = matchedEntry ? matchedEntry[1] : null;
  const passwordMatches = account
    ? verifyQlitePassword(password, account)
    : (scryptSync(password || "invalid", "qlite-login-dummy-salt", 64), false);

  if (!account || !passwordMatches) {
    const failures = failureState?.lockedUntil ? 1 : (failureState?.failures || 0) + 1;
    const lockedUntil = failures >= QLITE_LOGIN_MAX_ATTEMPTS ? now + QLITE_LOGIN_LOCKOUT_MS : 0;
    qliteLoginFailures.set(loginKey, { failures, lockedUntil });
    if (qliteLoginFailures.size > 5000) {
      for (const [key, value] of qliteLoginFailures) {
        if (!value.lockedUntil || value.lockedUntil <= now) qliteLoginFailures.delete(key);
      }
    }
    if (lockedUntil) {
      res.set("Retry-After", String(Math.ceil(QLITE_LOGIN_LOCKOUT_MS / 1000)));
      return res.status(429).json({ error: "Too many sign-in attempts. Try again in 15 minutes." });
    }
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  if (!isQliteLoginAllowed(account.discordId)) {
    return res.status(403).json({ error: qliteLoginDeniedMessage(account.discordId) });
  }

  try {
    if (!await isQliteTrelloAccountActive(account.trelloCardId, account.trelloListId)) {
      return res.status(403).json({ error: "QLiTE access has been revoked. Contact an administrator." });
    }
  } catch (error) {
    console.error("Unable to verify QLiTE account access in Trello:", error);
    return res.status(503).json({ error: "Trello account access could not be verified. Please try again later." });
  }

  qliteLoginFailures.delete(loginKey);
  createQlitePasswordSession(res, {
    id: account.discordId,
    username: account.username,
    globalName: account.username,
    avatar: "",
    verified: false
  }, account.trelloCardId);
  return res.json({ success: true, username: account.username });
});

app.get("/api/qlite/session", async (req, res) => {
  const session = getDiscordSession(req);
  if (!session || session.authMethod !== "qlite-password") {
    return res.status(401).json({ authenticated: false });
  }
  if (!isQliteLoginAllowed(session.user.id)) {
    discordSessions.delete(session.token);
    clearSessionCookie(res);
    return res.status(403).json({ authenticated: false, error: qliteLoginDeniedMessage(session.user.id) });
  }
  const account = qliteAccounts[String(session.user.id)];
  if (!account || account.trelloCardId !== session.trelloCardId) {
    discordSessions.delete(session.token);
    clearSessionCookie(res);
    return res.status(401).json({ authenticated: false });
  }

  try {
    if (!await isQliteTrelloAccountActive(account.trelloCardId, account.trelloListId)) {
      discordSessions.delete(session.token);
      clearSessionCookie(res);
      return res.status(403).json({ authenticated: false, error: "QLiTE access has been revoked." });
    }
  } catch (error) {
    console.error("Unable to verify active QLiTE session in Trello:", error);
    return res.status(503).json({ error: "Trello account access could not be verified." });
  }
  return res.json({
    authenticated: true,
    user: { id: account.discordId, username: account.username },
    isAdmin: ADMIN_USER_IDS.includes(String(account.discordId))
  });
});

app.get("/api/qlite/records", requireQliteSession, (req, res) => {
  const records = qliteRecords.records
    .slice()
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  return res.json({ records });
});

app.post("/api/qlite/records", requireQliteSession, (req, res) => {
  if (!isTrustedQliteRequest(req)) {
    return res.status(403).json({ error: "Requests from this website are not allowed." });
  }

  const playerId = String(req.body?.playerId || "").trim();
  const playerName = String(req.body?.playerName || "").trim();
  const username = String(req.body?.username || "").trim();
  const type = String(req.body?.type || "").trim();
  const reason = String(req.body?.reason || "").trim();
  const amount = Number(req.body?.amount);
  const priority = String(req.body?.priority || "").trim();
  const propertyDescription = String(req.body?.propertyDescription || "").trim();
  const markings = String(req.body?.markings || "").trim();
  const additionalInfo = String(req.body?.additionalInfo || "").trim();
  const direction = String(req.body?.direction || "").trim();
  const vehicleDescription = String(req.body?.vehicleDescription || "").trim();
  const registration = String(req.body?.registration || "").trim();
  const impoundLocation = String(req.body?.impoundLocation || "").trim();
  if (!/^\d{1,25}$/.test(playerId) || !playerName || playerName.length > 64 ||
    !username || username.length > 64 || !reason || reason.length > 240 ||
    !["Safety", "DV", "Move-on Direction", "Fine", "Warrant", "Traffic", "Youth Caution", "Property Receipt", "Impound", "Arrest"].includes(type)) {
    return res.status(400).json({ error: "A valid player, record type and reason are required." });
  }
  if (type === "Fine" && (!Number.isInteger(amount) || amount < 1 || amount > 1000000)) {
    return res.status(400).json({ error: "Fine amount must be a whole number from 1 to 1,000,000." });
  }
  if (type === "Warrant" && !["Standard", "Urgent"].includes(priority)) {
    return res.status(400).json({ error: "Choose a valid warrant priority." });
  }
  if (type === "Property Receipt" &&
    (!propertyDescription || propertyDescription.length > 160 || markings.length > 160 || additionalInfo.length > 500)) {
    return res.status(400).json({ error: "A property description is required; markings must be 160 characters or fewer and additional information 500 characters or fewer." });
  }
  if (type === "Move-on Direction" && (!direction || direction.length > 240)) {
    return res.status(400).json({ error: "A move-on direction of 240 characters or fewer is required." });
  }
  if (type === "Impound" && (!vehicleDescription || vehicleDescription.length > 160 ||
    registration.length > 32 || impoundLocation.length > 160)) {
    return res.status(400).json({ error: "An impounded vehicle description is required; registration must be 32 characters or fewer and location 160 characters or fewer." });
  }
  const propertySerial = type === "Property Receipt"
    ? nextQlitePropertySerial([
      ...qliteRecords.records,
      ...qliteRecords.logs.map((entry) => entry.record || {})
    ])
    : null;
  if (type === "Property Receipt" && !propertySerial) {
    return res.status(503).json({ error: "A property receipt serial number could not be generated. Contact an administrator." });
  }

  const createdAt = new Date().toISOString();
  const record = {
    id: randomUUID(),
    playerId,
    playerName,
    username,
    type,
    reason,
    createdAt,
    actor: {
      id: String(req.qliteUser.id),
      username: String(req.qliteUser.username || "QLiTE Officer")
    },
    ...(type === "Fine" ? { amount } : type === "Warrant" ? { priority } : type === "Move-on Direction" ? { direction } : {})
  };
  if (type === "Impound") {
    record.vehicleDescription = vehicleDescription;
    if (registration) record.registration = registration;
    if (impoundLocation) record.impoundLocation = impoundLocation;
  }
  if (type === "Property Receipt") {
    record.serialNumber = propertySerial;
    record.propertyDescription = propertyDescription;
    if (markings) record.markings = markings;
    if (additionalInfo) record.additionalInfo = additionalInfo;
  }
  const log = {
    id: randomUUID(),
    action: "added",
    record: { ...record },
    actor: { ...record.actor },
    createdAt
  };
  const previousRecords = qliteRecords.records;
  const previousLogs = qliteRecords.logs;
  qliteRecords.records = [record, ...previousRecords];
  qliteRecords.logs = [log, ...previousLogs];
  try {
    saveQliteRecords();
  } catch (error) {
    qliteRecords.records = previousRecords;
    qliteRecords.logs = previousLogs;
    console.error("Unable to persist a QLiTE record:", error);
    return res.status(500).json({ error: "The QLiTE record could not be saved." });
  }
  return res.status(201).json({ success: true, record });
});

app.get("/api/admin/qlite-logs", requireAdmin, (req, res) => {
  return res.json({ logs: qliteRecords.logs.slice(0, 1000) });
});

app.delete("/api/admin/qlite-records/:recordId", requireAdmin, (req, res) => {
  if (!isTrustedQliteRequest(req)) {
    return res.status(403).json({ error: "Requests from this website are not allowed." });
  }

  const recordId = String(req.params.recordId || "").trim();
  const recordIndex = qliteRecords.records.findIndex((record) => record.id === recordId);
  if (recordIndex < 0) {
    return res.status(404).json({ error: "QLiTE record not found or already revoked." });
  }

  const [record] = qliteRecords.records.splice(recordIndex, 1);
  const createdAt = new Date().toISOString();
  const actor = {
    id: String(req.adminUser.id),
    username: String(req.adminUser.username || "Admin")
  };
  qliteRecords.logs.unshift({
    id: randomUUID(),
    action: "revoked",
    record: { ...record },
    actor,
    createdAt
  });
  try {
    saveQliteRecords();
  } catch (error) {
    qliteRecords.records.splice(recordIndex, 0, record);
    qliteRecords.logs.shift();
    console.error("Unable to persist a QLiTE record revocation:", error);
    return res.status(500).json({ error: "The QLiTE record could not be revoked." });
  }
  return res.json({ success: true, removedId: recordId });
});

app.get("/api/bans", (req, res) => {
  const bans = [...moderationState.bans].sort((a, b) => {
    return new Date(b.bannedAt || b.createdAt || 0).getTime() - new Date(a.bannedAt || a.createdAt || 0).getTime();
  });

  return res.json({ bans });
});

app.get("/api/reviews", (req, res) => {
  const reviews = [...moderationState.reviews].sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return res.json({ reviews });
});

app.post("/api/admin/reviews", requireAdmin, (req, res) => {
  const reviewerName = String((req.body && req.body.reviewerName) || "").trim();
  const title = String((req.body && req.body.title) || "").trim();
  const text = String((req.body && req.body.text) || "").trim();
  const ratingInput = Number(req.body && req.body.rating);
  const rating = Number.isInteger(ratingInput) && ratingInput >= 1 && ratingInput <= 5 ? ratingInput : 5;

  if (!reviewerName || !title || !text) {
    return res.status(400).json({ error: "reviewerName, title and text are required." });
  }

  const newReview = {
    id: `review-${randomUUID()}`,
    title,
    text,
    rating,
    reviewer: {
      id: req.adminUser.id,
      username: reviewerName || req.adminUser.username || "Admin",
      avatar: req.adminUser.avatar || ""
    },
    createdAt: new Date().toISOString()
  };

  moderationState.reviews.unshift(newReview);
  saveModerationState();
  return res.status(201).json({ success: true, review: newReview });
});

app.delete("/api/admin/reviews/:reviewId", requireAdmin, (req, res) => {
  const reviewId = String((req.params && req.params.reviewId) || "").trim();
  if (!reviewId) {
    return res.status(400).json({ error: "reviewId is required." });
  }

  const nextReviews = moderationState.reviews.filter((review) => review.id !== reviewId);
  if (nextReviews.length === moderationState.reviews.length) {
    return res.status(404).json({ error: "Review not found." });
  }

  moderationState.reviews = nextReviews;
  saveModerationState();
  return res.json({ success: true, removedId: reviewId });
});

app.get("/api/admin/me", requireAdmin, (req, res) => {
  return res.json({
    authenticated: true,
    user: req.adminUser,
    adminMode: "allowlist"
  });
});

app.get("/api/admin/qlite-accounts", requireAdmin, async (req, res) => {
  try {
    const accounts = await Promise.all(Object.values(qliteAccounts).map(async (account) => ({
      discordId: account.discordId,
      username: account.username,
      createdAt: account.createdAt,
      accessActive: await isQliteTrelloAccountActive(account.trelloCardId, account.trelloListId)
    })));
    accounts.sort((left, right) => left.username.localeCompare(right.username));
    return res.json({ accounts });
  } catch (error) {
    console.error("Unable to load QLiTE account access for admin:", error);
    return res.status(503).json({ error: "Could not verify QLiTE account access in Trello." });
  }
});

app.put("/api/admin/qlite-accounts/:discordId/access", requireAdmin, async (req, res) => {
  const discordId = String(req.params.discordId || "");
  const active = req.body?.active;
  if (!/^\d{1,25}$/.test(discordId) || typeof active !== "boolean") {
    return res.status(400).json({ error: "A valid Discord user ID and boolean access status are required." });
  }

  const account = qliteAccounts[discordId];
  if (!account) {
    return res.status(404).json({ error: "QLiTE account not found." });
  }

  try {
    const listId = account.trelloListId || await resolveQliteAccountsListId();
    let trelloCardId = account.trelloCardId;
    let accessActive = false;
    try {
      accessActive = await setQliteTrelloAccountAccess(trelloCardId, listId, active);
    } catch (error) {
      if (!active || error.status !== 404) throw error;
      trelloCardId = await createQliteTrelloAccountCard({
        id: account.discordId,
        username: account.username
      }, listId);
      accessActive = true;
    }

    if (accessActive !== active) {
      return res.status(502).json({ error: "Trello did not confirm the requested account access change." });
    }

    const previousAccount = { ...account };
    account.trelloCardId = trelloCardId;
    account.trelloListId = listId;
    try {
      saveQliteAccounts();
    } catch (error) {
      Object.assign(account, previousAccount);
      console.error("Unable to persist the QLiTE account access change:", error);
      return res.status(500).json({ error: "Trello was updated, but the server could not save the account record. Contact support." });
    }

    const affectedSessions = [];
    for (const [token, session] of discordSessions.entries()) {
      if (String(session.user?.id) === discordId && session.authMethod === "qlite-password") {
        affectedSessions.push(token);
      }
    }
    if (!active) {
      affectedSessions.forEach((token) => discordSessions.delete(token));
    }

    return res.json({
      success: true,
      discordId,
      username: account.username,
      accessActive,
      revokedSessions: active ? 0 : affectedSessions.length
    });
  } catch (error) {
    console.error("Unable to update QLiTE account access:", error);
    return res.status(502).json({ error: error.message || "Could not update QLiTE account access." });
  }
});

app.get("/api/admin/moderation", requireAdmin, (req, res) => {
  return res.json({
    bans: moderationState.bans
  });
});

app.post("/api/admin/bans", requireAdmin, async (req, res) => {
  const username = String((req.body && req.body.username) || "").trim();
  const altUsername = String((req.body && req.body.altUsername) || "").trim();
  const reason = String((req.body && req.body.reason) || "").trim();
  const typeInput = String((req.body && req.body.type) || "permanent").trim().toLowerCase();
  const bannedByInput = String((req.body && req.body.bannedBy) || "").trim();
  const appealStatus = String((req.body && req.body.appealStatus) || "").trim();
  const groupId = String((req.body && req.body.groupId) || "").trim();
  const bannedAt = toIsoDate((req.body && req.body.bannedAt) || "");

  if (!username || !reason) {
    return res.status(400).json({ error: "username and reason are required." });
  }

  const type = ["permanent", "temporary", "under-review"].includes(typeInput) ? typeInput : "permanent";
  const bannedBy = bannedByInput || req.adminUser.username || "ADMIN";

  const newBan = {
    id: `ban-${randomUUID()}`,
    username,
    altUsername,
    reason,
    type,
    bannedBy,
    appealStatus: appealStatus || (type === "permanent" ? "Permanent Ban" : "Appealable"),
    groupId: groupId || null,
    bannedAt,
    createdAt: new Date().toISOString()
  };

  moderationState.bans.unshift(newBan);
  saveModerationState();

  try {
    console.log("Attempting to send ban to Trello for:", newBan.username);
    await sendBanToTrello(newBan);
    console.log("Successfully sent ban to Trello");
  } catch (error) {
    console.error("Failed to send ban to Trello:", error);
  }

  return res.status(201).json({ success: true, ban: newBan });
});

app.delete("/api/admin/bans/:banId", requireAdmin, (req, res) => {
  const banId = String((req.params && req.params.banId) || "").trim();
  if (!banId) {
    return res.status(400).json({ error: "banId is required." });
  }

  const nextBans = moderationState.bans.filter((ban) => ban.id !== banId);
  if (nextBans.length === moderationState.bans.length) {
    return res.status(404).json({ error: "Ban not found." });
  }

  moderationState.bans = nextBans;
  saveModerationState();
  return res.json({ success: true, removedId: banId });
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

app.post("/api/verify-turnstile", async (req, res) => {
  const token = String((req.body && req.body.token) || "").trim();

  if (!CAPTCHA_SECRET) {
    return res.status(400).json({ success: false, error: "Captcha is not configured." });
  }

  if (!token) {
    return res.status(400).json({ success: false, error: "Captcha token is required." });
  }

  try {
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        secret: CAPTCHA_SECRET,
        response: token
      })
    });

    const verifyData = await verifyResponse.json();
    if (!verifyResponse.ok || !verifyData.success) {
      return res.status(400).json({ success: false, error: 'Captcha verification failed.', details: verifyData });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Captcha verification request failed:', error);
    return res.status(500).json({ success: false, error: 'Captcha verification service error.' });
  }
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


loadModerationState();
loadQliteAccounts();
loadQliteRecords();

// Service status notification endpoint
app.post("/api/notify-security", async (req, res) => {
  try {
    const webhookUrl = SECURITY_ALERTS_WEBHOOK;
    if (!webhookUrl) {
      return res.status(500).json({ error: "Security webhook is not configured." });
    }

    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const title = String(payload.title || "Unauthorized Admin Access Attempt");
    const username = String(payload.username || "Unknown user");
    const userId = String(payload.userId || "Unknown ID");
    const page = String(payload.page || req.originalUrl || "admin page");
    const details = String(payload.details || "An unauthorized request was blocked.");

    const embed = {
      embeds: [
        {
          title: title,
          description: details,
          color: 0xdc3545,
          fields: [
            { name: "Page", value: page, inline: true },
            { name: "Username", value: username, inline: true },
            { name: "Discord ID", value: userId, inline: true }
          ],
          footer: {
            text: "Queensland Interactive Security Alerts"
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(embed)
    });

    if (!response.ok) {
      console.error(`Security webhook failed: ${response.status}`);
      return res.status(500).json({ error: "Failed to send security webhook." });
    }

    return res.json({ success: true, message: "Security alert sent." });
  } catch (error) {
    console.error("Error sending security alert:", error);
    return res.status(500).json({ error: "Failed to send security alert." });
  }
});

app.post("/api/notify-404", async (req, res) => {
  try {
    const webhookUrl = SECURITY_ALERTS_WEBHOOK;
    if (!webhookUrl) {
      return res.status(500).json({ error: "Security webhook is not configured." });
    }

    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const title = String(payload.title || "404 Page Viewed");
    const page = String(payload.page || req.originalUrl || "Unknown page");
    const details = String(payload.details || "A 404 page was displayed.");

    const embed = {
      embeds: [
        {
          title: title,
          description: details,
          color: 0xf59e0b,
          fields: [
            { name: "Page", value: page, inline: true }
          ],
          footer: {
            text: "Queensland Interactive Error Webhook"
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(embed)
    });

    if (!response.ok) {
      console.error(`404 webhook failed: ${response.status}`);
      return res.status(500).json({ error: "Failed to send 404 webhook." });
    }

    return res.json({ success: true, message: "404 alert sent." });
  } catch (error) {
    console.error("Error sending 404 webhook:", error);
    return res.status(500).json({ error: "Failed to send 404 webhook." });
  }
});

app.post("/api/notify-status", async (req, res) => {
  try {
    const { service, status, message, timestamp, isTest } = req.body;

    if (!service || !status || !message) {
      return res.status(400).json({ error: "Missing required fields: service, status, message" });
    }

    // Only send webhook if service is offline
    if (status === "offline" && STATUSAPI_WEBHOOK) {
      const title = isTest 
        ? `🧪 [TEST] Service Alert: ${service} is Offline`
        : `🔴 Service Alert: ${service} is Offline`;
      
      const embed = {
        embeds: [
          {
            title: title,
            description: message,
            color: isTest ? 0x6366f1 : 0xef4444,
            fields: [
              {
                name: "Service",
                value: service.charAt(0).toUpperCase() + service.slice(1),
                inline: true
              },
              {
                name: "Status",
                value: isTest ? "Test Alert" : "Offline",
                inline: true
              },
              {
                name: isTest ? "Test Time" : "Detected At",
                value: new Date(timestamp || Date.now()).toLocaleString(),
                inline: false
              }
            ],
            footer: {
              text: isTest ? "Queensland Interactive Status API - Test Mode" : "Queensland Interactive Status API"
            },
            timestamp: new Date().toISOString()
          }
        ]
      };

      const response = await fetch(STATUSAPI_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(embed)
      });

      if (!response.ok) {
        console.error(`Failed to send status webhook: ${response.status}`);
      } else {
        console.log(`Status notification sent for ${service}${isTest ? ' (test)' : ''}`);
      }
    }

    return res.json({ success: true, notified: status === "offline" && !!STATUSAPI_WEBHOOK });
  } catch (error) {
    console.error("Error sending status notification:", error);
    return res.status(500).json({ error: "Failed to send status notification" });
  }
});

app.use(async (req, res) => {
  await notifyNotFoundWebhook(req);

  if (req.accepts('html')) {
    return res.status(404).sendFile(path.join(WEBSITE_ROOT, 'error', 'index.html'));
  }

  return res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, HOST, () => {
  console.log(`Roblox proxy running on http://${HOST}:${PORT}`);
});
