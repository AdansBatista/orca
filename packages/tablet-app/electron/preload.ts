import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Print labels using Electron's native print API
  // This bypasses the broken window.print() CSS @page handling in Electron
  printLabels: (options?: { silent?: boolean }) =>
    ipcRenderer.invoke('print-labels', options),
});

// Log that preload script has loaded
console.log('Preload script loaded successfully');
