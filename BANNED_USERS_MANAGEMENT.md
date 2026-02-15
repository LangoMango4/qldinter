# 🚫 Banned Users Page - Management Guide

## Overview

The Banned Users page displays all currently banned users with full transparency, including ban reasons, durations, and appeal status. It also provides comprehensive information about the appeal process and timelines.

## Features

✅ **Current Banned Users List** - Display all active bans with details
📊 **Ban Types Explained** - Clear explanation of warnings, temporary, and permanent bans
⏰ **Appeal Timeline** - Complete timeline showing how long appeals take (3-7 days)
🔄 **Appeal Process Guide** - Step-by-step instructions for submitting appeals
📱 **Mobile Responsive** - Looks great on all devices

## How to Add a Banned User

### Step 1: Open banned-users.html

Navigate to the "Current Banned Users" section (around line 280).

### Step 2: Remove the "No Active Bans" Section

If you see this:
```html
<div class="no-bans">
  <div class="icon">✅</div>
  <h3 style="color: #28a745; margin-bottom: 10px;">No Active Bans</h3>
  <p style="color: #666;">There are currently no banned users...</p>
</div>
```

Delete it completely when you add your first ban.

### Step 3: Copy a Ban Template

Choose the appropriate template based on ban type:

#### Permanent Ban Template

```html
<div class="ban-item permanent">
  <div class="ban-header">
    <div class="ban-username">👤 USERNAME_HERE</div>
    <span class="ban-badge permanent">Permanent Ban</span>
  </div>
  <div class="ban-details">
    <strong>Reason:</strong> DETAILED_REASON_HERE
  </div>
  <div class="ban-meta">
    <div class="ban-meta-item">
      <span class="emoji">📅</span>
      <span>Banned: MONTH DAY, YEAR</span>
    </div>
    <div class="ban-meta-item">
      <span class="emoji">👮</span>
      <span>Banned By: MODERATOR_NAME</span>
    </div>
    <div class="ban-meta-item">
      <span class="emoji">📜</span>
      <span>Appeal Status: Denied / Under Review / No Appeal</span>
    </div>
  </div>
</div>
```

#### Temporary Ban Template

```html
<div class="ban-item temporary">
  <div class="ban-header">
    <div class="ban-username">👤 USERNAME_HERE</div>
    <span class="ban-badge temporary">Temporary Ban</span>
  </div>
  <div class="ban-details">
    <strong>Reason:</strong> DETAILED_REASON_HERE
  </div>
  <div class="ban-meta">
    <div class="ban-meta-item">
      <span class="emoji">📅</span>
      <span>Banned: MONTH DAY, YEAR</span>
    </div>
    <div class="ban-meta-item">
      <span class="emoji">⏰</span>
      <span>Duration: X days</span>
    </div>
    <div class="ban-meta-item">
      <span class="emoji">🔓</span>
      <span>Unban Date: MONTH DAY, YEAR</span>
    </div>
    <div class="ban-meta-item">
      <span class="emoji">👮</span>
      <span>Banned By: MODERATOR_NAME</span>
    </div>
  </div>
</div>
```

#### Under Review Template

```html
<div class="ban-item under-review">
  <div class="ban-header">
    <div class="ban-username">👤 USERNAME_HERE</div>
    <span class="ban-badge under-review">Under Review</span>
  </div>
  <div class="ban-details">
    <strong>Reason:</strong> DETAILED_REASON_HERE
  </div>
  <div class="ban-meta">
    <div class="ban-meta-item">
      <span class="emoji">📅</span>
      <span>Banned: MONTH DAY, YEAR</span>
    </div>
    <div class="ban-meta-item">
      <span class="emoji">⏰</span>
      <span>Duration: X days / Permanent</span>
    </div>
    <div class="ban-meta-item">
      <span class="emoji">📜</span>
      <span>Appeal: Under Review</span>
    </div>
    <div class="ban-meta-item">
      <span class="emoji">🔍</span>
      <span>Review Started: MONTH DAY, YEAR</span>
    </div>
  </div>
</div>
```

### Step 4: Replace Placeholders

Replace the following in your template:
- `USERNAME_HERE` - The banned user's Roblox username
- `DETAILED_REASON_HERE` - Clear explanation of why they were banned
- `MONTH DAY, YEAR` - Date in format like "Feb 15, 2026"
- `X days` - Number of days for temporary bans (e.g., "30 days")
- `MODERATOR_NAME` - Name/title of the moderator who issued the ban
- Appeal status options: "Denied", "Under Review", "No Appeal", "Approved"

### Step 5: Paste into banned-users.html

Find the comment `<!-- Example ban entries - Update these with actual bans -->` and paste your ban entry below it.

## Example with Real Data

```html
<div class="ban-item permanent">
  <div class="ban-header">
    <div class="ban-username">👤 BadUser123</div>
    <span class="ban-badge permanent">Permanent Ban</span>
  </div>
  <div class="ban-details">
    <strong>Reason:</strong> Repeatedly harassing other community members and using exploits after multiple warnings.
  </div>
  <div class="ban-meta">
    <div class="ban-meta-item">
      <span class="emoji">📅</span>
      <span>Banned: Feb 10, 2026</span>
    </div>
    <div class="ban-meta-item">
      <span class="emoji">👮</span>
      <span>Banned By: Senior Moderator</span>
    </div>
    <div class="ban-meta-item">
      <span class="emoji">📜</span>
      <span>Appeal Status: Denied</span>
    </div>
  </div>
</div>
```

## How to Remove a Ban

### When Temporary Ban Expires

1. Find the ban entry in `banned-users.html`
2. Delete the entire `<div class="ban-item temporary">...</div>` block
3. If no bans remain, add back the "No Active Bans" message (see Step 2 above)

### When Appeal is Approved

1. Delete the ban entry completely
2. Optionally, notify the user via Discord

### When Changing Ban Status

To change a ban to "Under Review":
1. Change `class="ban-item permanent"` or `temporary` to `class="ban-item under-review"`
2. Change the badge: `<span class="ban-badge under-review">Under Review</span>`
3. Add review details to ban-meta section

## Appeal Timeline Information

The page automatically shows users that appeals take **3-7 days**. This is broken down into:
- **Step 1:** Submit Appeal (Instant)
- **Step 2:** Initial Review (12-24 hours)
- **Step 3:** Investigation (1-3 days)
- **Step 4:** Senior Review (1-2 days)
- **Step 5:** Decision & Notification (Same day)

If you need to update these timelines, edit the "Appeal Timeline Section" in banned-users.html (around line 420).

## Ban Types Information

The page explains 4 ban types:
1. **⚠️ Warning** - First offense, no actual ban
2. **⏱️ Temporary Ban** - 7-90 days depending on severity
3. **🚫 Permanent Ban** - Indefinite removal
4. **🔍 Under Review** - Appeal being processed

To customize descriptions, edit the "Ban Types Information" section (around line 380).

## Best Practices

### Writing Ban Reasons

✅ **Good:** "Repeatedly harassing other players in chat after two warnings for inappropriate language."
❌ **Bad:** "Being toxic"

✅ **Good:** "Using exploit software to gain unfair advantages. Evidence: screenshot logs from Feb 10."
❌ **Bad:** "Hacking"

### Ban Reason Guidelines

- Be specific about what rule was violated
- Include date of incident if relevant
- Mention if it's a repeat offense
- Keep it professional and factual
- Don't include personal attacks

### Appeal Status Updates

Keep appeal statuses current:
- **No Appeal** - User hasn't appealed
- **Under Review** - Appeal is being investigated
- **Denied** - Appeal was rejected
- **Approved** - Appeal was accepted (remove ban entry)

### Privacy Considerations

- Don't include personal information (real names, locations, etc.)
- Use Roblox usernames only
- Keep evidence descriptions vague (e.g., "screenshot logs" not specific URLs)
- Don't include detailed internal discussions

## Troubleshooting

### Ban Entry Not Showing

- Check for missing closing tags `</div>`
- Make sure you pasted inside the `banned-list-section`
- Verify the class name is correct (`ban-item`)

### Styling Looks Wrong

- Make sure you didn't remove any required closing tags
- Check that the ban type class matches: `permanent`, `temporary`, or `under-review`
- Clear browser cache and refresh

### Multiple Bans Not Organizing Well

Bans are displayed in the order they appear in the HTML. Organize by:
- Severity (permanent first, then temporary)
- Date (newest first)
- Alphabetically by username

## Quick Reference

| Ban Type | Class | Badge Class | Color |
|----------|-------|-------------|-------|
| Permanent | `permanent` | `permanent` | Red |
| Temporary | `temporary` | `temporary` | Yellow |
| Under Review | `under-review` | `under-review` | Blue |

## Need Help?

If you need assistance managing the banned users page:
1. Check this guide thoroughly
2. Review the example ban entries in the HTML comments
3. Test changes locally before deploying
4. Join the Discord for technical support

---

**Remember:** Always keep the banned users list updated to maintain community trust and transparency!
