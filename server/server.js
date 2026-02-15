const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const GROUP_ID = 35458162;
const TIKTOK_HANDLE = "qldinteractive";
const TIKTOK_URL = `https://www.tiktok.com/@${TIKTOK_HANDLE}`;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || "";
app.use(express.json());

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
  tiktokStats: { value: null, expiresAt: 0 }
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

app.post("/api/feedback", async (req, res) => {
  try {
    const { type, username, title, description, severity, captchaToken } = req.body;

    // Validate required fields
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
