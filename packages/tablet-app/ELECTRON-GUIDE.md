# Running the Electron App

## Quick Start

### Option 1: Development Mode (Recommended for Testing)

This will compile the Electron TypeScript files and launch the app with hot-reload:

```bash
cd packages/tablet-app
npm run electron:dev
```

What happens:
1. Compiles `electron/main.ts` and `electron/preload.ts` to JavaScript
2. Starts Electron
3. Electron spawns the Next.js dev server automatically
4. Opens a desktop window with DevTools
5. App loads at `http://localhost:3001`

### Option 2: Production Build

Build a standalone installer:

```bash
cd packages/tablet-app
npm run electron:build
```

Output: `dist/Autoclave Monitor-1.0.0.exe`

## File Structure

```
electron/
├── main.ts          # Main Electron process (window management)
├── preload.ts       # Preload script (IPC bridge)
├── tsconfig.json    # TypeScript config for Electron
└── dist/            # Compiled JavaScript (generated)
    ├── main.js
    └── preload.js
```

## How It Works

### Development Mode

1. **Electron starts** (`electron .`)
2. **main.js spawns Next.js dev server** (`npm run dev`)
3. **Waits for server** to be ready on port 3001
4. **Loads URL** `http://localhost:3001` in Electron window
5. **Hot reload** works - changes to React components update automatically

### Window Features

- **Size**: 1024x768 (optimized for tablets)
- **Fullscreen**: Commented out by default (uncomment for kiosk mode)
- **DevTools**: Opens automatically in development
- **Menu**: Hidden for cleaner UI

## Kiosk Mode (Fullscreen)

To enable fullscreen kiosk mode, edit `electron/main.ts`:

```typescript
mainWindow = new BrowserWindow({
  width: 1024,
  height: 768,
  fullscreen: true, // ← Uncomment this line
  // ...
});
```

## Common Issues

### Port Already in Use

If port 3001 is taken:
1. Change `PORT=3001` in `.env` to another port (e.g., 3002)
2. Restart Electron

### Electron Window Opens but Shows Blank

- Check Next.js dev server is running
- Look at Electron console logs
- Verify MongoDB is running

### Hot Reload Not Working

- This is normal - Electron doesn't hot-reload
- Close and restart: `npm run electron:dev`
- React components will hot-reload in the Electron window

## Scripts Explained

| Script | Purpose |
|--------|---------|
| `npm run electron:compile` | Compile TypeScript to JavaScript |
| `npm run electron:dev` | Compile + Run Electron in dev mode |
| `npm run electron:build` | Build production installer |

## Environment Variables

The Electron app uses the same `.env` file:

```bash
DATABASE_URL="mongodb://..."  # MongoDB connection
CLINIC_ID="..."               # Hard-coded clinic
PORT=3001                     # Next.js dev server port
```

## Debugging

### Electron Console

Shows main process logs:
- When Next.js server starts
- Server ready status
- Any errors

### DevTools (Web Console)

Shows renderer process logs:
- React component errors
- API call logs
- Browser console.log()

### Enable Verbose Logging

Edit `electron/main.ts`:

```typescript
nextProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '..'),
  shell: true,
  stdio: 'inherit', // ← Shows Next.js logs in Electron console
});
```

## Building for Production

### Prerequisites

- Windows 10/11 (for .exe builds)
- All dependencies installed
- MongoDB running

### Build Process

```bash
# 1. Build Next.js app
npm run build

# 2. Compile Electron TypeScript
npm run electron:compile

# 3. Build installer
npm run electron:build
```

Output in `dist/`:
- `Autoclave Monitor-1.0.0.exe` - Installer
- `Autoclave Monitor-1.0.0-portable.exe` - Portable version

### Installer Options

Configured in `package.json` → `build`:

- **NSIS**: Windows installer with uninstaller
- **Portable**: Single .exe, no installation required

## Deployment

1. Copy `.exe` to tablet
2. Run installer or portable version
3. Configure autoclave IPs in Settings
4. Start monitoring!

## Next Steps

- **Test on actual tablet** (Surface Pro, Dell Latitude, etc.)
- **Enable fullscreen** for kiosk mode
- **Test with autoclaves** (192.168.0.15, 192.168.0.23)
- **Test thermal printer** (Zebra ZD411/ZD420)
