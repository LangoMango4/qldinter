window.SITE_CONFIG = {
  // MAINTENANCE MODE
  // Toggle maintenance: set to true to enable, false to disable
  maintenance: false,
  
  // Set when maintenance ends (ISO 8601 format)
  // Format: "YYYY-MM-DDTHH:MM:SSZ" (UTC time)
  // Example: "2026-02-11T14:30:00Z" = Feb 11, 2026 at 2:30 PM UTC
  // Or use: new Date().setHours(new Date().getHours() + 2) to add hours from now
  maintenanceEnds: "2026-02-11T01:36:00Z",
  
  // Roblox API proxy base URL
  robloxProxyBase: "http://localhost:3000",
  
  // Team member bios (keyed by Roblox user ID)
  teamBios: {
    "1889995156": "Managing director and lead developer.",
    "87654321": "Community manager and events lead."
  }
};
