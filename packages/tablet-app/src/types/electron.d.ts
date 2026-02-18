interface ElectronAPI {
  printLabels: (options?: { silent?: boolean }) => Promise<{ success: boolean; error?: string }>;
}

interface Window {
  electron?: ElectronAPI;
}
