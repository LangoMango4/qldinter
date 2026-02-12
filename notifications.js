// Notification System for Updates and Announcements
class NotificationSystem {
  constructor() {
    this.storageKey = 'qldinter_notifications_seen';
    this.notifications = [
      // Add notifications here - newest first
      {
        id: 'pwa-update-2026-02-12',
        title: '📱 Website Now Installable!',
        message: 'Queensland Interactive is now a Progressive Web App! Install it on your phone or computer for a native app experience. Look for the install button!',
        type: 'update',
        date: '2026-02-12',
        persistent: false
      }
      // Add more notifications here as needed
      // {
      //   id: 'update-2026-02-12',
      //   title: 'Website Update',
      //   message: 'Check out our new features!',
      //   type: 'announcement',
      //   date: '2026-02-12',
      //   persistent: false
      // }
    ];
  }

  // Check which notifications have been seen
  getSeenNotifications() {
    const seen = localStorage.getItem(this.storageKey);
    return seen ? JSON.parse(seen) : [];
  }

  // Mark notification as seen
  markAsSeen(notificationId) {
    const seen = this.getSeenNotifications();
    if (!seen.includes(notificationId)) {
      seen.push(notificationId);
      localStorage.setItem(this.storageKey, JSON.stringify(seen));
    }
  }

  // Get unseen notifications
  getUnseenNotifications() {
    const seen = this.getSeenNotifications();
    return this.notifications.filter(n => !seen.includes(n.id));
  }

  // Show notification
  showNotification(notification) {
    const notifEl = document.createElement('div');
    notifEl.className = `qld-notification qld-notification-${notification.type}`;
    notifEl.innerHTML = `
      <div class="qld-notification-content">
        <div class="qld-notification-header">
          <div class="qld-notification-icon">${this.getIcon(notification.type)}</div>
          <h3 class="qld-notification-title">${notification.title}</h3>
          <button class="qld-notification-close" aria-label="Close">&times;</button>
        </div>
        <p class="qld-notification-message">${notification.message}</p>
        <div class="qld-notification-date">${this.formatDate(notification.date)}</div>
      </div>
    `;

    // Add styles
    this.injectStyles();

    // Add to page
    document.body.appendChild(notifEl);

    // Animate in
    setTimeout(() => notifEl.classList.add('qld-notification-show'), 10);

    // Close button handler
    const closeBtn = notifEl.querySelector('.qld-notification-close');
    closeBtn.addEventListener('click', () => {
      this.closeNotification(notifEl, notification.id);
    });

    // Auto-close after 10 seconds for non-persistent notifications
    if (!notification.persistent) {
      setTimeout(() => {
        if (document.body.contains(notifEl)) {
          this.closeNotification(notifEl, notification.id);
        }
      }, 10000);
    }
  }

  // Close notification with animation
  closeNotification(element, notificationId) {
    element.classList.remove('qld-notification-show');
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 300);
    this.markAsSeen(notificationId);
  }

  // Get icon for notification type
  getIcon(type) {
    const icons = {
      update: '🔔',
      announcement: '📢',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  }

  // Format date
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  // Inject CSS styles
  injectStyles() {
    if (document.getElementById('qld-notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'qld-notification-styles';
    style.textContent = `
      .qld-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        width: calc(100% - 40px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        transform: translateX(450px);
        transition: transform 0.3s ease, opacity 0.3s ease;
        opacity: 0;
        font-family: 'Poppins', sans-serif;
      }

      .qld-notification-show {
        transform: translateX(0);
        opacity: 1;
      }

      .qld-notification-content {
        padding: 20px;
      }

      .qld-notification-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .qld-notification-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      .qld-notification-title {
        flex: 1;
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
      }

      .qld-notification-close {
        background: none;
        border: none;
        font-size: 28px;
        color: #999;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .qld-notification-close:hover {
        background: #f0f0f0;
        color: #333;
      }

      .qld-notification-message {
        margin: 0 0 12px;
        color: #666;
        line-height: 1.6;
        font-size: 0.95rem;
      }

      .qld-notification-date {
        font-size: 0.85rem;
        color: #999;
        font-weight: 500;
      }

      .qld-notification-update {
        border-left: 4px solid #1e90ff;
      }

      .qld-notification-announcement {
        border-left: 4px solid #9b59b6;
      }

      .qld-notification-warning {
        border-left: 4px solid #f39c12;
      }

      .qld-notification-info {
        border-left: 4px solid #3498db;
      }

      @media (max-width: 768px) {
        .qld-notification {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
          width: calc(100% - 20px);
        }

        .qld-notification-content {
          padding: 16px;
        }

        .qld-notification-title {
          font-size: 1rem;
        }

        .qld-notification-message {
          font-size: 0.9rem;
        }
      }

      /* Stack multiple notifications */
      .qld-notification:nth-child(n+2) {
        margin-top: 10px;
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize and show unseen notifications
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.showUnseen());
    } else {
      this.showUnseen();
    }
  }

  // Show all unseen notifications
  showUnseen() {
    const unseen = this.getUnseenNotifications();
    unseen.forEach((notification, index) => {
      setTimeout(() => {
        this.showNotification(notification);
      }, index * 500); // Stagger notifications
    });
  }

  // Add a new notification programmatically
  addNotification(notification) {
    this.notifications.unshift(notification);
    if (!this.getSeenNotifications().includes(notification.id)) {
      this.showNotification(notification);
    }
  }

  // Clear all seen notifications from storage
  clearHistory() {
    localStorage.removeItem(this.storageKey);
  }
}

// Initialize notification system
const notificationSystem = new NotificationSystem();
notificationSystem.init();

// Example: Add a notification programmatically (uncomment to use)
// notificationSystem.addNotification({
//   id: 'welcome-2026',
//   title: 'Welcome!',
//   message: 'Thanks for visiting Queensland Interactive. Check out our community on Discord!',
//   type: 'info',
//   date: new Date().toISOString().split('T')[0],
//   persistent: false
// });
