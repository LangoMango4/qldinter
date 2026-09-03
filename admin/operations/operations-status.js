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

const renderService = (service, stateId, metaId, cardId) => {
  const stateEl = document.getElementById(stateId);
  const metaEl = document.getElementById(metaId);
  const cardEl = document.getElementById(cardId);
  const online = service?.online === true;
  stateEl.textContent = service?.state || 'Unavailable';
  metaEl.textContent = service?.responseMs != null ? `Response ${service.responseMs}ms` : (service?.detail || 'No check available');
  setCardState(cardEl, service?.state === 'Not configured' ? 'warn' : (online ? 'good' : 'bad'));
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
    document.getElementById('staff-uptime').textContent = metrics.uptime || 'Unavailable';
    document.getElementById('staff-speed').textContent = `${metrics.averageResponseMs ?? '-'}ms`;
    document.getElementById('staff-requests').textContent = String(metrics.requests ?? '-');
    document.getElementById('staff-downtime').textContent = services.website?.downtime || '0d 0h 0m 0s';
    document.getElementById('staff-downtime-meta').textContent = `Game ${services.game?.downtime || '0d 0h 0m 0s'}`;
    document.getElementById('staff-updated').textContent = `Live check ${new Date(metrics.checkedAt).toLocaleTimeString()}`;
    statusEl.textContent = 'Staff access verified.';
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
  loadStaffOperations();
  window.setInterval(loadStaffOperations, 30 * 1000);
});
