/**
 * Autoclave Service
 *
 * HTTP client for communicating with STATCLAVE G4 and compatible autoclaves.
 * Autoclaves expose a web interface on their local IP with PHP endpoints.
 *
 * File structure on autoclave:
 * /opt/data/scilog/YYYY/MM/DD/S{YYYYMMDD}_{cyclenum}_{serial}.txt  (log file)
 * /opt/data/scilog/YYYY/MM/DD/S{YYYYMMDD}_{cyclenum}_{serial}.cpt  (cycle data)
 *
 * Supported endpoints:
 * - GET /data/cycles.cgi - Lists available years/months (index only)
 * - GET /data/file_reader.php?filename=... - Read raw log file
 * - GET /data/cycleData.php?filename=...&t=... - Get cycle data (JSON)
 * - GET /data/cycleDescription.php?cycle_id=...&t=... - Get cycle description
 */

// Helper for logging with timestamps
function log(level: 'INFO' | 'DEBUG' | 'ERROR' | 'WARN', message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `[AUTOCLAVE-SERVICE][${timestamp}][${level}]`;
  if (data !== undefined) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

// Types for autoclave API responses
export interface AutoclaveCycleIndex {
  year: string;
  months: {
    month: string;
    days?: {
      day: string;
      cycles: string[];
    }[];
  }[];
}

export interface AutoclaveCycleData {
  date: string; // "2025-10-08"
  number: number; // 1755
  runmode: number; // 1
  display_units: 'metric' | 'imperial';
  log: string; // Full cycle log text
  status: string; // "Solid/Wrapped / 132°C/4min"
  x_axis_points: number;
  temp: string; // Space-separated temperature readings
  pressure: string; // Space-separated pressure readings
  succeeded: boolean;
}

export interface ParsedCycleLog {
  model: string; // "STATCLAVE G4 SBS1R118"
  serialNumber: string; // "710123B00004"
  unitNumber: string; // "000"
  waterQuality: string; // "1.2uS / 0.7ppm"
  cycleNumber: number; // 1755
  cycleDateTime: Date;
  cycleProgram: string; // "Solid/Wrapped"
  targetTemp: number; // 132
  targetTime: number; // 4 (minutes)
  minTemp: number;
  maxTemp: number;
  minPressure: number;
  maxPressure: number;
  sterilizingStart: number; // minutes
  sterilizingEnd: number; // minutes
  dryingStart: number; // minutes
  dryingEnd: number; // minutes
  cycleComplete: number; // minutes
  digitalSignature: string;
}

export interface FlattenedCycle {
  year: string;
  month: string;
  day: string;
  cycleNumber: string;
  date: Date;
}

export interface AutoclaveFileInfo {
  filename: string;        // Full path: /opt/data/scilog/2025/12/12/S20251212_00391_710125H00004.txt
  year: string;
  month: string;
  day: string;
  cycleNumber: string;     // "00391" (from filename)
  serialNumber: string;    // "710125H00004"
  date: Date;
}

/**
 * Cycle info as embedded in the archives.php page
 */
export interface AutoclaveCycleInfo {
  records_id: number;
  cycle_start_time: number;  // Unix timestamp
  file_name: string;         // e.g., "S20251212_00391_710125H00004"
  cycle_number: number;
  cycle_id: string;          // e.g., "STATCLAVE_120V_solid_wrapped_132_4min"
}

/**
 * Parse a scilog filename to extract cycle info
 * Format: S{YYYYMMDD}_{cyclenum}_{serial}.txt or .cpt
 * Example: S20251212_00391_710125H00004.txt
 */
function parseSclogFilename(filepath: string): AutoclaveFileInfo | null {
  // Extract just the filename from the path
  const parts = filepath.split('/');
  const filename = parts[parts.length - 1];

  // Match pattern: S{YYYYMMDD}_{cyclenum}_{serial}.txt
  const match = filename.match(/^S(\d{4})(\d{2})(\d{2})_(\d+)_([A-Z0-9]+)\.(txt|cpt)$/i);
  if (!match) {
    log('DEBUG', `Filename doesn't match scilog pattern`, { filename, filepath });
    return null;
  }

  const [, year, month, day, cycleNumber, serialNumber] = match;

  return {
    filename: filepath,
    year,
    month,
    day,
    cycleNumber,
    serialNumber,
    date: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
  };
}

// Default timeout for autoclave requests (5 seconds)
const DEFAULT_TIMEOUT = 5000;

// Base path for scilog files on autoclave
const SCILOG_BASE_PATH = '/opt/data/scilog';

/**
 * Fetch all cycles directly from archives.php page
 * This parses the embedded cyclesInfo JavaScript variable which contains all cycle metadata
 */
export async function fetchAllCyclesFromArchives(
  ipAddress: string,
  port: number = 80
): Promise<AutoclaveCycleInfo[]> {
  const baseUrl = `http://${ipAddress}:${port}`;
  log('INFO', `Fetching all cycles from archives.php`, { ipAddress, port });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    log('WARN', `fetchAllCyclesFromArchives timeout after ${DEFAULT_TIMEOUT * 2}ms`);
    controller.abort();
  }, DEFAULT_TIMEOUT * 2);

  try {
    const response = await fetch(`${baseUrl}/us/archives.php`, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    log('DEBUG', `archives.php response length: ${html.length} chars`);

    // Extract cyclesInfo JSON from the page
    // Pattern: cyclesInfo = [...];
    const match = html.match(/cyclesInfo\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
      log('ERROR', `Could not find cyclesInfo in archives.php`);
      return [];
    }

    try {
      const cyclesInfo = JSON.parse(match[1]) as AutoclaveCycleInfo[];
      log('INFO', `Found ${cyclesInfo.length} cycles in archives.php`);
      return cyclesInfo;
    } catch (parseError) {
      log('ERROR', `Failed to parse cyclesInfo JSON`, { parseError });
      return [];
    }
  } catch (error) {
    clearTimeout(timeoutId);
    log('ERROR', `fetchAllCyclesFromArchives failed`, { error });
    throw error;
  }
}

/**
 * Get cycles for a specific date from the archives data
 */
export function filterCyclesByDate(
  cycles: AutoclaveCycleInfo[],
  year: string,
  month: string,
  day?: string
): AutoclaveCycleInfo[] {
  return cycles.filter(cycle => {
    const date = new Date(cycle.cycle_start_time * 1000);
    const cycleYear = date.getFullYear().toString();
    const cycleMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const cycleDay = date.getDate().toString().padStart(2, '0');

    if (cycleYear !== year) return false;
    if (cycleMonth !== month.padStart(2, '0')) return false;
    if (day && cycleDay !== day.padStart(2, '0')) return false;

    return true;
  });
}

/**
 * Convert AutoclaveCycleInfo to file path
 */
export function cycleInfoToFilePath(cycle: AutoclaveCycleInfo): string {
  const date = new Date(cycle.cycle_start_time * 1000);
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${SCILOG_BASE_PATH}/${year}/${month}/${day}/${cycle.file_name}.txt`;
}

/**
 * List files in a directory on the autoclave
 *
 * This tries multiple approaches:
 * 1. Use file_reader.php to read directory (may work on some autoclaves)
 * 2. Fetch archives.php and parse the HTML to find file references
 */
async function listDirectoryFiles(
  ipAddress: string,
  port: number,
  dirPath: string
): Promise<string[]> {
  const baseUrl = `http://${ipAddress}:${port}`;
  log('DEBUG', `Listing directory files`, { ipAddress, port, dirPath });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    log('WARN', `listDirectoryFiles timeout after ${DEFAULT_TIMEOUT}ms`, { ipAddress, dirPath });
    controller.abort();
  }, DEFAULT_TIMEOUT);

  try {
    // First try: file_reader.php with directory path
    const url = `${baseUrl}/data/file_reader.php?filename=${encodeURIComponent(dirPath)}`;
    log('DEBUG', `Fetching directory listing from ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      log('DEBUG', `file_reader.php returned ${response.status}, trying alternative approach`);
      return await listDirectoryFilesViaArchives(ipAddress, port, dirPath);
    }

    const text = await response.text();
    log('DEBUG', `Directory response length: ${text.length} chars`);
    log('DEBUG', `Directory response (first 1000 chars)`, { text: text.substring(0, 1000) });

    // Parse the response - it might be HTML or plain text listing
    // Look for .txt files that match our pattern
    const fileMatches = text.match(/S\d{8}_\d+_[A-Z0-9]+\.txt/gi) || [];
    log('DEBUG', `Found ${fileMatches.length} scilog files in directory`);

    if (fileMatches.length === 0) {
      log('DEBUG', `No files found via file_reader.php, trying archives.php`);
      return await listDirectoryFilesViaArchives(ipAddress, port, dirPath);
    }

    return Array.from(new Set(fileMatches)); // Remove duplicates
  } catch (error) {
    clearTimeout(timeoutId);
    log('DEBUG', `file_reader.php failed, trying archives.php`, { error });
    return await listDirectoryFilesViaArchives(ipAddress, port, dirPath);
  }
}

/**
 * Alternative method: fetch archives.php page and parse HTML to find files
 */
async function listDirectoryFilesViaArchives(
  ipAddress: string,
  port: number,
  dirPath: string
): Promise<string[]> {
  const baseUrl = `http://${ipAddress}:${port}`;
  log('DEBUG', `Trying archives.php approach for ${dirPath}`);

  // Extract year/month/day from dirPath
  // dirPath format: /opt/data/scilog/2025/12/12
  const pathMatch = dirPath.match(/\/(\d{4})\/(\d{2})\/(\d{2})$/);
  if (!pathMatch) {
    log('ERROR', `Could not parse dirPath`, { dirPath });
    return [];
  }

  const [, year, month, day] = pathMatch;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    // Fetch the archives page - it might have a date selector or list all files
    const url = `${baseUrl}/us/archives.php`;
    log('DEBUG', `Fetching archives page ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      log('ERROR', `archives.php returned ${response.status}`);
      return [];
    }

    const html = await response.text();
    log('DEBUG', `archives.php response length: ${html.length} chars`);

    // Look for file references in the HTML that match our date
    const dateStr = `${year}${month}${day}`;
    const pattern = new RegExp(`S${dateStr}_\\d+_[A-Z0-9]+\\.txt`, 'gi');
    const fileMatches = html.match(pattern) || [];

    log('DEBUG', `Found ${fileMatches.length} files for date ${dateStr} in archives.php`);

    // Also look for files in script blocks or data attributes
    const allFiles = html.match(/S\d{8}_\d+_[A-Z0-9]+\.txt/gi) || [];
    const targetDateFiles = allFiles.filter(f => f.includes(`S${dateStr}_`));

    log('DEBUG', `Total matching files: ${targetDateFiles.length}`);
    return Array.from(new Set([...fileMatches, ...targetDateFiles]));
  } catch (error) {
    clearTimeout(timeoutId);
    log('ERROR', `archives.php approach failed`, { error });
    return [];
  }
}

/**
 * Test connection to an autoclave by fetching the cycles index
 */
export async function testAutoclaveConnection(
  ipAddress: string,
  port: number = 80
): Promise<{ success: boolean; model?: string; error?: string }> {
  const baseUrl = `http://${ipAddress}:${port}`;
  log('INFO', `Testing connection to autoclave`, { ipAddress, port, baseUrl });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      log('WARN', `Request timeout after ${DEFAULT_TIMEOUT}ms, aborting...`, { ipAddress });
      controller.abort();
    }, DEFAULT_TIMEOUT);

    log('DEBUG', `Fetching cycles index from ${baseUrl}/data/cycles.cgi`);
    const startTime = Date.now();

    const response = await fetch(`${baseUrl}/data/cycles.cgi`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    log('DEBUG', `Response received in ${elapsed}ms`, { status: response.status, statusText: response.statusText });

    if (!response.ok) {
      log('ERROR', `HTTP error from autoclave`, { status: response.status, statusText: response.statusText });
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as AutoclaveCycleIndex[];
    log('DEBUG', `Parsed response data`, { yearCount: data?.length, isArray: Array.isArray(data) });

    if (!Array.isArray(data) || data.length === 0) {
      log('ERROR', `Invalid response format`, { data });
      return {
        success: false,
        error: 'Invalid response format from autoclave',
      };
    }

    // Try to get model info from a recent cycle
    let model = 'Unknown Autoclave';
    log('DEBUG', `Fetching latest cycle to get model info...`);
    const latestCycle = await getLatestCycle(ipAddress, port);

    if (latestCycle) {
      log('DEBUG', `Found latest cycle`, latestCycle);
      const cycleData = await fetchCycleData(
        ipAddress,
        port,
        latestCycle.year,
        latestCycle.month,
        latestCycle.day,
        latestCycle.cycleNumber
      );
      if (cycleData) {
        log('DEBUG', `Fetched cycle data, parsing log...`);
        const parsed = parseCycleLog(cycleData.log);
        if (parsed) {
          model = parsed.model;
          log('DEBUG', `Parsed model from log`, { model });
        }
      }
    } else {
      log('DEBUG', `No cycles found on autoclave`);
    }

    log('INFO', `Connection test successful`, { model });
    return { success: true, model };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        log('ERROR', `Connection timeout - autoclave did not respond within ${DEFAULT_TIMEOUT}ms`, {
          ipAddress,
          port,
          errorName: error.name,
          errorMessage: error.message
        });
        return { success: false, error: 'Connection timeout' };
      }
      log('ERROR', `Connection failed with error`, {
        ipAddress,
        port,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      });
      return { success: false, error: error.message };
    }
    log('ERROR', `Connection failed with unknown error`, { error });
    return { success: false, error: 'Unknown error' };
  }
}

/**
 * Fetch available cycles from an autoclave
 */
export async function fetchAvailableCycles(
  ipAddress: string,
  port: number = 80
): Promise<AutoclaveCycleIndex[]> {
  const baseUrl = `http://${ipAddress}:${port}`;
  log('DEBUG', `Fetching available cycles`, { ipAddress, port });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    log('WARN', `fetchAvailableCycles timeout after ${DEFAULT_TIMEOUT}ms`, { ipAddress });
    controller.abort();
  }, DEFAULT_TIMEOUT);

  const startTime = Date.now();
  const response = await fetch(`${baseUrl}/data/cycles.cgi`, {
    method: 'GET',
    signal: controller.signal,
  });

  clearTimeout(timeoutId);
  log('DEBUG', `fetchAvailableCycles response in ${Date.now() - startTime}ms`, { status: response.status });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  log('DEBUG', `fetchAvailableCycles parsed ${data?.length || 0} years`);
  return data;
}

/**
 * Fetch available cycles for a specific month (with day/cycle details)
 *
 * This function now uses the archives.php approach which is most reliable
 */
export async function fetchMonthCycles(
  ipAddress: string,
  port: number,
  year: string,
  month: string
): Promise<{ day: string; cycles: string[] }[]> {
  log('DEBUG', `Fetching month cycles`, { ipAddress, port, year, month });

  // Primary approach: fetch from archives.php
  try {
    const allCycles = await fetchAllCyclesFromArchives(ipAddress, port);
    const monthCycles = filterCyclesByDate(allCycles, year, month);

    log('DEBUG', `Found ${monthCycles.length} cycles for ${year}/${month} from archives.php`);

    // Group by day
    const dayMap = new Map<string, string[]>();
    for (const cycle of monthCycles) {
      const date = new Date(cycle.cycle_start_time * 1000);
      const dayStr = date.getDate().toString().padStart(2, '0');
      // Extract cycle number from filename: S20251212_00391_710125H00004 -> 00391
      const cycleNumMatch = cycle.file_name.match(/_(\d+)_/);
      const cycleNum = cycleNumMatch ? cycleNumMatch[1] : cycle.cycle_number.toString();

      if (!dayMap.has(dayStr)) {
        dayMap.set(dayStr, []);
      }
      dayMap.get(dayStr)!.push(cycleNum);
    }

    // Convert to array format
    const result: { day: string; cycles: string[] }[] = [];
    dayMap.forEach((cycles, day) => {
      result.push({ day, cycles: cycles.sort() });
    });

    log('DEBUG', `fetchMonthCycles found ${result.length} days with cycles`);
    return result.sort((a, b) => parseInt(a.day) - parseInt(b.day));
  } catch (error) {
    log('ERROR', `fetchMonthCycles failed`, { error });
    return [];
  }
}

/**
 * Fetch detailed data for a specific cycle
 *
 * Uses the cycleData.php endpoint with the .cpt file path
 * URL format: /data/cycleData.php?filename=/opt/data/scilog/YYYY/MM/DD/S{date}_{cycle}_{serial}.cpt&t={timestamp}&{json}
 */
export async function fetchCycleData(
  ipAddress: string,
  port: number,
  year: string,
  month: string,
  day: string,
  cycleNumber: string,
  serialNumber?: string
): Promise<AutoclaveCycleData | null> {
  const baseUrl = `http://${ipAddress}:${port}`;
  const timestamp = Date.now();
  log('DEBUG', `Fetching cycle data`, { ipAddress, port, year, month, day, cycleNumber, serialNumber });

  const controller = new AbortController();
  const cycleDataTimeout = DEFAULT_TIMEOUT * 2;
  const timeoutId = setTimeout(() => {
    log('WARN', `fetchCycleData timeout after ${cycleDataTimeout}ms`, { ipAddress, cycleNumber });
    controller.abort();
  }, cycleDataTimeout);

  try {
    let cptFilename: string;

    if (serialNumber) {
      // Build the filename directly
      const dateStr = `${year}${month}${day}`;
      const paddedCycle = cycleNumber.padStart(5, '0');
      cptFilename = `${SCILOG_BASE_PATH}/${year}/${month}/${day}/S${dateStr}_${paddedCycle}_${serialNumber}.cpt`;
    } else {
      // Use cyclesInfo from archives.php to find the file
      const allCycles = await fetchAllCyclesFromArchives(ipAddress, port);
      const paddedCycle = cycleNumber.padStart(5, '0');

      // Find the cycle that matches our criteria
      const matchingCycle = allCycles.find((c) => {
        // Check if the filename contains our cycle number
        return c.file_name.includes(`_${paddedCycle}_`);
      });

      if (!matchingCycle) {
        log('ERROR', `Could not find cycle ${cycleNumber} in archives`, { paddedCycle });
        clearTimeout(timeoutId);
        return null;
      }

      // Build the full path from the cycle info
      const cycleDate = new Date(matchingCycle.cycle_start_time * 1000);
      const cycleYear = cycleDate.getFullYear().toString();
      const cycleMonth = (cycleDate.getMonth() + 1).toString().padStart(2, '0');
      const cycleDay = cycleDate.getDate().toString().padStart(2, '0');
      cptFilename = `${SCILOG_BASE_PATH}/${cycleYear}/${cycleMonth}/${cycleDay}/${matchingCycle.file_name}.cpt`;
    }

    log('DEBUG', `Using cpt file: ${cptFilename}`);

    // Build the URL with query params like the browser does
    const jsonParams = JSON.stringify({ year, month, day, cycle: cycleNumber });
    const url = `${baseUrl}/data/cycleData.php?filename=${encodeURIComponent(cptFilename)}&t=${timestamp}&${encodeURIComponent(jsonParams)}`;

    log('DEBUG', `Fetching from ${url}`);
    const startTime = Date.now();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/javascript, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    log('DEBUG', `fetchCycleData response in ${Date.now() - startTime}ms`, { status: response.status });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    log('DEBUG', `fetchCycleData parsed`, { cycleNumber: data?.number, succeeded: data?.succeeded });
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    log('ERROR', `fetchCycleData failed`, { error });
    throw error;
  }
}

/**
 * Fetch cycle data by filename directly (when we know the full path)
 */
export async function fetchCycleDataByFilename(
  ipAddress: string,
  port: number,
  txtFilename: string
): Promise<AutoclaveCycleData | null> {
  const baseUrl = `http://${ipAddress}:${port}`;
  const timestamp = Date.now();
  log('DEBUG', `Fetching cycle data by filename`, { ipAddress, port, txtFilename });

  // Parse the filename to get cycle info
  const parsed = parseSclogFilename(txtFilename);
  if (!parsed) {
    log('ERROR', `Could not parse filename`, { txtFilename });
    return null;
  }

  // Convert .txt to .cpt for the data file
  const cptFilename = txtFilename.replace('.txt', '.cpt');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT * 2);

  try {
    const jsonParams = JSON.stringify({
      year: parsed.year,
      month: parsed.month,
      day: parsed.day,
      cycle: parsed.cycleNumber,
    });

    const url = `${baseUrl}/data/cycleData.php?filename=${encodeURIComponent(cptFilename)}&t=${timestamp}&${encodeURIComponent(jsonParams)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/javascript, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    log('ERROR', `fetchCycleDataByFilename failed`, { error });
    throw error;
  }
}

/**
 * Fetch cycle data directly from AutoclaveCycleInfo (most efficient)
 * Use this when you already have the cycle info from archives.php
 */
export async function fetchCycleDataFromInfo(
  ipAddress: string,
  port: number,
  cycleInfo: AutoclaveCycleInfo
): Promise<AutoclaveCycleData | null> {
  const baseUrl = `http://${ipAddress}:${port}`;
  const timestamp = Date.now();
  log('DEBUG', `Fetching cycle data from info`, { ipAddress, port, cycleInfo });

  // Build the file path from cycle info
  const cycleDate = new Date(cycleInfo.cycle_start_time * 1000);
  const year = cycleDate.getFullYear().toString();
  const month = (cycleDate.getMonth() + 1).toString().padStart(2, '0');
  const day = cycleDate.getDate().toString().padStart(2, '0');
  const cptFilename = `${SCILOG_BASE_PATH}/${year}/${month}/${day}/${cycleInfo.file_name}.cpt`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT * 2);

  try {
    // Extract cycle number from filename
    const cycleNumMatch = cycleInfo.file_name.match(/_(\d+)_/);
    const cycleNumber = cycleNumMatch ? cycleNumMatch[1] : cycleInfo.cycle_number.toString();

    const jsonParams = JSON.stringify({ year, month, day, cycle: cycleNumber });
    const url = `${baseUrl}/data/cycleData.php?filename=${encodeURIComponent(cptFilename)}&t=${timestamp}&${encodeURIComponent(jsonParams)}`;

    log('DEBUG', `Fetching from ${url}`);
    const startTime = Date.now();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/javascript, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    log('DEBUG', `fetchCycleDataFromInfo response in ${Date.now() - startTime}ms`, { status: response.status });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    log('DEBUG', `fetchCycleDataFromInfo parsed`, { cycleNumber: data?.number, succeeded: data?.succeeded });
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    log('ERROR', `fetchCycleDataFromInfo failed`, { error });
    throw error;
  }
}

/**
 * Fetch cycles for a specific day
 */
export async function fetchDayCycles(
  ipAddress: string,
  port: number,
  year: string,
  month: string,
  day: string
): Promise<AutoclaveFileInfo[]> {
  log('DEBUG', `Fetching day cycles`, { ipAddress, port, year, month, day });

  const dirPath = `${SCILOG_BASE_PATH}/${year}/${month}/${day}`;
  const files = await listDirectoryFiles(ipAddress, port, dirPath);

  const cycles: AutoclaveFileInfo[] = [];
  for (const file of files) {
    const parsed = parseSclogFilename(file);
    if (parsed) {
      // Add the full path
      parsed.filename = `${dirPath}/${file}`;
      cycles.push(parsed);
    }
  }

  log('DEBUG', `fetchDayCycles found ${cycles.length} cycles`);
  return cycles.sort((a, b) => parseInt(a.cycleNumber) - parseInt(b.cycleNumber));
}

/**
 * Fetch raw log file content
 */
export async function fetchRawLogFile(
  ipAddress: string,
  port: number,
  filename: string
): Promise<string | null> {
  const baseUrl = `http://${ipAddress}:${port}`;
  log('DEBUG', `Fetching raw log file`, { ipAddress, port, filename });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const url = `${baseUrl}/data/file_reader.php?filename=${encodeURIComponent(filename)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    log('ERROR', `fetchRawLogFile failed`, { error });
    return null;
  }
}

/**
 * Parse the log text from an autoclave cycle to extract structured data
 */
export function parseCycleLog(log: string): ParsedCycleLog | null {
  if (!log) return null;

  const lines = log.split('\r\n').filter((l) => l.trim());

  const result: Partial<ParsedCycleLog> = {};

  // First line is model: "STATCLAVE G4 SBS1R118"
  if (lines[0]) {
    result.model = lines[0].trim();
  }

  // Parse line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Serial Number: "SN 710123B00004"
    if (line.startsWith('SN ')) {
      result.serialNumber = line.replace('SN ', '').trim();
    }

    // Unit Number: "Unit #  :        000"
    if (line.startsWith('Unit #')) {
      const match = line.match(/Unit #\s*:\s*(\d+)/);
      if (match) result.unitNumber = match[1];
    }

    // Water Quality: "1.2uS / 0.7ppm"
    if (line.includes('uS') && line.includes('ppm')) {
      result.waterQuality = line.trim();
    }

    // Cycle Number: "CYCLE NUMBER  001755"
    if (line.startsWith('CYCLE NUMBER')) {
      const match = line.match(/CYCLE NUMBER\s+(\d+)/);
      if (match) result.cycleNumber = parseInt(match[1], 10);
    }

    // Date/Time: " 9:54:52  08/10/2025"
    const dateMatch = line.match(/(\d{1,2}):(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})/);
    if (dateMatch) {
      const [, hours, minutes, seconds, day, month, year] = dateMatch;
      result.cycleDateTime = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );
    }

    // Program & Target: "Solid/Wrapped" and "132 C/4min"
    if (line.includes('/') && !line.includes(':') && !line.includes('ppm')) {
      if (line.includes('C/') && line.includes('min')) {
        // Temperature/time line: "132 C/4min"
        const tempMatch = line.match(/(\d+)\s*C\/(\d+)min/);
        if (tempMatch) {
          result.targetTemp = parseInt(tempMatch[1], 10);
          result.targetTime = parseInt(tempMatch[2], 10);
        }
      } else if (!line.includes('Values')) {
        // Program type: "Solid/Wrapped"
        result.cycleProgram = line.trim();
      }
    }

    // Min/Max sterilization values
    if (line.startsWith('Min. steri. Values:')) {
      const nextLine = lines[i + 1]?.trim();
      if (nextLine) {
        const match = nextLine.match(/(\d+\.?\d*)\s*C\s+(\d+)kPa/);
        if (match) {
          result.minTemp = parseFloat(match[1]);
          result.minPressure = parseInt(match[2], 10);
        }
      }
    }

    if (line.startsWith('Max. steri. Values:')) {
      const nextLine = lines[i + 1]?.trim();
      if (nextLine) {
        const match = nextLine.match(/(\d+\.?\d*)\s*C\s+(\d+)kPa/);
        if (match) {
          result.maxTemp = parseFloat(match[1]);
          result.maxPressure = parseInt(match[2], 10);
        }
      }
    }

    // Sterilizing times: "STERILIZING    25:35"
    if (line.startsWith('STERILIZING')) {
      const match = line.match(/STERILIZING\s+(\d+):(\d+)/);
      if (match) {
        result.sterilizingStart = parseInt(match[1], 10);
        result.sterilizingEnd = parseInt(match[1], 10);
      }
    }

    // Drying times
    if (line.startsWith('DRYING START')) {
      const match = line.match(/DRYING START\s+(\d+):(\d+)/);
      if (match) result.dryingStart = parseInt(match[1], 10);
    }

    if (line.startsWith('DRYING END')) {
      const match = line.match(/DRYING END\s+(\d+):(\d+)/);
      if (match) result.dryingEnd = parseInt(match[1], 10);
    }

    // Cycle complete time
    if (line.startsWith('CYCLE COMPLETE')) {
      const match = line.match(/CYCLE COMPLETE\s+(\d+):(\d+)/);
      if (match) result.cycleComplete = parseInt(match[1], 10);
    }

    // Digital Signature
    if (line === 'Digital Signature #') {
      const sigLine = lines[i + 1]?.trim();
      if (sigLine && !sigLine.startsWith('-')) {
        result.digitalSignature = sigLine;
      }
    }
  }

  // Only return if we have minimum required fields
  if (result.model && result.cycleNumber) {
    return result as ParsedCycleLog;
  }

  return null;
}

/**
 * Get the most recent cycle from the autoclave
 * Uses archives.php which contains all cycles
 */
export async function getLatestCycle(
  ipAddress: string,
  port: number = 80
): Promise<FlattenedCycle | null> {
  log('DEBUG', `Getting latest cycle`, { ipAddress, port });

  try {
    const allCycles = await fetchAllCyclesFromArchives(ipAddress, port);

    if (!allCycles.length) {
      log('DEBUG', `No cycles found in archives`);
      return null;
    }

    // Sort by timestamp descending and get the latest
    const sorted = [...allCycles].sort((a, b) => b.cycle_start_time - a.cycle_start_time);
    const latest = sorted[0];

    const date = new Date(latest.cycle_start_time * 1000);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Extract cycle number from filename: S20251212_00391_710125H00004 -> 00391
    const cycleNumMatch = latest.file_name.match(/_(\d+)_/);
    const cycleNumber = cycleNumMatch ? cycleNumMatch[1] : latest.cycle_number.toString().padStart(5, '0');

    log('DEBUG', `Latest cycle: ${cycleNumber} on ${year}-${month}-${day}`);

    return {
      year,
      month,
      day,
      cycleNumber,
      date,
    };
  } catch (error) {
    log('ERROR', `getLatestCycle failed`, { error });
    return null;
  }
}

/**
 * Flatten all cycles from the index into a list
 */
export async function flattenAllCycles(
  ipAddress: string,
  port: number = 80,
  sinceYear?: string,
  sinceMonth?: string
): Promise<FlattenedCycle[]> {
  const index = await fetchAvailableCycles(ipAddress, port);
  const cycles: FlattenedCycle[] = [];

  for (const yearData of index) {
    // Skip years before our filter
    if (sinceYear && yearData.year < sinceYear) continue;

    for (const monthData of yearData.months) {
      // Skip months before our filter
      if (sinceYear && yearData.year === sinceYear && sinceMonth && monthData.month < sinceMonth) {
        continue;
      }

      // Fetch day details for this month
      const days = await fetchMonthCycles(ipAddress, port, yearData.year, monthData.month);

      for (const dayData of days) {
        for (const cycleNum of dayData.cycles) {
          cycles.push({
            year: yearData.year,
            month: monthData.month,
            day: dayData.day,
            cycleNumber: cycleNum,
            date: new Date(
              parseInt(yearData.year),
              parseInt(monthData.month) - 1,
              parseInt(dayData.day)
            ),
          });
        }
      }
    }
  }

  return cycles;
}

/**
 * Get cycles since a specific cycle number (for incremental sync)
 */
export async function getCyclesSince(
  ipAddress: string,
  port: number = 80,
  sinceCycleNumber: number
): Promise<FlattenedCycle[]> {
  const allCycles = await flattenAllCycles(ipAddress, port);

  // Filter to cycles with number greater than the specified one
  return allCycles.filter((c) => parseInt(c.cycleNumber, 10) > sinceCycleNumber);
}

/**
 * Map autoclave runmode/status to our SterilizationCycleType
 *
 * @param runmode - Numeric runmode from autoclave (optional)
 * @param status - Status/program string (e.g., "Solid/Wrapped / 132°C/4min") (optional)
 * @param cycleId - Cycle ID string from cyclesInfo (e.g., "STATCLAVE_120V_solid_wrapped_132_4min") (optional)
 */
export function mapRunmodeToType(runmode?: number, status?: string, cycleId?: string): string {
  // Try to determine type from status string first
  if (status) {
    const statusLower = status.toLowerCase();

    if (statusLower.includes('flash') || statusLower.includes('immediate')) {
      return 'STEAM_FLASH';
    }

    if (statusLower.includes('prevac') || statusLower.includes('pre-vac')) {
      return 'STEAM_PREVACUUM';
    }
  }

  // Try to determine from cycleId (e.g., "STATCLAVE_120V_solid_wrapped_132_4min")
  if (cycleId) {
    const cycleIdLower = cycleId.toLowerCase();

    if (cycleIdLower.includes('flash') || cycleIdLower.includes('immediate')) {
      return 'STEAM_FLASH';
    }

    if (cycleIdLower.includes('prevac') || cycleIdLower.includes('pre_vac') || cycleIdLower.includes('pre-vac')) {
      return 'STEAM_PREVACUUM';
    }

    // Check for temperature hints in cycleId
    // 132°C typically indicates prevacuum, 121°C typically indicates gravity
    if (cycleIdLower.includes('132') || cycleIdLower.includes('134')) {
      return 'STEAM_PREVACUUM';
    }
  }

  // Default to gravity for most steam cycles
  return 'STEAM_GRAVITY';
}

/**
 * Calculate cycle duration in minutes from cycle data
 */
export function calculateCycleDuration(cycleData: AutoclaveCycleData): number {
  // Try to get duration from parsed log first
  if (cycleData.log) {
    const parsed = parseCycleLog(cycleData.log);
    if (parsed?.cycleComplete) {
      return parsed.cycleComplete;
    }
  }

  // Fallback: count data points (each point is ~5 seconds)
  // Handle both comma-separated and space-separated temp formats
  if (cycleData.temp) {
    const separator = cycleData.temp.includes(',') ? ',' : ' ';
    const tempPoints = cycleData.temp.split(separator).filter((t) => t.trim()).length;
    return Math.round((tempPoints * 5) / 60);
  }

  // Default duration if no data available
  return 30;
}
