// Cloudflare Turnstile Integration
// This script handles Turnstile widget rendering and verification

const TurnstileManager = {
  isEnabled: () => {
    return window.SITE_CONFIG && window.SITE_CONFIG.turnstileSiteKey && window.SITE_CONFIG.turnstileSiteKey.length > 0;
  },

  renderWidget: (containerId, callback) => {
    if (!TurnstileManager.isEnabled()) {
      console.log('Turnstile is disabled - no site key configured');
      if (callback) callback(null);
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Turnstile container #${containerId} not found`);
      return;
    }

    // Wait for Turnstile API to load
    const checkTurnstile = setInterval(() => {
      if (window.turnstile) {
        clearInterval(checkTurnstile);
        
        try {
          turnstile.render(`#${containerId}`, {
            sitekey: window.SITE_CONFIG.turnstileSiteKey,
            callback: (token) => {
              console.log('Turnstile verification successful');
              if (callback) callback(token);
            },
            'error-callback': () => {
              console.error('Turnstile verification failed');
              if (callback) callback(null);
            },
            theme: 'dark', // or 'light' depending on your design
            size: 'normal' // or 'compact'
          });
        } catch (error) {
          console.error('Error rendering Turnstile:', error);
        }
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkTurnstile);
    }, 10000);
  },

  // Verify token on your backend (example function)
  verifyToken: async (token) => {
    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    try {
      const response = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      return await response.json();
    } catch (error) {
      console.error('Error verifying Turnstile token:', error);
      return { success: false, error: error.message };
    }
  }
};

// Auto-render Turnstile on elements with data-turnstile attribute
document.addEventListener('DOMContentLoaded', () => {
  const autoWidgets = document.querySelectorAll('[data-turnstile]');
  autoWidgets.forEach(widget => {
    const containerId = widget.id || `turnstile-${Math.random().toString(36).substr(2, 9)}`;
    if (!widget.id) widget.id = containerId;
    
    TurnstileManager.renderWidget(containerId, (token) => {
      // Store token in hidden input if form exists
      const form = widget.closest('form');
      if (form && token) {
        let input = form.querySelector('input[name="cf-turnstile-response"]');
        if (!input) {
          input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'cf-turnstile-response';
          form.appendChild(input);
        }
        input.value = token;
      }
    });
  });
});

// Expose globally
window.TurnstileManager = TurnstileManager;
