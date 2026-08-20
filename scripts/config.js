window.SITE_CONFIG = {
  // MAINTENANCE MODE
  // Toggle maintenance: set to true to enable, false to disable
  maintenance: false,
  
  // Set when maintenance ends (ISO 8601 format)
  // Format: "YYYY-MM-DDTHH:MM:SSZ" (UTC time)
  // Example: "2026-02-11T14:30:00Z" = Feb 11, 2026 at 2:30 PM UTC
  // Or use: new Date().setHours(new Date().getHours() + 2) to add hours from now
  maintenanceEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  
  // Roblox API proxy base URL
  // Leave empty when this website and API run on the same domain.
  // Set a full HTTPS URL only when the API is hosted separately.
  API_SERVER_URL: "",
  
  // Cloudflare Turnstile
  // Get your site key from: https://dash.cloudflare.com/?to=/:account/turnstile
  // The server-side secret is configured as CAPTCHA_SECRET.
  // Set to empty string "" to disable Turnstile (will skip captcha verification)
  // Note: If Turnstile is unavailable or fails to load, users can skip after 3 seconds
  turnstileSiteKey: "", // Replace with your actual site key or leave empty to disable
  
  // Team member bios (keyed by Roblox user ID)
  teamBios: {
    "1889995156": "Managing director and lead developer.",
    "87654321": "Community manager and events lead."
  }
};

