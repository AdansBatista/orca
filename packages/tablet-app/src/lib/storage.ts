// Simple localStorage wrapper for autoclave data

export type CycleRange = 'today' | 'yesterday' | 'week' | 'month';

export interface Autoclave {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  cycleRange: CycleRange; // Which date range to fetch cycles for
  status: 'NOT_CONFIGURED' | 'PENDING_SETUP' | 'PENDING_CONNECTION' | 'CONNECTED' | 'ERROR' | 'INACTIVE';
  errorMessage?: string;
}

const STORAGE_KEY = 'autoclaves';

// Initialize with default autoclaves
const DEFAULT_AUTOCLAVES: Autoclave[] = [
  {
    id: 'autoclave-1',
    name: 'StatClave 1',
    ipAddress: '192.168.0.15',
    port: 80,
    cycleRange: 'today',
    status: 'NOT_CONFIGURED',
  },
  {
    id: 'autoclave-2',
    name: 'StatClave 2',
    ipAddress: '192.168.0.23',
    port: 80,
    cycleRange: 'today',
    status: 'NOT_CONFIGURED',
  },
];

export function getAutoclaves(): Autoclave[] {
  if (typeof window === 'undefined') {
    console.log('⚠️  getAutoclaves called on server side, returning defaults');
    return DEFAULT_AUTOCLAVES;
  }

  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    // First time - initialize with defaults
    console.log('📦 Initializing localStorage with default autoclaves');
    saveAutoclaves(DEFAULT_AUTOCLAVES);
    return DEFAULT_AUTOCLAVES;
  }

  try {
    const parsed = JSON.parse(stored);
    console.log('📦 Loaded from localStorage:', parsed);
    return parsed;
  } catch (error) {
    console.error('Failed to parse autoclaves from localStorage:', error);
    return DEFAULT_AUTOCLAVES;
  }
}

export function saveAutoclaves(autoclaves: Autoclave[]): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(autoclaves));
  console.log('💾 Saved', autoclaves.length, 'autoclaves to localStorage');
}

export function getAutoclaveById(id: string): Autoclave | undefined {
  const autoclaves = getAutoclaves();
  return autoclaves.find(a => a.id === id);
}

export function updateAutoclave(id: string, updates: Partial<Autoclave>): Autoclave | null {
  const autoclaves = getAutoclaves();
  const index = autoclaves.findIndex(a => a.id === id);

  if (index === -1) return null;

  autoclaves[index] = { ...autoclaves[index], ...updates };
  saveAutoclaves(autoclaves);

  return autoclaves[index];
}

export function addAutoclave(autoclave: Omit<Autoclave, 'id'>): Autoclave {
  const autoclaves = getAutoclaves();
  const newAutoclave: Autoclave = {
    ...autoclave,
    id: `autoclave-${Date.now()}`,
  };

  autoclaves.push(newAutoclave);
  saveAutoclaves(autoclaves);

  return newAutoclave;
}

export function deleteAutoclave(id: string): boolean {
  const autoclaves = getAutoclaves();
  const filtered = autoclaves.filter(a => a.id !== id);

  if (filtered.length === autoclaves.length) return false;

  saveAutoclaves(filtered);
  return true;
}
