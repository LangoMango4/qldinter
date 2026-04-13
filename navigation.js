// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
      
      // Prevent body scroll when menu is open
      if (navMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
    
    // Close menu when clicking on a link
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      const isClickInsideNav = navMenu.contains(event.target);
      const isClickOnHamburger = hamburger.contains(event.target);
      
      if (!isClickInsideNav && !isClickOnHamburger && navMenu.classList.contains('active')) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // User Authentication Check
  checkUserAuthentication();

  // External Link Warning
  setupExternalLinkWarning();
});

// User Authentication Functions
async function checkUserAuthentication() {
  try {
    const apiBase = resolveApiBase();
    const response = await fetch(`${apiBase}/api/auth/me`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });

    if (response.ok) {
      const userData = await response.json();
      displayUserProfile(userData.user);
    } else {
      hideUserProfile();
    }
  } catch (error) {
    console.error('Failed to check authentication:', error);
    hideUserProfile();
  }
}

function resolveApiBase() {
  const configured = (window.SITE_CONFIG && (window.SITE_CONFIG.RAILWAY_SERVER_URL || window.SITE_CONFIG.robloxProxyBase)) || '';
  const cleanConfigured = String(configured || '').trim().replace(/\/$/, '');
  return cleanConfigured || window.location.origin;
}

function displayUserProfile(user) {
  const userProfile = document.getElementById('user-profile');
  const userAvatar = document.getElementById('user-avatar');
  const floatingProfile = ensureFloatingUserProfile();
  const floatingAvatar = floatingProfile.querySelector('img');

  if (!user || !floatingAvatar) {
    return;
  }

  // Set avatar URL - Discord avatars have specific format
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`;

  const configureAvatar = (avatar) => {
    if (!avatar) return;
    avatar.src = avatarUrl;
    avatar.alt = `${user.username}'s avatar`;
    avatar.title = `Logged in as ${user.username}`;
    avatar.style.cursor = 'pointer';
    avatar.onclick = function() {
      window.location.href = '/admin/';
    };
  };

  configureAvatar(userAvatar);
  configureAvatar(floatingAvatar);

  if (userProfile) {
    userProfile.style.display = 'flex';
  }

  floatingProfile.dataset.tooltip = `Signed in as ${user.username}. Click to open admin panel.`;
  floatingProfile.style.display = 'flex';
}

function hideUserProfile() {
  const userProfile = document.getElementById('user-profile');
  const floatingProfile = document.getElementById('user-profile-floating');

  if (userProfile) {
    userProfile.style.display = 'none';
  }
  if (floatingProfile) {
    floatingProfile.style.display = 'none';
  }
}

function ensureFloatingUserProfile() {
  let floatingProfile = document.getElementById('user-profile-floating');
  if (!floatingProfile) {
    floatingProfile = document.createElement('div');
    floatingProfile.id = 'user-profile-floating';
    floatingProfile.className = 'user-profile user-profile-floating';
    floatingProfile.style.display = 'none';

    const floatingAvatar = document.createElement('img');
    floatingAvatar.id = 'user-avatar-floating';
    floatingAvatar.className = 'user-avatar';
    floatingAvatar.alt = 'User Avatar';

    floatingProfile.appendChild(floatingAvatar);
    document.body.appendChild(floatingProfile);
  }
  return floatingProfile;
}

// External Link Warning System
function setupExternalLinkWarning() {
  // Inject modal HTML if not exists
  if (!document.getElementById('external-link-modal')) {
    const modalHTML = `
      <div id="external-link-modal" style="
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
          border-top: 4px solid #f59e0b;
        ">
          <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 1.4rem; font-family: 'Poppins', sans-serif; font-weight: 700;">External Website Warning</h2>
          <p style="color: #4b5563; margin: 0 0 18px 0; line-height: 1.6; font-size: 0.95rem;">
            You are about to leave Queensland Interactive. We are not responsible for external website content, accuracy, or quality.
          </p>
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 8px; margin-bottom: 18px; font-size: 0.9rem; color: #5d4400; line-height: 1.6;">
            <strong style="display: block; margin-bottom: 8px;">Disclaimer:</strong>
            <ul style="margin: 0; padding-left: 18px; list-style-type: none;">
              <li style="margin-bottom: 6px;">Not responsible for external website content or quality</li>
              <li style="margin-bottom: 6px;">Not liable for damages or data loss from external sites</li>
              <li style="margin-bottom: 6px;">Do not endorse external advertisements</li>
              <li style="margin-bottom: 6px;">Your data may be shared with third parties</li>
              <b style="display: block; margin-top: 10px;">Proceed at your own risk</b>
            </ul>
          </div>
          <p id="external-link-url" style="color: #1e90ff; word-break: break-all; font-size: 0.85rem; margin: 0 0 24px 0; padding: 12px; background: #e8f3ff; border-radius: 8px; font-family: monospace;"></p>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="external-link-cancel" style="
              padding: 11px 28px;
              border: 2px solid #d1d5db;
              background: white;
              color: #374151;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
              font-family: 'Poppins', sans-serif;
              transition: all 0.2s ease;
            " onmouseover="this.style.borderColor='#9ca3af'; this.style.background='#f9fafb'" onmouseout="this.style.borderColor='#d1d5db'; this.style.background='white'">
              Cancel
            </button>
            <button id="external-link-proceed" style="
              padding: 11px 28px;
              background: #f59e0b;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 700;
              font-family: 'Poppins', sans-serif;
              transition: all 0.2s ease;
            " onmouseover="this.style.background='#d97706'" onmouseout="this.style.background='#f59e0b'">
              <strong>Continue</strong>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add modal animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Handle all links on the page
  let pendingURL = null;

  document.addEventListener('click', function(event) {
    let target = event.target;
    
    // Traverse up to find anchor tag
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }

    if (!target || target.tagName !== 'A') return;

    const href = target.getAttribute('href');
    if (!href) return;

    // Check if link is external (not internal path)
    const isInternal = href.startsWith('/') || 
                       href.startsWith('#') || 
                       href.startsWith('mailto:') ||
                       href.startsWith('tel:') ||
                       href.includes(window.location.hostname);

    if (!isInternal && (target.target === '_blank' || href.includes('://'))) {
      event.preventDefault();
      event.stopPropagation();

      pendingURL = href;
      
      // Show modal
      const modal = document.getElementById('external-link-modal');
      const urlDisplay = document.getElementById('external-link-url');
      const cancelBtn = document.getElementById('external-link-cancel');
      const proceedBtn = document.getElementById('external-link-proceed');

      urlDisplay.textContent = href;
      modal.style.display = 'flex';

      // Cancel handler
      cancelBtn.onclick = function() {
        modal.style.display = 'none';
        pendingURL = null;
      };

      // Proceed handler
      proceedBtn.onclick = function() {
        modal.style.display = 'none';
        window.open(pendingURL, '_blank');
        pendingURL = null;
      };

      // Close on escape key
      const escapeHandler = function(e) {
        if (e.key === 'Escape') {
          modal.style.display = 'none';
          document.removeEventListener('keydown', escapeHandler);
          pendingURL = null;
        }
      };
      document.addEventListener('keydown', escapeHandler);

      // Close on backdrop click
      modal.onclick = function(e) {
        if (e.target === modal) {
          modal.style.display = 'none';
          pendingURL = null;
        }
      };
    }
  }, true);
}
