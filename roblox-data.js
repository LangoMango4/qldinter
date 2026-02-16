const GROUP_ID = 35458162;
const GROUP_URL = "https://www.roblox.com/communities/35458162/QI-Queensland-Interactive#!/about";
const PROXY_BASE = (window.SITE_CONFIG && window.SITE_CONFIG.robloxProxyBase) || "";
const TEAM_BIOS = (window.SITE_CONFIG && window.SITE_CONFIG.teamBios) || {};

const buildProxyUrl = (path) => {
  if (!PROXY_BASE) {
    return path;
  }
  return `${PROXY_BASE}${path}`;
};

const formatNumber = (value) => {
  if (typeof value !== "number") {
    return "--";
  }
  return value.toLocaleString("en-US");
};

const fetchJson = async (url) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

const loadGroupStatus = async () => {
  const membersEl = document.getElementById("group-member-count");
  const activeEl = document.getElementById("group-active-count");
  const gamesEl = document.getElementById("group-games-count");
  const statusLink = document.getElementById("group-status-link");

  if (!membersEl || !activeEl || !gamesEl) {
    return;
  }

  membersEl.textContent = "Loading...";
  activeEl.textContent = "Loading...";
  gamesEl.textContent = "Loading...";

  if (statusLink) {
    statusLink.href = GROUP_URL;
  }

  try {
    const statusData = await fetchJson(buildProxyUrl("/api/group-status"));
    membersEl.textContent = formatNumber(statusData.memberCount);
    gamesEl.textContent = formatNumber(statusData.gamesCount);
    activeEl.textContent = formatNumber(statusData.activeCount);
  } catch (error) {
    membersEl.textContent = "Unavailable";
    activeEl.textContent = "Unavailable";
    gamesEl.textContent = "Unavailable";
  }
};

const loadTeamMembers = async () => {
  const grid = document.getElementById("team-grid");
  const status = document.getElementById("team-status");

  if (!grid || !status) {
    return;
  }

  status.textContent = "Loading team members...";

  try {
    const teamData = await fetchJson(buildProxyUrl("/api/team-members"));
    const members = Array.isArray(teamData.members) ? teamData.members : [];

    if (members.length === 0) {
      status.textContent = "No members found for rank 198+.";
      return;
    }

    status.textContent = `Showing ${members.length} team members.`;

    grid.innerHTML = "";
    members.forEach((member) => {
      const profileUrl = `https://www.roblox.com/users/${member.id}/profile`;

      const card = document.createElement("a");
      card.className = "team-card";
      card.href = profileUrl;
      card.target = "_blank";
      card.rel = "noopener";

      const img = document.createElement("img");
      img.src =
        member.avatarUrl ||
        `https://www.roblox.com/headshot-thumbnail/image?userId=${member.id}&width=150&height=150&format=png`;
      img.alt = member.name;

      const info = document.createElement("div");
      info.className = "team-info";

      const name = document.createElement("span");
      name.className = "team-name";
      name.textContent = member.name;

      const role = document.createElement("span");
      role.className = "team-role";
      role.textContent = member.role;

      const bio = document.createElement("p");
      bio.className = "team-bio";
      bio.textContent = TEAM_BIOS[String(member.id)] || "Bio coming soon.";

      info.appendChild(name);
      info.appendChild(role);
      info.appendChild(bio);

      card.appendChild(img);
      card.appendChild(info);
      grid.appendChild(card);
    });
  } catch (error) {
    status.textContent = "Unable to load team members right now.";
    status.classList.add("error");
  }
};

const loadTikTokStats = async () => {
  const followersEl = document.getElementById("tiktok-followers");
  const likesEl = document.getElementById("tiktok-likes");
  const videosEl = document.getElementById("tiktok-videos");
  const linkEl = document.getElementById("tiktok-status-link");

  if (!followersEl || !likesEl || !videosEl) {
    return;
  }

  followersEl.textContent = "Loading...";
  likesEl.textContent = "Loading...";
  videosEl.textContent = "Loading...";

  try {
    const data = await fetchJson(buildProxyUrl("/api/tiktok-stats"));
    followersEl.textContent = formatNumber(data.followers);
    likesEl.textContent = formatNumber(data.likes);
    videosEl.textContent = formatNumber(data.videos);

    if (linkEl && data.profileUrl) {
      linkEl.href = data.profileUrl;
    }
  } catch (error) {
    followersEl.textContent = "Unavailable";
    likesEl.textContent = "Unavailable";
    videosEl.textContent = "Unavailable";
  }
};

const applyServiceStatus = (service, valueEl, metaEl) => {
  if (!valueEl || !metaEl) {
    return;
  }

  if (!service) {
    valueEl.textContent = "Unavailable";
    metaEl.textContent = "Status API unavailable";
    return;
  }

  if (service.state === "Not configured") {
    valueEl.textContent = "Not Set";
    metaEl.textContent = "Add endpoint in server config";
    return;
  }

  valueEl.textContent = service.online ? "Online" : "Offline";
  if (typeof service.responseMs === "number") {
    metaEl.textContent = `Response ${service.responseMs}ms`;
  } else {
    metaEl.textContent = service.detail || "Check unavailable";
  }
};

const loadLiveOperationsStatus = async () => {
  const ssuValueEl = document.getElementById("ssu-active-status");
  const ssuMetaEl = document.getElementById("ssu-active-meta");
  const websiteEl = document.getElementById("uptime-website");
  const websiteMetaEl = document.getElementById("uptime-website-meta");
  const gameEl = document.getElementById("uptime-game");
  const gameMetaEl = document.getElementById("uptime-game-meta");
  const opsLinkEl = document.getElementById("ops-status-link");

  if (!ssuValueEl || !websiteEl || !gameEl) {
    return;
  }

  try {
    const data = await fetchJson(buildProxyUrl("/api/live-status"));
    const ssu = data.ssu || {};

    ssuValueEl.textContent = ssu.label || "Unavailable";
    if (ssuMetaEl) {
      if (ssu.label === "Not configured") {
        ssuMetaEl.textContent = "Connect your BotGhost SSU endpoint";
      } else if (typeof ssu.label === "string" && ssu.label.toUpperCase().includes("SSP")) {
        ssuMetaEl.textContent = ssu.active
          ? "Startup poll active (vote phase before SSU)"
          : "Startup poll closed";
      } else {
        ssuMetaEl.textContent = ssu.active ? "Session currently running" : "No active session";
      }
    }

    if (opsLinkEl && ssu.link) {
      opsLinkEl.href = ssu.link;
    }

    const services = data.services || {};
    applyServiceStatus(services.website, websiteEl, websiteMetaEl);
    applyServiceStatus(services.game, gameEl, gameMetaEl);
  } catch (error) {
    ssuValueEl.textContent = "Unavailable";
    if (ssuMetaEl) {
      ssuMetaEl.textContent = "Status API unavailable";
    }

    applyServiceStatus(null, websiteEl, websiteMetaEl);
    applyServiceStatus(null, gameEl, gameMetaEl);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadGroupStatus();
  loadTeamMembers();
  loadTikTokStats();
  loadLiveOperationsStatus();

  window.setInterval(() => {
    loadLiveOperationsStatus();
  }, 60 * 1000);
});
