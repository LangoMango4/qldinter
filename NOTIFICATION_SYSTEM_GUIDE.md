# 🔔 Notification System Guide

## Overview

Queensland Interactive now has a smart notification system that shows important updates, announcements, and information to your users!

## Features

✨ **Smart Display** - Notifications only show once per user (tracked via localStorage)
🎨 **Beautiful Design** - Animated, responsive notifications that match your site theme
📱 **Mobile Friendly** - Optimized for all screen sizes
🎯 **Type-Specific Styling** - Different colors and icons for different notification types
⏰ **Auto-Dismiss** - Non-persistent notifications auto-close after 10 seconds
🔄 **Stackable** - Multiple notifications can appear with staggered timing
🛠️ **Admin Push Support** - Admins can publish notifications from `/admin/`, and clients will poll `/api/notifications`

## Notification Types

1. **Update** (🔔) - Blue - For feature updates and new releases
2. **Announcement** (📢) - Purple - For general announcements
3. **Warning** (⚠️) - Yellow/Orange - For important warnings
4. **Info** (ℹ️) - Blue - For general information

## How to Add Notifications

### Step 1: Edit notifications.js

Open [notifications.js](notifications.js) and find the `notifications` array in the constructor (around line 4).

### Step 2: Add Your Notification

Add a new notification object to the array (newest notifications first):

```javascript
this.notifications = [
  {
    id: 'unique-id-2026-02-13',           // Unique identifier (use date for uniqueness)
    title: 'New Feature!',                 // Notification title
    message: 'Check out our new features!', // Notification message
    type: 'update',                        // Type: 'update', 'announcement', 'warning', 'info'
    date: '2026-02-13',                    // Date in YYYY-MM-DD format
    persistent: false                      // true = shows until dismissed, false = auto-closes
  },
  // ... existing notifications below
];
```

### Step 3: Example Notifications

**Game Update Notification:**
```javascript
{
  id: 'game-v2-launch-2026-02-15',
  title: '🎮 Queensland Interactive V2.0 Released!',
  message: 'Experience our completely redesigned Roblox game with new features, vehicles, and gameplay improvements. Join now!',
  type: 'update',
  date: '2026-02-15',
  persistent: false
}
```

**Discord Event Notification:**
```javascript
{
  id: 'discord-event-2026-03-01',
  title: '📅 Community Event This Weekend',
  message: 'Join us for a special community event on Discord this Saturday at 2 PM EST. Prizes and giveaways!',
  type: 'announcement',
  date: '2026-03-01',
  persistent: false
}
```

**Important Notice:**
```javascript
{
  id: 'maintenance-warning-2026-02-20',
  title: '⚠️ Scheduled Maintenance',
  message: 'Our servers will be down for maintenance on Feb 20 from 10 PM - 2 AM EST. Please plan accordingly.',
  type: 'warning',
  date: '2026-02-20',
  persistent: true  // Shows until user dismisses
}
```

**General Information:**
```javascript
{
  id: 'new-tos-2026-02-12',
  title: 'ℹ️ Terms of Service Updated',
  message: 'We have updated our Terms of Service. Please review the changes on our TOS page.',
  type: 'info',
  date: '2026-02-12',
  persistent: false
}
```

## Notification Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ Yes | Unique identifier (prevents duplicate notifications) |
| `title` | string | ✅ Yes | Notification headline |
| `message` | string | ✅ Yes | Notification body text |
| `type` | string | ✅ Yes | Style type: 'update', 'announcement', 'warning', or 'info' |
| `date` | string | ✅ Yes | Date in YYYY-MM-DD format |
| `persistent` | boolean | ✅ Yes | true = stays until dismissed, false = auto-closes after 10s |

## Advanced Usage

### Add Notification Programmatically

You can add notifications dynamically with JavaScript:

```javascript
// Add this to any page after notifications.js is loaded
notificationSystem.addNotification({
  id: 'dynamic-' + Date.now(),
  title: 'Welcome Back!',
  message: 'Thanks for returning to Queensland Interactive!',
  type: 'info',
  date: new Date().toISOString().split('T')[0],
  persistent: false
});
```

### Clear Notification History

To reset all seen notifications (for testing):

```javascript
// Run this in browser console
notificationSystem.clearHistory();
// Then refresh the page
```

### Check What User Has Seen

```javascript
// View which notifications a user has already dismissed
console.log(notificationSystem.getSeenNotifications());
```

## Testing Your Notifications

1. **Add a test notification** to notifications.js
2. **Clear your browser's localStorage** to see it again:
   - Open DevTools (F12)
   - Go to Application > Local Storage
   - Delete `qldinter_notifications_seen`
3. **Refresh the page** - your notification should appear!

## Best Practices

### DO ✅
- Use clear, concise titles (3-7 words)
- Keep messages brief but informative (1-2 sentences)
- Use appropriate notification types for context
- Include relevant emojis in titles for visual interest
- Use unique, descriptive IDs
- Set persistent=true only for critical information

### DON'T ❌
- Create too many notifications at once (2-3 max active)
- Use persistent notifications for minor updates
- Write overly long messages (keep under 200 characters)
- Reuse notification IDs
- Forget to update the date field

## Styling Customization

Notification styles can be customized in [notifications.js](notifications.js) starting at line 125 (the `injectStyles()` method).

### Color Themes:
```css
.qld-notification-update { border-left: 4px solid #1e90ff; }      /* Blue */
.qld-notification-announcement { border-left: 4px solid #9b59b6; } /* Purple */
.qld-notification-warning { border-left: 4px solid #f39c12; }     /* Orange */
.qld-notification-info { border-left: 4px solid #3498db; }        /* Light Blue */
```

## Troubleshooting

**Notification not appearing?**
- Check browser console for JavaScript errors
- Verify the notification ID is unique
- Clear localStorage and refresh
- Ensure notifications.js is loaded on the page

**Notification appearing every time?**
- Check that the ID hasn't changed
- Verify localStorage is enabled in the browser
- Check if user is in incognito/private mode (localStorage may not persist)

**Styling issues on mobile?**
- Mobile styles are at line 170+ in injectStyles()
- Test on actual mobile devices, not just DevTools responsive mode

## File Locations

- **Main Script**: [notifications.js](notifications.js)
- **Included on**: All main pages (index.html, faq, ourteam, tos.html)
- **Service Worker**: Cached for offline access

## Examples for Common Scenarios

### Major Update
```javascript
{
  id: 'major-update-v3',
  title: '🎉 Major Update v3.0 Live!',
  message: 'Huge changes are here! New map, vehicles, and departments. Check out what\'s new in-game now!',
  type: 'update',
  date: '2026-03-01',
  persistent: false
}
```

### Recruitment Drive
```javascript
{
  id: 'recruitment-march-2026',
  title: '👮 Join Our Team',
  message: 'Applications are now open for Police, Fire, and Medical departments. Apply today on our Discord!',
  type: 'announcement',
  date: '2026-03-05',
  persistent: false
}
```

### Server Issue
```javascript
{
  id: 'server-issue-2026-03-10',
  title: '⚠️ Known Issue',
  message: 'We are aware of login issues and are working on a fix. Check our Discord for updates.',
  type: 'warning',
  date: '2026-03-10',
  persistent: true
}
```

---

**Need Help?** Join our [Discord](https://discord.gg/kUf97PV9H3) for support!
