# 💬 Feedback & Bug Report System Setup Guide

## Overview

The Feedback & Bug Report system allows users to submit feedback and bug reports directly through your website. Submissions are automatically sent to a Discord channel via webhook for easy monitoring and response.

## Features

**User-Friendly Form** - Clean, responsive feedback form
**Bug Reports** - Dedicated bug reporting with severity levels
**Feature Requests** - Collect user suggestions and feedback
**Discord Integration** - All submissions sent directly to Discord
**Categorization** - Automatic color-coding based on type and severity

## Setup Instructions

### Step 1: Create a Discord Webhook

1. Open your Discord server
2. Go to the channel where you want to receive feedback submissions
3. Click the **⚙️ Settings** gear icon next to the channel name
4. Go to **Integrations** → **Webhooks**
5. Click **New Webhook** or **Create Webhook**
6. Give it a name like "QI Feedback System"
7. Optionally, customize the webhook avatar
8. Click **Copy Webhook URL**
9. Save this URL - you'll need it for Railway

### Step 2: Configure Railway Environment Variable

1. Go to your [Railway Dashboard](https://railway.app/)
2. Open your Queensland Interactive server project
3. Go to the **Variables** tab
4. Click **New Variable**
5. Add the following:
   - **Variable Name:** `DISCORD_WEBHOOK_URL`
   - **Value:** (paste the webhook URL you copied from Discord)
6. Click **Add**
7. Railway will automatically redeploy your server with the new variable

### Step 3: Test the System

1. Visit your website at `/feedback`
2. Select a feedback type (Bug Report or Feedback)
3. Fill out the form:
   - Enter your Roblox username
   - Add a title
   - Provide details
   - Select severity/priority
4. Click **Submit Feedback**
5. Check your Discord channel for the submission!

## How It Works

### Frontend (feedback.html)
- User-friendly form with type selector (Bug or Feedback)
- Form validation to ensure all required fields are filled
- Sends data to your Railway backend via POST request
- Shows success/error messages based on submission status

### Backend (server/server.js)
- Receives feedback submissions at `/api/feedback` endpoint
- Validates incoming data
- Formats as Discord embed with:
  - Color-coded by type and severity
  - Username, priority, and timestamp
  - Full description and title
- Sends to Discord webhook
- Returns success/error response to frontend
Bug Report title in red/orange/yellow (based on severity)
- Full description
- Username, Priority level, Submission timestamp

**Feedback:**
-g Reports:**
- 🐛 Bug Report title in red/orange/yellow (based on severity)
- Full description
- Username, Priority level, Submission timestamp

**Feedback:**
- 💡 Feedback title in blue
- Full description
- Username, Priority level, Submission timestamp

## Customization

### Change Colors

Edit the colors in [server/server.js](server/server.js) (around line 160):

```javascript
let color;
if (type === "bug") {
  color = severity === "high" ? 0xdc3545 : severity === "medium" ? 0xff9800 : 0xffc107;
} else {
  color = 0x1e90ff;
}
```

### Add Fields to Form

1. Edit [feedback.html](feedback.html) to add new form fields
2. Update the form submission JavaScript to include the new fields
3. Edit [server/server.js](server/server.js) to accept and process the new fields
4. Add to Discord embed fields array

### Change Webhook Channel

Simply create a new webhook in a different channel and update the `DISCORD_WEBHOOK_URL` environment variable in Railway.

## Troubleshooting

### "Webhook not configured" Error

**Problem:** The Discord webhook URL is not set in Railway.

**Solution:**
1. Verify you added the `DISCORD_WEBHOOK_URL` variable in Railway
2. Make sure the webhook URL is correct (starts with `https://discord.com/api/webhooks/`)
3. Redeploy your server after adding the variable

### Submissions Not Appearing in Discord

**Problem:** Form submits successfully but nothing shows in Discord.

**Solution:**
1. Test the webhook URL by pasting it in a browser - you should see an error page from Discord (means the webhook exists)
2. Check that the webhook hasn't been deleted from Discord
3. Verify the webhook channel still exists
4. Check Railway deployment logs for errors

### Form Doesn't Submit

**Problem:** Form shows error message when submitting.

**Solution:**
1. Open browser console (F12) to see detailed errors
2. Verify the Railway server URL is correct in [config.js](config.js)
3. Make sure the server is running on Railway
4. Check that CORS is properly configured in server.js

### Wrong Server URL

**Problem:** Feedback form can't connect to Railway server.

**Solution:**
1. Open [config.js](config.js)
2. Update `RAILWAY_SERVER_URL` with your actual Railway deployment URL
3. Make sure it doesn't have a trailing slash

## Security Considerations

**Rate Limiting:** Consider adding rate limiting to prevent spam
**Input Validation:** Server validates all incoming data
**Webhook Privacy:** Never commit webhook URLs to git - always use environment variables
**CORS:** Server has CORS enabled for your domain

## Testing Checklist

- [ ] Discord webhook is created
- [ ] Railway environment variable is set
- [ ] Feedback page loads correctly
- [ ] Can select Bug Report or Feedback type
- [ ] Form validation works (required fields)
- [ ] Bug report submissions appear in Discord
- [ ] Feedback submissions appear in Discord
- [ ] Different severity levels show different colors
- [ ] Mobile-responsive form works correctly

## Support

If you encounter issues:
1. Check Railway deployment logs
2. Test webhook URL directly
3. Verify environment variables are set
4. Check browser console for frontend errors

---

**Need Help?** Join our [Discord Server](https://discord.gg/kUf97PV9H3) for technical support.
