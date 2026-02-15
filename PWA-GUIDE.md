# ChatWave PWA Conversion Guide

This document explains how the ChatWave Next.js web application was converted into an installable Progressive Web App (PWA).

---

## What is a PWA?

A Progressive Web App is a web application that uses modern web technologies to deliver an app-like experience. Users can:

- **Install it** on their phone or desktop (home screen icon)
- **Use it fullscreen** without browser chrome
- **Get an offline fallback** when there's no internet
- **Receive push notifications** (with additional setup)

No app store submission required — users install directly from the browser.

---

## Prerequisites

- Node.js 18+
- Next.js 15 (App Router)
- An existing working web application

---

## Step-by-Step Conversion

### Step 1: Install `next-pwa`

```bash
npm install next-pwa
```

`next-pwa` is a Next.js plugin that automatically generates a service worker using Workbox. It handles caching, offline support, and service worker registration.

### Step 2: Update `next.config.mjs`

Wrap your existing Next.js config with the `withPWA` function:

```js
import withPWA from "next-pwa";

const pwaConfig = withPWA({
  dest: "public",           // Service worker output directory
  register: true,           // Auto-register the service worker
  skipWaiting: true,         // Activate new SW immediately
  disable: process.env.NODE_ENV === "development", // Disable in dev mode
  fallbacks: {
    document: "/offline",   // Show this page when offline
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = pwaConfig({
  // ... your existing config options
});

export default nextConfig;
```

**Key options explained:**
| Option | Purpose |
|--------|---------|
| `dest: "public"` | Places `sw.js` and `workbox-*.js` in the public folder |
| `register: true` | Automatically registers the service worker on page load |
| `skipWaiting: true` | New service worker takes over immediately (no refresh needed) |
| `disable: dev` | Prevents service worker caching issues during development |
| `fallbacks.document` | Route shown when user is offline and page isn't cached |

### Step 3: Create `public/manifest.json`

The web app manifest tells the browser how the app should behave when installed:

```json
{
  "name": "ChatWave - Real-time Messaging",
  "short_name": "ChatWave",
  "description": "A modern real-time messaging application",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#f43f5e",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Key fields:**
| Field | Purpose |
|-------|---------|
| `name` | Full app name (shown on install prompt and splash screen) |
| `short_name` | Displayed under the home screen icon |
| `display: "standalone"` | App opens fullscreen without browser UI |
| `theme_color` | Status bar color on mobile |
| `background_color` | Splash screen background color |
| `icons` | App icons in multiple sizes for different devices |
| `purpose: "maskable"` | Allows the OS to apply adaptive icon shapes |

### Step 4: Add PWA Meta Tags to `layout.tsx`

In the root layout, add manifest and viewport metadata using Next.js Metadata API:

```tsx
import type { Metadata, Viewport } from "next"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f43f5e",
}

export const metadata: Metadata = {
  title: "ChatWave - Real-time Messaging App",
  description: "A modern real-time messaging application",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChatWave",
  },
}
```

Also add the Apple touch icon in the `<head>`:

```tsx
<html lang="en">
  <head>
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
  </head>
  <body>{children}</body>
</html>
```

**Why separate `viewport` and `metadata` exports?**
Next.js 15 moved `viewport` and `themeColor` out of the `metadata` export into a dedicated `viewport` export. Mixing them causes build warnings.

### Step 5: Create an Offline Fallback Page

Create `app/offline/page.tsx` — shown when the user has no connection and the requested page isn't cached:

```tsx
"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-2">You're Offline</h1>
      <p className="mb-6">Please check your connection and try again.</p>
      <button onClick={() => window.location.reload()}>
        Try Again
      </button>
    </div>
  );
}
```

**Important:** This must be a client component (`"use client"`) because it uses an `onClick` handler. Server components cannot have event handlers.

### Step 6: Generate App Icons

PWA icons are required in multiple sizes for different platforms:

| Size | Used by |
|------|---------|
| 72x72 | Older Android devices |
| 96x96 | Android shortcut |
| 128x128 | Chrome Web Store |
| 144x144 | Windows tiles |
| 152x152 | iPad (non-retina) |
| 192x192 | Android home screen, Apple touch icon |
| 384x384 | Android splash screen |
| 512x512 | Android splash screen (high-res), install prompt |

Icons were generated using the app's brand gradient (rose-500 `#f43f5e` to indigo-600 `#4f46e5`) with a chat bubble design.

To regenerate icons:
```bash
node scripts/generate-icons.js    # Creates SVG source files
node scripts/convert-icons.js     # Converts SVGs to PNGs using sharp
```

### Step 7: Update `.gitignore`

The service worker files are auto-generated on each build. Add them to `.gitignore`:

```
# PWA files (auto-generated by next-pwa)
/public/sw.js
/public/workbox-*.js
/public/sw.js.map
/public/workbox-*.js.map
/public/swe-worker-*.js
```

---

## Project Structure (PWA-related files)

```
Chat-application-enhanced/
├── app/
│   ├── layout.tsx              # PWA meta tags and viewport config
│   └── offline/
│       └── page.tsx            # Offline fallback page
├── public/
│   ├── manifest.json           # Web app manifest
│   ├── icons/
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── sw.js                   # Auto-generated service worker
│   └── workbox-*.js            # Auto-generated workbox runtime
├── scripts/
│   ├── generate-icons.js       # SVG icon generator
│   └── convert-icons.js        # SVG to PNG converter (uses sharp)
├── next.config.mjs             # PWA plugin configuration
└── .gitignore                  # Excludes auto-generated SW files
```

---

## Testing the PWA

PWA features only work in **production builds** (service worker is disabled in dev mode).

### Local testing:

```bash
npm run build
npm start
```

Then open `http://localhost:3000` in Chrome.

### Verify installation:

1. **Chrome Desktop** — Look for the install icon (monitor with down arrow) in the address bar
2. **Chrome Android** — Tap the 3-dot menu and select "Add to Home Screen" or look for the install banner
3. **Safari iOS** — Tap the Share button and select "Add to Home Screen"

### Debug with Chrome DevTools:

1. Open DevTools (`F12`)
2. Go to **Application** tab
3. Check these sections:
   - **Manifest** — Verify all fields are loaded correctly
   - **Service Workers** — Should show `sw.js` as activated
   - **Cache Storage** — Shows cached assets managed by Workbox

### Test offline mode:

1. In DevTools > **Network** tab, check "Offline"
2. Refresh the page — you should see the offline fallback page
3. Uncheck "Offline" and click "Try Again" to reconnect

---

## How It Works

```
User visits site
       │
       ▼
Browser downloads sw.js (service worker)
       │
       ▼
Service worker installs and caches key assets
       │
       ▼
On future visits:
  ├── Online  → Serves from network, updates cache
  └── Offline → Serves from cache, or shows /offline page
```

The service worker acts as a proxy between the browser and network. It intercepts fetch requests and can serve cached responses when the network is unavailable.

---

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Install button not showing | Must be served over HTTPS (or localhost). Check manifest is valid at DevTools > Application > Manifest |
| Old content after deploy | `skipWaiting: true` handles this. Users may need one refresh after a new deployment |
| Service worker caching dev changes | PWA is disabled in dev mode (`disable: process.env.NODE_ENV === "development"`) |
| iOS not showing install prompt | iOS Safari doesn't show automatic prompts. Users must use Share > Add to Home Screen |
| Build warnings about viewport | Use separate `viewport` export instead of putting it inside `metadata` (Next.js 15+) |

---

## Next Steps (Optional Enhancements)

- **Push Notifications**: Use the Web Push API with a service like Firebase Cloud Messaging
- **Background Sync**: Queue messages when offline, send when connection returns
- **App Store Listing**: Wrap the PWA with Capacitor or PWA Builder to publish on Google Play / Microsoft Store
- **Custom Install Prompt**: Use the `beforeinstallprompt` event to show a custom in-app install button
