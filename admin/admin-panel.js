class AdminPanel {
  constructor() {
    this.statusEl = document.getElementById('admin-status');
    this.loginBtn = document.getElementById('admin-login');
    this.logoutBtn = document.getElementById('admin-logout');
    this.banForm = document.getElementById('ban-form');
    this.notifForm = document.getElementById('notification-form');
    this.banList = document.getElementById('ban-list');
    this.isAdmin = false;
    this.apiBase = this.resolveApiBase();

    this.bindEvents();
    this.initialize();
  }

  bindEvents() {
    this.loginBtn?.addEventListener('click', () => {
      const returnTo = encodeURIComponent(window.location.href);
      window.location.href = `${this.apiBase}/auth/discord/start?returnTo=${returnTo}`;
    });

    this.logoutBtn?.addEventListener('click', async () => {
      await fetch(`${this.apiBase}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      this.isAdmin = false;
      this.setStatus('Logged out.', 'info');
      this.toggleForms(false);
    });

    this.banForm?.addEventListener('submit', (event) => this.handleBanSubmit(event));
    this.notifForm?.addEventListener('submit', (event) => this.handleNotificationSubmit(event));
  }

  resolveApiBase() {
    const configured = (window.SITE_CONFIG && (window.SITE_CONFIG.RAILWAY_SERVER_URL || window.SITE_CONFIG.robloxProxyBase)) || '';
    const cleanConfigured = String(configured || '').trim().replace(/\/$/, '');
    return cleanConfigured || window.location.origin;
  }

  setStatus(message, type = 'info') {
    if (!this.statusEl) return;
    this.statusEl.className = 'admin-status';
    if (type === 'error') this.statusEl.classList.add('admin-error');
    if (type === 'success') this.statusEl.classList.add('admin-success');
    this.statusEl.textContent = message;
  }

  toggleForms(enabled) {
    [this.banForm, this.notifForm].forEach((form) => {
      if (!form) return;
      Array.from(form.elements).forEach((field) => {
        field.disabled = !enabled;
      });
    });
  }

  formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString();
  }

  escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async initialize() {
    this.toggleForms(false);
    await this.refreshAuth();
    if (this.isAdmin) {
      await this.loadBans();
    }
  }

  async refreshAuth() {
    try {
      const response = await fetch(`${this.apiBase}/api/admin/me`, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) {
        this.isAdmin = false;
        this.setStatus('Not authenticated as admin. Login with Discord to continue.', 'error');
        this.toggleForms(false);
        return;
      }

      const payload = await response.json();
      this.isAdmin = true;
      this.setStatus(`Signed in as ${payload.user.username}. Admin access active.`, 'success');
      this.toggleForms(true);
    } catch (error) {
      this.isAdmin = false;
      this.setStatus('Could not verify admin session right now.', 'error');
      this.toggleForms(false);
    }
  }

  async handleBanSubmit(event) {
    event.preventDefault();
    if (!this.isAdmin) return;

    const payload = {
      username: document.getElementById('ban-username')?.value.trim(),
      altUsername: document.getElementById('ban-alt')?.value.trim(),
      type: document.getElementById('ban-type')?.value,
      reason: document.getElementById('ban-reason')?.value.trim(),
      bannedBy: document.getElementById('ban-by')?.value.trim(),
      appealStatus: document.getElementById('ban-appeal')?.value.trim()
    };

    try {
      const response = await fetch(`${this.apiBase}/api/admin/bans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to add ban.');
      }

      this.setStatus('Ban added successfully.', 'success');
      this.banForm.reset();
      await this.loadBans();
    } catch (error) {
      this.setStatus('Failed to add ban. Check your admin access and try again.', 'error');
    }
  }

  async handleNotificationSubmit(event) {
    event.preventDefault();
    if (!this.isAdmin) return;

    const payload = {
      title: document.getElementById('notif-title')?.value.trim(),
      message: document.getElementById('notif-message')?.value.trim(),
      type: document.getElementById('notif-type')?.value,
      link: document.getElementById('notif-link')?.value.trim(),
      linkText: document.getElementById('notif-link-text')?.value.trim(),
      persistent: Boolean(document.getElementById('notif-persistent')?.checked)
    };

    try {
      const response = await fetch(`${this.apiBase}/api/admin/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to push notification.');
      }

      this.setStatus('Toast notification pushed to users.', 'success');
      this.notifForm.reset();
    } catch (error) {
      this.setStatus('Failed to push notification. Check your admin access and try again.', 'error');
    }
  }

  async loadBans() {
    try {
      const response = await fetch(`${this.apiBase}/api/bans`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      const bans = Array.isArray(payload.bans) ? payload.bans : [];

      if (!this.banList) return;
      if (bans.length === 0) {
        this.banList.innerHTML = '<div class="admin-meta">No active bans.</div>';
        return;
      }

      this.banList.innerHTML = bans.map((ban) => {
        const title = this.escapeHtml(ban.username || 'Unknown User');
        const reason = this.escapeHtml(ban.reason || 'No reason');
        const meta = `${this.formatDate(ban.bannedAt || ban.createdAt)} • ${this.escapeHtml(ban.type || 'ban')}`;

        return `
          <div class="admin-list-item">
            <div>
              <div><strong>${title}</strong></div>
              <div class="admin-meta">${reason}</div>
              <div class="admin-meta">${meta}</div>
            </div>
            <button class="admin-btn admin-btn-danger" type="button" data-remove-ban="${this.escapeHtml(ban.id)}">Remove</button>
          </div>
        `;
      }).join('');

      this.banList.querySelectorAll('[data-remove-ban]').forEach((button) => {
        button.addEventListener('click', () => this.removeBan(button.getAttribute('data-remove-ban')));
      });
    } catch (error) {
      if (this.banList) {
        this.banList.innerHTML = '<div class="admin-meta">Failed to load bans.</div>';
      }
    }
  }

  async removeBan(banId) {
    if (!banId || !this.isAdmin) return;

    try {
      const response = await fetch(`${this.apiBase}/api/admin/bans/${encodeURIComponent(banId)}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to remove ban');
      }

      this.setStatus('Ban removed successfully.', 'success');
      await this.loadBans();
    } catch (error) {
      this.setStatus('Failed to remove ban. Check your admin access and try again.', 'error');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AdminPanel());
} else {
  new AdminPanel();
}
