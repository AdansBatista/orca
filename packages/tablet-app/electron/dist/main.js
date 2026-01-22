"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
let mainWindow = null;
let nextProcess = null;
const isDev = !electron_1.app.isPackaged;
const port = process.env.PORT || 3001;
async function waitForServer(url, timeout = 30000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return true;
            }
        }
        catch (error) {
            // Server not ready yet, wait and retry
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    return false;
}
async function createWindow() {
    if (isDev) {
        // In development, spawn Next.js dev server
        console.log('Starting Next.js dev server...');
        nextProcess = (0, child_process_1.spawn)('npm', ['run', 'dev'], {
            cwd: path_1.default.join(__dirname, '..'),
            shell: true,
            stdio: 'inherit',
        });
        nextProcess.on('error', (error) => {
            console.error('Failed to start Next.js dev server:', error);
        });
    }
    else {
        // In production, start the Next.js standalone server using fork (uses Electron's bundled Node.js)
        console.log('Starting Next.js production server...');
        const appPath = electron_1.app.getAppPath();
        const serverPath = path_1.default.join(appPath, '.next/standalone/packages/tablet-app/server.js');
        console.log('Server path:', serverPath);
        nextProcess = (0, child_process_1.fork)(serverPath, [], {
            cwd: path_1.default.join(appPath, '.next/standalone/packages/tablet-app'),
            env: {
                ...process.env,
                PORT: String(port),
                NODE_ENV: 'production',
            },
            stdio: 'inherit',
        });
        nextProcess.on('error', (error) => {
            console.error('Failed to start Next.js production server:', error);
        });
    }
    console.log(`Waiting for Next.js server on http://localhost:${port}...`);
    const serverReady = await waitForServer(`http://localhost:${port}`);
    if (!serverReady) {
        console.error('Next.js server failed to start within 30 seconds');
        electron_1.app.quit();
        return;
    }
    console.log('Next.js server is ready!');
    // Determine icon path
    const iconPath = isDev
        ? path_1.default.join(__dirname, '../public/icon.ico')
        : path_1.default.join(process.resourcesPath, 'app/public/icon.ico');
    // Create the browser window
    mainWindow = new electron_1.BrowserWindow({
        width: 1024,
        height: 768,
        // fullscreen: true, // Uncomment for kiosk mode
        icon: iconPath,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, 'preload.js'),
        },
        // Tablet-friendly settings
        autoHideMenuBar: true,
        title: 'Orca Autoclave Monitor',
    });
    // Load the Next.js app
    await mainWindow.loadURL(`http://localhost:${port}`);
    // Open DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// App lifecycle
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    // Kill Next.js process if running
    if (nextProcess) {
        nextProcess.kill();
    }
    // On macOS, apps typically stay active until Cmd+Q
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (mainWindow === null) {
        createWindow();
    }
});
electron_1.app.on('before-quit', () => {
    if (nextProcess) {
        nextProcess.kill();
    }
});
// Handle any unhandled errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
});
