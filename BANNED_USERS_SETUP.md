# 🚫 Banned Users Page - Trello Integration Guide

## Overview

The Banned Users page displays a public list of all currently banned users from Queensland Interactive, integrated with a Trello board for transparency and easy management.

## Features

✅ **Trello Board Integration** - Embed your Trello board directly on the website
🎨 **Professional Design** - Clean, responsive layout that matches your site theme
📱 **Mobile Optimized** - Works perfectly on all devices
⚖️ **Transparency** - Shows community that moderation is fair and documented
🔄 **Appeal Process** - Clear instructions for users to appeal their bans
📊 **Info Cards** - Explains your moderation philosophy

## Setup Instructions

### Step 1: Create Your Trello Board

1. Go to [Trello.com](https://trello.com) and sign in
2. Create a new board called "Queensland Interactive - Banned Users"
3. Create lists for different ban categories:
   - **Permanent Bans**
   - **Temporary Bans**
   - **Under Review**
   - **Appeals**

### Step 2: Create Ban Cards

For each banned user, create a card with:

**Card Title Format:**
```
[Username] - [Ban Type]
```
Example: `johndoe123 - Permanent Ban`

**Card Description Template:**
```
👤 Username: johndoe123
📅 Ban Date: February 12, 2026
⏱️ Duration: Permanent / 30 days / etc.
📋 Reason: [Detailed reason]
🔍 Evidence: [Links to screenshots, chat logs, etc.]
👤 Banned By: [Staff member name]

Additional Notes:
[Any additional context or information]
```

### Step 3: Make Your Board Public

1. Open your Trello board
2. Click **"Share"** in the top right corner
3. Click **"Change permissions"**
4. Select **"Public"** - Anyone on the internet can see this board
5. Save the changes

### Step 4: Get Your Board ID

Your Trello board URL looks like this:
```
https://trello.com/b/YOUR_BOARD_ID/board-name
```

The **Board ID** is the part between `/b/` and the board name.

**Example:**
- URL: `https://trello.com/b/AbCd1234/qld-banned-users`
- Board ID: `AbCd1234`

### Step 5: Update Your Website

1. Open [banned-users.html](banned-users.html)
2. Find this line (around line 284):
   ```javascript
   const TRELLO_BOARD_ID = 'YOUR_BOARD_ID_HERE';
   ```
3. Replace `'YOUR_BOARD_ID_HERE'` with your actual board ID:
   ```javascript
   const TRELLO_BOARD_ID = 'AbCd1234';
   ```
4. Save the file

### Step 6: Test It

1. Open your website
2. Navigate to the Banned Users page
3. Your Trello board should now be embedded!

## Trello Board Organization Tips

### Recommended Lists

1. **🔴 Permanent Bans**
   - Users banned for severe violations
   - No unban date

2. **🟡 Temporary Bans**
   - Sort by unban date (soonest first)
   - Include expiration date in description

3. **🟢 Unbanned / Appeals Approved**
   - Keep for records
   - Archive after 30 days

4. **⚪ Under Review**
   - Pending investigations
   - Appeals being processed

### Card Labels (Trello Feature)

Create colored labels for quick identification:
- 🔴 Red: Hacking/Exploiting
- 🟠 Orange: Harassment/Toxicity
- 🟡 Yellow: Rule Violations
- 🟢 Green: Appeal Approved
- 🔵 Blue: Under Investigation
- 🟣 Purple: Multiple Offenses

### Card Checklist Template

Add a checklist to each ban card:
```
□ Evidence collected
□ User notified
□ Discord ban applied
□ Roblox game ban applied
□ Added to Trello
□ Staff team notified
```

## Privacy & Legal Considerations

### ⚠️ Important Legal Notes

1. **Usernames Only**: Only display Roblox usernames, never:
   - Real names
   - Email addresses
   - IP addresses
   - Personal information

2. **Factual Information**: Only state facts:
   - ✅ "Banned for using exploits on Feb 12, 2026"
   - ❌ "This person is a horrible cheater and liar"

3. **Evidence**: Keep evidence private unless:
   - User gives permission to share
   - It's already publicly available
   - Required by law

4. **Age Consideration**: Remember users may be minors
   - Don't share identifying information
   - Be professional in descriptions

## Alternative: Link Only (No Embed)

If you prefer to link to Trello instead of embedding:

1. Keep the board public
2. Users click "Open Trello Board" button
3. No need to embed iframe
4. Simpler setup, same transparency

To use link-only mode, in [banned-users.html](banned-users.html):
```javascript
// Just set the board ID, the link will work automatically
const TRELLO_BOARD_ID = 'AbCd1234';

// Remove or comment out the iframe section if you don't want embedding
```

## Troubleshooting

### Board Not Displaying?

**Problem**: Trello board shows "Access Denied"
**Solution**: Make sure board is set to Public, not Private or Team-only

**Problem**: Board ID not working
**Solution**: Double-check you copied the correct part of the URL

**Problem**: Board looks weird when embedded
**Solution**: Use Trello's built-in card templates to keep formatting consistent

### Mobile Display Issues?

The page is fully responsive, but if you have issues:
- Large number of cards may cause scrolling issues
- Consider archiving old bans to keep board manageable
- Use Trello's filtering features

## Maintaining Your Ban List

### Regular Tasks

**Weekly:**
- Review temporary bans and unban expired ones
- Move unbanned users to "Unbanned" list
- Archive old unbanned cards

**Monthly:**
- Clean up and organize cards
- Update ban reasons if new info available
- Review appeals

### Staff Access

Grant your moderation team access to the Trello board:
1. Click "Share" on the board
2. Invite staff members by email
3. Set their role to "Normal" or "Admin"
4. They can now add/edit ban cards

## Best Practices

### ✅ DO:

- Keep ban reasons clear and specific
- Update cards when appeals are made
- Document evidence thoroughly
- Be consistent with formatting
- Respond to questions professionally
- Archive old bans to keep list clean

### ❌ DON'T:

- Share personal/private information
- Use inflammatory language
- Ban without documentation
- Let the board get cluttered
- Ignore valid appeals
- Delete evidence

## Example Ban Card

```
Title: xXExampleUserXx - Permanent Ban

Description:
👤 Username: xXExampleUserXx
📅 Ban Date: February 12, 2026
⏱️ Duration: Permanent
📋 Reason: Using exploits/hacks to gain unfair advantage

Details:
User was caught using fly hacks and speed exploits during 
gameplay session on Feb 12. Multiple players reported the 
behavior. Staff member confirmed exploitation through 
server logs.

Evidence: [Screenshot links]
Banned By: ModeratorName
Appeal Status: Denied (Feb 15, 2026)
```

## Benefits of This System

1. **Transparency**: Community sees you take rules seriously
2. **Deterrent**: Users see consequences of rule violations  
3. **Accountability**: Staff bans are documented and reviewable
4. **Appeals**: Clear process for users to challenge unfair bans
5. **Records**: Historical data for pattern recognition
6. **Trust**: Builds community trust through openness

## Support

Need help setting this up?
- Join our [Discord](https://discord.gg/kUf97PV9H3)
- Check Trello's [Help Center](https://support.atlassian.com/trello/)
- Review this guide again

---

**Security Note**: Never share your Trello account credentials. Board should be public for viewing only, with staff having edit access through team membership.
