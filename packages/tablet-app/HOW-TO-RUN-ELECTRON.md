# How to Run the Electron App

## ✅ Prerequisites (Already Complete!)

- [x] MongoDB running (Docker)
- [x] Environment configured (`.env` file)
- [x] Dependencies installed
- [x] Electron compiled

## 🚀 Three Ways to Run

### Method 1: Double-Click Startup Script (Easiest)

**Windows:**
```
Double-click: start-electron.bat
```

This will:
1. Compile Electron TypeScript
2. Start the app
3. Open desktop window

### Method 2: Command Line (Recommended)

```bash
cd packages/tablet-app
npm run electron:dev
```

### Method 3: Manual Steps

```bash
# Step 1: Compile Electron
cd packages/tablet-app
npm run electron:compile

# Step 2: Run Electron
npx electron .
```

## What Happens When You Run

1. **Electron Starts**
   - Compiles `electron/main.ts` → `electron/dist/main.js`
   - Launches Electron desktop app

2. **Next.js Spawns**
   - Electron automatically runs `npm run dev`
   - Next.js dev server starts on port 3001
   - Takes ~10-15 seconds to be ready

3. **Window Opens**
   - Desktop window appears (1024x768)
   - Shows loading while waiting for Next.js
   - DevTools open automatically (right side)
   - App loads when Next.js is ready

4. **You See**
   - Autoclave Monitor home page
   - Web console in DevTools
   - Hot reload works for React changes

## Visual Guide

```
┌─────────────────────────────────────────────────────┐
│  Autoclave Monitor                          ─ □ ×  │
├─────────────────────────────────────────────────────┤
│                                             │       │
│  ┌──────────────────────────┐              │ Dev   │
│  │                          │              │ Tools │
│  │   Your App Here          │              │       │
│  │   (Next.js running)      │              │ ▼     │
│  │                          │              │ Con-  │
│  │   Port 3001              │              │ sole  │
│  │                          │              │       │
│  └──────────────────────────┘              │ Logs  │
│                                             │ here  │
│                                             │       │
└─────────────────────────────────────────────────────┘
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F5` | Reload page |
| `Ctrl+R` | Reload page |
| `F12` | Toggle DevTools |
| `Ctrl+Shift+I` | Toggle DevTools |
| `Ctrl+Q` | Quit app |

## Console Output Explained

When you run `npm run electron:dev`, you'll see:

```
> @orca/tablet-app@1.0.0 electron:compile
> tsc -p electron/tsconfig.json

> @orca/tablet-app@1.0.0 electron:dev
> npm run electron:compile && electron .

Starting Next.js dev server...              ← Electron starting
Waiting for Next.js server on http://localhost:3001...
  ▲ Next.js 15.5.7                          ← Next.js starting
  - Local:        http://localhost:3001
  ✓ Starting...                             ← Compiling
  ✓ Ready in 2.3s                           ← Server ready!
Next.js server is ready!                    ← Window opens
```

## Troubleshooting

### Issue: "Port 3001 already in use"

**Solution 1: Kill existing process**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

**Solution 2: Change port**
Edit `.env`:
```
PORT=3002
```

### Issue: Blank window appears

**Check:**
1. Is MongoDB running?
   ```bash
   docker ps | grep mongo
   ```
2. Is Next.js server ready?
   - Look for "Ready in X.Xs" in console
3. Check Electron console for errors

### Issue: Changes not showing

**For React/Next.js changes:**
- Just save the file - hot reload works automatically

**For Electron changes (main.ts, preload.ts):**
- Close Electron window
- Run `npm run electron:dev` again

### Issue: "Cannot find module"

**Solution:**
```bash
cd packages/tablet-app
npm install
```

## Enabling Kiosk Mode (Fullscreen)

Edit [electron/main.ts](c:\dev\orca\packages\tablet-app\electron\main.ts:56):

```typescript
mainWindow = new BrowserWindow({
  width: 1024,
  height: 768,
  fullscreen: true, // ← Uncomment this line
  // ...
});
```

Then restart Electron.

## Testing with Your Autoclaves

Once the app is running:

1. **Open Settings** (when UI is built)
2. **Your autoclaves should already be configured:**
   - StatClave 1: 192.168.0.15
   - StatClave 2: 192.168.0.23
3. **Click "Test Connection"** on each
4. **Import cycles** when autoclaves are ready
5. **Print labels** with Zebra printer

## Building Production Installer

When ready to deploy:

```bash
cd packages/tablet-app
npm run electron:build
```

Creates: `dist/Autoclave Monitor-1.0.0.exe`

## Next Steps

1. ✅ Run Electron: `npm run electron:dev`
2. ✅ Build Home Dashboard UI (Phase 2)
3. ✅ Test with actual autoclaves (StatClave 2 at 192.168.0.23 connected!)
4. ⏳ Build Import Cycles page to display and select cycles
5. ⏳ Test thermal printer with label printing
6. ⏳ Deploy to tablet

## Quick Reference

```bash
# Start Electron (dev mode)
npm run electron:dev

# Compile Electron TypeScript only
npm run electron:compile

# Build production installer
npm run electron:build

# Run Next.js only (no Electron)
npm run dev

# Get clinic ID
npx tsx scripts/get-clinic-id.ts

# Add autoclave
npx tsx scripts/add-autoclave.ts "Name" "IP" [port]
```

## Need Help?

- **Electron Guide**: [ELECTRON-GUIDE.md](./ELECTRON-GUIDE.md)
- **Setup Complete**: [SETUP-COMPLETE.md](./SETUP-COMPLETE.md)
- **Main README**: [README.md](./README.md)
