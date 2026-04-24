class AdminPanel {
  constructor() {
    this.statusEl = document.getElementById('admin-status');
    this.loginBtn = document.getElementById('admin-login');
    this.logoutBtn = document.getElementById('admin-logout');
    this.banForm = document.getElementById('ban-form');
    this.banList = document.getElementById('ban-list');
    this.adminArea = document.getElementById('admin-access-area');
    this.webhookTestBtn = document.getElementById('test-webhook-btn');
    this.webhookTestStatus = document.getElementById('webhook-test-status');
    this.trelloLink = document.getElementById('admin-trello-link');
    this.isAdmin = false;
    this.lastWebhookTest = 0;
    this.apiBase = this.resolveApiBase();

    this.bindEvents();
    this.initialize();
  }

  bindEvents() {
    this.loginBtn?.addEventListener('click', () => {
      sessionStorage.setItem('qi_admin_login_attempt', 'true');
      const returnTo = encodeURIComponent(window.location.href);
      window.location.href = `${this.apiBase}/auth/discord/start?returnTo=${returnTo}`;
    });

    this.logoutBtn?.addEventListener('click', async () => {
      await fetch(`${this.apiBase}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      this.isAdmin = false;
      this.setStatus('Logged out.', 'info');
      this.toggleForms(false);
      this.toggleAdminArea(false);
      this.toggleTrelloLink(false);
    });

    this.banForm?.addEventListener('submit', (event) => this.handleBanSubmit(event));

    this.webhookTestBtn?.addEventListener('click', () => this.testWebhook());
  }

  resolveApiBase() {
    const configured = (window.SITE_CONFIG && (window.SITE_CONFIG.RAILWAY_SERVER_URL || window.SITE_CONFIG.robloxProxyBase)) || '';
    const cleanConfigured = String(configured || '').trim().replace(/\/$/, '');
    return cleanConfigured || window.location.origin;
  }

  consumeLoginAttempt() {
    const attempted = sessionStorage.getItem('qi_admin_login_attempt') === 'true';
    sessionStorage.removeItem('qi_admin_login_attempt');
    return attempted;
  }

  setStatus(message, type = 'info') {
    if (!this.statusEl) return;
    this.statusEl.className = 'admin-status';
    if (type === 'error') this.statusEl.classList.add('admin-error');
    if (type === 'success') this.statusEl.classList.add('admin-success');
    this.statusEl.textContent = message;
  }

  toggleForms(enabled) {
    if (!this.banForm) return;
    Array.from(this.banForm.elements).forEach((field) => {
      field.disabled = !enabled;
    });
  }

  async handleBanSubmit(event) {
    event.preventDefault();
    if (!this.isAdmin) return;

    const payload = {
      username: document.getElementById('ban-username')?.value.trim(),
      altUsername: document.getElementById('ban-alt')?.value.trim(),
      type: document.getElementById('ban-type')?.value,
      reason: document.getElementById('ban-reason')?.value,
      appealStatus: document.getElementById('ban-appeal')?.value.trim(),
      groupId: document.getElementById('ban-group-id')?.value.trim()
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

  toggleAdminArea(enabled) {
    if (this.adminArea) {
      this.adminArea.style.display = enabled ? 'block' : 'none';
    }
    if (this.loginBtn) {
      this.loginBtn.style.display = enabled ? 'none' : 'inline-flex';
    }
    if (this.logoutBtn) {
      this.logoutBtn.style.display = enabled ? 'inline-flex' : 'none';
    }
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
    this.toggleAdminArea(false);
    this.toggleTrelloLink(false);
    await this.refreshAuth();
    if (this.isAdmin) {
      await this.loadBans();
    }
  }

  toggleTrelloLink(enabled) {
    if (!this.trelloLink) {
      return;
    }
    this.trelloLink.style.display = enabled ? 'inline-flex' : 'none';
  }

  async notifySecurityAlert(statusCode) {
    try {
      await fetch(`${this.apiBase}/api/notify-security`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthorized Admin Panel Access Attempt',
          page: window.location.pathname,
          userId: 'Unknown',
          username: 'Unknown',
          details: `Attempt to access admin interface failed with status ${statusCode}.`
        })
      });
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  async refreshAuth() {
    try {
      const response = await fetch(`${this.apiBase}/api/admin/me`, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) {
        this.isAdmin = false;
        this.toggleForms(false);
        this.toggleAdminArea(false);
        this.toggleTrelloLink(false);

        if (response.status === 401 || response.status === 403) {
          const attemptedLogin = this.consumeLoginAttempt();
          if (attemptedLogin) {
            this.setStatus('Unauthorized login failed. Security alert has been recorded.', 'error');
            this.notifySecurityAlert(response.status);
          } else {
            this.setStatus('Not authenticated as admin. Login with Discord to continue.', 'error');
          }
        } else {
          this.setStatus('Not authenticated as admin. Login with Discord to continue.', 'error');
        }

        return;
      }

      const payload = await response.json();
      this.isAdmin = true;
      this.setStatus(`Welcome, ${payload.user.username}. Admin access active.`, 'success');
      this.toggleForms(true);
      this.toggleAdminArea(true);
      this.toggleTrelloLink(true);
    } catch (error) {
      this.isAdmin = false;
      this.setStatus('Please retry otherwise contact your IT Administrator', 'error');
      this.toggleForms(false);
      this.toggleAdminArea(false);
      this.toggleTrelloLink(false);
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
      appealStatus: document.getElementById('ban-appeal')?.value.trim(),
      groupId: document.getElementById('ban-group-id')?.value.trim()
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
        const groupInfo = ban.groupId ? ` • Group: ${this.escapeHtml(ban.groupId)}` : '';

        return `
          <div class="admin-list-item">
            <div>
              <div><strong>${title}</strong></div>
              <div class="admin-meta">${reason}${groupInfo}</div>
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

  async testWebhook() {
    if (!this.isAdmin) {
      this.setWebhookTestStatus('Not authenticated as admin.', 'error');
      return;
    }

    const now = Date.now();
    const timeSinceLastTest = (now - this.lastWebhookTest) / 1000;
    const cooldownRemaining = 20 - Math.floor(timeSinceLastTest);

    if (timeSinceLastTest < 20) {
      this.setWebhookTestStatus(`Cooldown active. Try again in ${cooldownRemaining} second${cooldownRemaining !== 1 ? 's' : ''}.`, 'error');
      return;
    }

    this.webhookTestBtn.disabled = true;
    this.webhookTestBtn.style.opacity = '0.6';
    this.setWebhookTestStatus('Sending test notification...', 'info');

    try {
      const response = await fetch(`${this.apiBase}/api/notify-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service: 'test',
          status: 'offline',
          message: '[TEST] Service notification system test - This is a test webhook alert from the admin panel.',
          timestamp: new Date().toISOString(),
          isTest: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      this.lastWebhookTest = now;

      if (result.notified) {
        this.setWebhookTestStatus('✓ Test notification sent successfully! Check Discord.', 'success');
      } else {
        this.setWebhookTestStatus('⚠ Test sent but webhook not configured (STATUSAPI_WEBHOOK not set).', 'warn');
      }
    } catch (error) {
      this.setWebhookTestStatus(`Failed to send test notification: ${error.message}`, 'error');
    } finally {
      this.webhookTestBtn.disabled = false;
      this.webhookTestBtn.style.opacity = '1';
    }
  }

  setWebhookTestStatus(message, type = 'info') {
    if (!this.webhookTestStatus) return;

    const styles = {
      info: 'border-left: 4px solid #1e90ff; background: #e8f3ff; color: #0a4a8a;',
      success: 'border-left: 4px solid #22c55e; background: #e9f9ef; color: #146a38;',
      error: 'border-left: 4px solid #dc3545; background: #fdeaea; color: #8a1f2b;',
      warn: 'border-left: 4px solid #f59e0b; background: #fffbeb; color: #92400e;'
    };

    this.webhookTestStatus.style.cssText = `${styles[type]} border-radius: 8px; padding: 12px; margin-top: 12px; font-size: 0.95rem;`;
    this.webhookTestStatus.textContent = message;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AdminPanel());
} else {
  new AdminPanel();
}

