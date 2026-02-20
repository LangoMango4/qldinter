class BannedUsersPage {
  constructor() {
    this.listElement = document.getElementById('bans-list');
    this.apiBase = this.resolveApiBase();
    this.apiUrl = `${this.apiBase}/api/bans`;
  }

  resolveApiBase() {
    const configured = (window.SITE_CONFIG && (window.SITE_CONFIG.RAILWAY_SERVER_URL || window.SITE_CONFIG.robloxProxyBase)) || '';
    const cleanConfigured = String(configured || '').trim().replace(/\/$/, '');
    return cleanConfigured || window.location.origin;
  }

  formatType(type) {
    if (type === 'permanent') return 'Permanent Ban';
    if (type === 'temporary') return 'Temporary Ban';
    if (type === 'under-review') return 'Under Review';
    return 'Ban';
  }

  formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Unknown';
    }

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  renderNoBans(message = 'No active bans right now.') {
    this.listElement.innerHTML = `
      <div class="no-bans">
        <div class="icon">✅</div>
        <h3>${this.escapeHtml(message)}</h3>
      </div>
    `;
  }

  renderBans(bans) {
    if (!Array.isArray(bans) || bans.length === 0) {
      this.renderNoBans();
      return;
    }

    this.listElement.innerHTML = bans.map((ban) => {
      const type = ['permanent', 'temporary', 'under-review'].includes(ban.type)
        ? ban.type
        : 'permanent';
      const username = this.escapeHtml(ban.username || 'Unknown User');
      const altUsername = this.escapeHtml(ban.altUsername || '');
      const reason = this.escapeHtml(ban.reason || 'No reason provided');
      const bannedBy = this.escapeHtml(ban.bannedBy || 'SYSTEM');
      const appealStatus = this.escapeHtml(ban.appealStatus || 'Not specified');
      const bannedAt = this.formatDate(ban.bannedAt || ban.createdAt);

      return `
        <div class="ban-item ${type}">
          <div class="ban-header">
            <div class="ban-username">${username}</div>
            ${altUsername ? `<div class="ban-username">Alt: ${altUsername}</div>` : ''}
            <span class="ban-badge ${type}">${this.formatType(type)}</span>
          </div>
          <div class="ban-details">
            <strong>Reason:</strong> ${reason}
          </div>
          <div class="ban-meta">
            <div class="ban-meta-item">
              <span>Banned: ${this.escapeHtml(bannedAt)}</span>
            </div>
            <div class="ban-meta-item">
              <span>Banned By: ${bannedBy}</span>
            </div>
            <div class="ban-meta-item">
              <span>Appeal Status: ${appealStatus}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async loadBans() {
    try {
      const response = await fetch(this.apiUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load bans');
      }

      const payload = await response.json();
      this.renderBans(payload.bans || []);
    } catch (error) {
      this.renderNoBans('Could not load bans right now. Please try again later.');
    }
  }

  init() {
    if (!this.listElement) {
      return;
    }

    this.loadBans();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new BannedUsersPage().init();
  });
} else {
  new BannedUsersPage().init();
}
