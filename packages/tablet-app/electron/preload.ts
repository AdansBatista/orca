import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Add any IPC methods you need here
  // Example:
  // invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
});

// Log that preload script has loaded
console.log('Preload script loaded successfully');
