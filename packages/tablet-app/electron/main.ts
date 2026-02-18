import { app, BrowserWindow, ipcMain } from 'electron';
import { spawn, fork, ChildProcess } from 'child_process';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
let nextProcess: ChildProcess | null = null;

const isDev = !app.isPackaged;
const port = process.env.PORT || 3001;

async function waitForServer(url: string, timeout = 30000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch (error) {
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

    nextProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      shell: true,
      stdio: 'inherit',
    });

    nextProcess.on('error', (error) => {
      console.error('Failed to start Next.js dev server:', error);
    });
  } else {
    // In production, start the Next.js standalone server using fork (uses Electron's bundled Node.js)
    console.log('Starting Next.js production server...');

    const appPath = app.getAppPath();
    const serverPath = path.join(appPath, '.next/standalone/packages/tablet-app/server.js');
    console.log('Server path:', serverPath);

    nextProcess = fork(serverPath, [], {
      cwd: path.join(appPath, '.next/standalone/packages/tablet-app'),
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
    app.quit();
    return;
  }

  console.log('Next.js server is ready!');

  // Determine icon path
  const iconPath = isDev
    ? path.join(__dirname, '../public/icon.ico')
    : path.join(process.resourcesPath, 'app/public/icon.ico');

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    // fullscreen: true, // Uncomment for kiosk mode
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
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

// IPC: Print labels using Electron's native print API
// This sets page size programmatically, fixing the CSS @page issue in Electron
ipcMain.handle('print-labels', async (_event: any, options?: { silent?: boolean }) => {
  if (!mainWindow) return { success: false, error: 'No window available' };

  // 1 inch = 25400 microns
  const pageWidth = 2 * 25400;  // 2 inches
  const pageHeight = 1 * 25400; // 1 inch

  return new Promise((resolve) => {
    mainWindow!.webContents.print(
      {
        silent: options?.silent ?? false,
        printBackground: true,
        pageSize: {
          width: pageWidth,
          height: pageHeight,
        },
        margins: {
          marginType: 'none',
        },
      },
      (success: boolean, failureReason: string) => {
        if (success) {
          resolve({ success: true });
        } else {
          console.error('Print failed:', failureReason);
          resolve({ success: false, error: failureReason });
        }
      }
    );
  });
});

// App lifecycle
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // Kill Next.js process if running
  if (nextProcess) {
    nextProcess.kill();
  }

  // On macOS, apps typically stay active until Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
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
