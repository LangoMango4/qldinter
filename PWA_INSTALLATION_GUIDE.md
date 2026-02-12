# 📱 Install Queensland Interactive as a Mobile App

Your website is now a **Progressive Web App (PWA)** that can be installed on phones and tablets!

## ✨ Features Added

- **📲 Installable**: Users can download and install your site as an app on their home screen
- **🚀 Fast Loading**: Service worker caches resources for faster loading
- **📴 Offline Support**: Basic offline functionality when internet is unavailable
- **📱 Native Feel**: Runs in standalone mode without browser UI
- **🔔 Install Prompt**: Automatic install button appears for eligible users

## 📲 How to Install on Different Devices

### iPhone/iPad (iOS)
1. Open Safari browser (must use Safari, not Chrome)
2. Navigate to your website
3. Tap the **Share** button (square with arrow)
4. Scroll down and tap **"Add to Home Screen"**
5. Tap **"Add"** in the top right
6. The app icon will appear on your home screen!

### Android Phones/Tablets
1. Open Chrome browser
2. Navigate to your website
3. Look for the **"Install App"** button at the bottom right
   - OR tap the menu (three dots) and select **"Install app"** or **"Add to Home screen"**
4. Tap **"Install"**
5. The app will be added to your app drawer and home screen!

### Desktop (Chrome, Edge, etc.)
1. Visit your website in Chrome or Edge
2. Look for the install icon in the address bar (+ or computer icon)
   - OR click the **"Install App"** button
3. Click it and confirm the installation
4. The app will open in its own window

## 🎨 What Was Created

### Files Added/Modified:

1. **`manifest.json`** - Updated with full PWA configuration
   - App name, description, icons
   - Theme colors and display mode
   - Shortcuts to Enrol and FAQ pages

2. **`service-worker.js`** - NEW
   - Caches website resources
   - Enables offline functionality
   - Handles resource updates

3. **`pwa-install.js`** - NEW
   - Creates install button
   - Handles install prompts
   - Shows success messages

4. **All HTML pages** - Updated
   - Added manifest link
   - Added PWA meta tags
   - Registered service worker

## 🔧 Technical Details

### Service Worker Caching
The service worker caches these resources:
- Homepage and all pages
- CSS and JavaScript files
- Images and icons
- Enrol, FAQ, Our Team pages

### Manifest Configuration
- **Name**: Queensland Interactive
- **Short Name**: QLDInter
- **Theme Color**: #1e90ff (blue)
- **Display**: Standalone mode
- **Icons**: Using mainico.png

### Install Button
The install button automatically appears when:
- User is on a compatible browser
- App is not already installed
- Browser supports PWA installation
- HTTPS is enabled (required for PWA)

## ⚠️ Important Requirements

### For PWA to Work:
1. **HTTPS Required**: Your site MUST be served over HTTPS
   - Local development works on localhost
   - Production needs SSL certificate
2. **Service Worker**: Must be registered (already done)
3. **Valid Manifest**: Must have proper icons and config (already done)

### Testing Locally:
```bash
# If testing locally, you can use a simple server:
npx http-server -p 8080

# Then visit: http://localhost:8080
```

## 📱 User Experience

When installed, users get:
- App icon on their home screen
- Full-screen experience (no browser UI)
- Faster loading times
- Splash screen on launch
- Works offline (cached pages)
- Shortcut to Enrol and FAQ from app icon (long press)

## 🐛 Troubleshooting

### Install button not showing?
- Make sure you're using HTTPS
- Clear browser cache and reload
- Check browser console for errors
- Ensure service worker registered successfully

### App not working offline?
- Visit pages while online first (to cache them)
- Check service worker is active (DevTools > Application > Service Workers)
- Clear site data and reinstall if needed

### Icons not displaying?
- Ensure `mainico.png` exists and is accessible
- Check browser console for 404 errors
- May need different icon sizes (192x192, 512x512)

## 🎯 Next Steps (Optional Enhancements)

To further improve the PWA experience:

1. **Add More Icon Sizes**
   - Create 192x192 and 512x512 versions of your icon
   - Update manifest.json with new icon paths

2. **Add Screenshots**
   - Add app screenshots to manifest for better install prompt
   
3. **Offline Page**
   - Create a custom offline fallback page
   
4. **Push Notifications** (if needed)
   - Add notification support via service worker
   
5. **Update Strategy**
   - Implement version checking and update prompts

## 📊 Testing the PWA

### Chrome DevTools:
1. Open DevTools (F12)
2. Go to **Application** tab
3. Check **Manifest** section
4. Check **Service Workers** section
5. Use **Lighthouse** to test PWA score

### PWA Checklist:
- ✅ Manifest with required fields
- ✅ Service worker registered
- ✅ HTTPS enabled (in production)
- ✅ Icons configured
- ✅ Offline functionality
- ✅ Install prompt ready

Your website is now a fully functional Progressive Web App! 🎉
