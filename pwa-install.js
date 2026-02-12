// PWA Install Prompt Handler
let deferredPrompt;
let installButton;

// Create install button
function createInstallButton() {
  const button = document.createElement('button');
  button.id = 'pwa-install-button';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    <span>Install App</span>
  `;
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #1e90ff 0%, #0066cc 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 50px;
    font-size: 16px;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(30, 144, 255, 0.4);
    display: none;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    z-index: 9999;
    animation: slideIn 0.5s ease;
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 20px rgba(30, 144, 255, 0.5)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 15px rgba(30, 144, 255, 0.4)';
  });
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @media (max-width: 768px) {
      #pwa-install-button {
        bottom: 10px;
        right: 10px;
        padding: 10px 20px;
        font-size: 14px;
      }
    }
  `;
  document.head.appendChild(style);
  
  return button;
}

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show install button
  if (!installButton) {
    installButton = createInstallButton();
    document.body.appendChild(installButton);
  }
  installButton.style.display = 'flex';
  
  // Add click handler
  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    // Hide the install button
    installButton.style.display = 'none';
    
    // Clear the deferredPrompt
    deferredPrompt = null;
  });
});

// Listen for app installed event
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  
  // Hide install button if visible
  if (installButton) {
    installButton.style.display = 'none';
  }
  
  // Clear the deferredPrompt
  deferredPrompt = null;
  
  // Show a success message
  showInstallSuccessMessage();
});

// Show success message after installation
function showInstallSuccessMessage() {
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
    z-index: 10000;
    animation: slideInTop 0.5s ease;
  `;
  message.textContent = '✓ App installed successfully!';
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInTop {
      from {
        transform: translateY(-100px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(message);
  
  // Remove message after 3 seconds
  setTimeout(() => {
    message.style.animation = 'slideInTop 0.5s ease reverse';
    setTimeout(() => message.remove(), 500);
  }, 3000);
}

// Check if app is already installed
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
  console.log('App is running in standalone mode');
  // App is installed and running in standalone mode
  // You can add special behavior here for installed app
}
