# Cloudflare Turnstile Setup Guide

Cloudflare Turnstile is now integrated into your Queensland Interactive website as a CAPTCHA alternative for bot protection.

## 🔑 Getting Your Site Key

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com/
   - Select your account

2. **Navigate to Turnstile**
   - Go to "Turnstile" in the sidebar
   - Or visit: https://dash.cloudflare.com/?to=/:account/turnstile

3. **Create a Widget**
   - Click "Add Widget" or "Add Site"
   - Enter your domain: `queenslandinteractive-rblx.com`
   - Choose widget mode: **Managed** (recommended)
   - Copy your **Site Key**

4. **Update config.js**
   - Open `/config.js`
   - Replace the placeholder site key on line 18:
   ```javascript
   turnstileSiteKey: "YOUR_ACTUAL_SITE_KEY_HERE",
   ```
   - Save and push to GitHub

## 📝 How to Use Turnstile

### Automatic Usage (Recommended)
Add the `data-turnstile` attribute to any div where you want the widget:

```html
<div id="my-turnstile" data-turnstile></div>
```

The widget will automatically render and handle verification.

### Manual Usage
Use the JavaScript API:

```javascript
TurnstileManager.renderWidget('container-id', (token) => {
  if (token) {
    console.log('Verification successful!', token);
    // Proceed with form submission or action
  } else {
    console.log('Verification failed');
  }
});
```

### In Forms
```html
<form id="contact-form">
  <input type="text" name="name" placeholder="Your Name" required>
  <input type="email" name="email" placeholder="Your Email" required>
  
  <!-- Turnstile widget -->
  <div id="turnstile-widget" data-turnstile></div>
  
  <button type="submit">Submit</button>
</form>

<script>
document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const token = document.querySelector('input[name="cf-turnstile-response"]')?.value;
  
  if (!token) {
    alert('Please complete the verification');
    return;
  }
  
  // Submit form with token
  const formData = new FormData(e.target);
  // ... handle form submission
});
</script>
```

## 🎨 Customization

Edit `turnstile.js` to customize:

- **Theme**: Change `theme: 'dark'` to `theme: 'light'`
- **Size**: Change `size: 'normal'` to `size: 'compact'`

## 🔒 Backend Verification (Important!)

**Never trust client-side verification alone!** Always verify tokens on your backend.

### Add to your Express server (`server/server.js`):

```javascript
app.post('/api/verify-turnstile', async (req, res) => {
  const { token } = req.body;
  const SECRET_KEY = process.env.TURNSTILE_SECRET_KEY; // Store in Railway env vars
  
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: SECRET_KEY,
        response: token
      })
    });
    
    const data = await response.json();
    res.json({ success: data.success });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Set Environment Variable in Railway:
1. Go to your Railway project
2. Click on your service
3. Go to "Variables" tab
4. Add: `TURNSTILE_SECRET_KEY` = `your_secret_key_from_cloudflare`

## 🧪 Testing

Cloudflare provides test keys:

**Visible (always passes):**
- Site key: `1x00000000000000000000AA`
- Secret key: `1x0000000000000000000000000000000AA`

**Invisible (always passes):**
- Site key: `2x00000000000000000000AB`
- Secret key: `2x0000000000000000000000000000000AB`

**Always fails:**
- Site key: `3x00000000000000000000FF`
- Secret key: `3x0000000000000000000000000000000FF`

## ⚙️ Disabling Turnstile

To disable Turnstile without removing the code:

In `config.js`, set:
```javascript
turnstileSiteKey: "",
```

The widget won't render when the site key is empty.

## 📚 Documentation

Full Cloudflare Turnstile docs: https://developers.cloudflare.com/turnstile/
