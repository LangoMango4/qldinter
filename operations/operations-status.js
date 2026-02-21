const PROXY_BASE = (window.SITE_CONFIG && window.SITE_CONFIG.robloxProxyBase) || "";

const buildProxyUrl = (path) => {
  if (!PROXY_BASE) {
    return path;
  }
  return `${PROXY_BASE}${path}`;
};

const fetchJson = async (url) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

const setCardState = (cardEl, state) => {
  if (!cardEl) {
    return;
  }

  cardEl.classList.remove("status-good", "status-warn", "status-bad");
  if (state === "good") {
    cardEl.classList.add("status-good");
  } else if (state === "warn") {
    cardEl.classList.add("status-warn");
  } else {
    cardEl.classList.add("status-bad");
  }
};

const applyServiceStatus = (service, valueEl, metaEl, cardEl) => {
  if (!valueEl || !metaEl) {
    return;
  }

  if (!service) {
    valueEl.textContent = "Unavailable";
    metaEl.textContent = "Status API unavailable";
    setCardState(cardEl, "bad");
    return;
  }

  if (service.state === "Not configured") {
    valueEl.textContent = "Not Set";
    metaEl.textContent = "Add endpoint in server config";
    setCardState(cardEl, "warn");
    return;
  }

  valueEl.textContent = service.online ? "Online" : "Offline";
  setCardState(cardEl, service.online ? "good" : "bad");
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
  const sessionCard = document.getElementById("ops-session-card");
  const websiteCard = document.getElementById("ops-website-card");
  const gameCard = document.getElementById("ops-game-card");

  if (!ssuValueEl || !websiteEl || !gameEl) {
    return;
  }

  try {
    const data = await fetchJson(buildProxyUrl("/api/live-status"));
    const ssu = data.ssu || {};

    ssuValueEl.textContent = ssu.label || "Unavailable";
    if (ssuMetaEl) {
      if (ssu.label === "Not configured") {
        ssuMetaEl.textContent = "Connect your session status endpoint";
        setCardState(sessionCard, "warn");
      } else if (typeof ssu.label === "string" && ssu.label.toUpperCase().includes("SSP")) {
        ssuMetaEl.textContent = ssu.active
          ? "Startup poll active (vote phase before SSU)"
          : "Startup poll closed";
        setCardState(sessionCard, "warn");
      } else {
        ssuMetaEl.textContent = ssu.active ? "Session currently running" : "No active session";
        setCardState(sessionCard, ssu.active ? "good" : "bad");
      }
    }

    const services = data.services || {};
    applyServiceStatus(services.website, websiteEl, websiteMetaEl, websiteCard);
    applyServiceStatus(services.game, gameEl, gameMetaEl, gameCard);
  } catch (error) {
    ssuValueEl.textContent = "Unavailable";
    if (ssuMetaEl) {
      ssuMetaEl.textContent = "Status API unavailable";
    }
    setCardState(sessionCard, "bad");

    applyServiceStatus(null, websiteEl, websiteMetaEl, websiteCard);
    applyServiceStatus(null, gameEl, gameMetaEl, gameCard);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadLiveOperationsStatus();

  window.setInterval(() => {
    loadLiveOperationsStatus();
  }, 60 * 1000);
});
