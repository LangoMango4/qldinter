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

