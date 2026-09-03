const apiBase = String(window.SITE_CONFIG?.API_SERVER_URL || window.location.origin).replace(/\/$/, '');

const getJson = async (path) => {
  const response = await fetch(`${apiBase}${path}`, { credentials: 'include', cache: 'no-store' });
  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

const setCardState = (element, state) => {
  element?.classList.remove('status-good', 'status-warn', 'status-bad');
  if (element && state) element.classList.add(`status-${state}`);
};

const updateFocusMode = (enabled) => {
  document.body.classList.toggle('staff-focus-mode', enabled);
  const button = document.getElementById('staff-focus-button');
  if (button) {
    button.setAttribute('aria-pressed', String(enabled));
    button.innerHTML = enabled ? '<span aria-hidden="true">×</span> Exit focus' : '<span aria-hidden="true">⛶</span> Focus view';
  }
};

const toggleFocusMode = async () => {
  const enabled = !document.body.classList.contains('staff-focus-mode');
  updateFocusMode(enabled);
  try {
    if (enabled && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    } else if (!enabled && document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.warn('Browser fullscreen unavailable; using focus layout.', error);
  }
};

const renderService = (service, stateId, metaId, cardId) => {
  const stateEl = document.getElementById(stateId);
  const metaEl = document.getElementById(metaId);
  const cardEl = document.getElementById(cardId);
  const online = service?.online === true;
  const state = service?.state === 'Online' ? 'Operational' : (service?.state || 'Unavailable');
  stateEl.textContent = state;
  metaEl.textContent = service?.responseMs != null ? `Response ${service.responseMs}ms` : (service?.detail || 'No check available');
  setCardState(cardEl, service?.state === 'Not configured' ? 'warn' : (online ? 'good' : 'bad'));
};

const renderUptime = (service, barId, labelId, uptimeMs) => {
  const bar = document.getElementById(barId);
  const label = document.getElementById(labelId);
  const downtimeMs = service?.downtimeMs || 0;
  const uptimePercent = uptimeMs > 0 ? Math.max(0, Math.min(100, (1 - downtimeMs / uptimeMs) * 100)) : 100;
  if (bar) bar.style.width = `${uptimePercent.toFixed(2)}%`;
  if (label) label.textContent = `${uptimePercent.toFixed(2)}% uptime since restart`;
};

const loadStaffOperations = async () => {
  const statusEl = document.getElementById('staff-status');
  const dashboardEl = document.getElementById('staff-dashboard');
  const loginPromptEl = document.getElementById('staff-login-prompt');
  try {
    await getJson('/api/admin/me');
    const [live, metrics] = await Promise.all([getJson('/api/live-status'), getJson('/api/metrics')]);
    const services = metrics.services || live.services || {};
    renderService({ state: 'Online', online: true, responseMs: metrics.averageResponseMs }, 'staff-api-state', 'staff-api-meta', 'staff-api-card');
    renderService(services.website, 'staff-website-state', 'staff-website-meta', 'staff-website-card');
    renderService(services.game, 'staff-game-state', 'staff-game-meta', 'staff-game-card');
    renderUptime({ downtimeMs: 0 }, 'staff-api-bar', 'staff-api-uptime', metrics.uptimeSeconds * 1000);
    renderUptime(services.website, 'staff-website-bar', 'staff-website-uptime', metrics.uptimeSeconds * 1000);
    renderUptime(services.game, 'staff-game-bar', 'staff-game-uptime', metrics.uptimeSeconds * 1000);
    document.getElementById('staff-uptime').textContent = metrics.uptime || 'Unavailable';
    document.getElementById('staff-speed').textContent = `${metrics.averageResponseMs ?? '-'}ms`;
    document.getElementById('staff-requests').textContent = String(metrics.requests ?? '-');
    document.getElementById('staff-downtime').textContent = services.website?.downtime || '0d 0h 0m 0s';
    document.getElementById('staff-downtime-meta').textContent = `Game ${services.game?.downtime || '0d 0h 0m 0s'}`;
    document.getElementById('staff-last-check').textContent = new Date(metrics.checkedAt).toLocaleTimeString();
    document.getElementById('staff-updated').textContent = `Live check ${new Date(metrics.checkedAt).toLocaleTimeString()}`;
    const servicesOnline = [services.website, services.game].every((service) => service?.online === true);
    document.getElementById('staff-overall-title').textContent = servicesOnline ? 'All systems operational' : 'Service attention required';
    document.getElementById('staff-overall-meta').textContent = `Last updated ${new Date(metrics.checkedAt).toLocaleTimeString()}`;
    statusEl.textContent = 'Staff access verified.  -  DOMAIN: queenslandinteractive-rblx.com';
    dashboardEl.style.display = 'block';
  } catch (error) {
    const requiresLogin = error.status === 401 || error.status === 403;
    const missingDeployment = error.status === 404;
    statusEl.textContent = requiresLogin
      ? 'Staff access required. Sign in through the admin panel.'
      : missingDeployment
        ? 'The Railway API is running an older deployment. Redeploy the current server code.'
        : 'Live staff telemetry is unavailable.';
    statusEl.classList.add('admin-error');
    if (loginPromptEl) loginPromptEl.style.display = requiresLogin ? 'block' : 'none';
    dashboardEl.style.display = 'none';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('staff-focus-button')?.addEventListener('click', toggleFocusMode);
  document.addEventListener('fullscreenchange', () => updateFocusMode(Boolean(document.fullscreenElement)));
  loadStaffOperations();
  window.setInterval(loadStaffOperations, 30 * 1000);
});
