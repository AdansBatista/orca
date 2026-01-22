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
 *
 * Firmware Compatibility:
 * - nginx firmware (newer): Standard HTTP responses
 * - MQX firmware (older): Malformed headers requiring lenient parsing
 */

import { lenientFetch, type LenientResponse } from './lenient-http';

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

// Default timeout for autoclave requests (15 seconds - MQX firmware can be very slow)
const DEFAULT_TIMEOUT = 15000;

// Base path for scilog files on autoclave
const SCILOG_BASE_PATH = '/opt/data/scilog';

// Firmware types
type FirmwareType = 'nginx' | 'mqx' | 'unknown';

// Cache for tracking which servers need lenient HTTP parsing
const needsLenientParsingCache = new Map<string, boolean>();

/**
 * Helper to get header from either standard Response or LenientResponse
 */
function getHeader(response: Response | LenientResponse, name: string): string | null {
  if (response.headers instanceof Map) {
    return response.headers.get(name.toLowerCase()) ?? null;
  }
  return response.headers.get(name);
}

/**
 * Smart fetch that automatically uses lenient parsing for MQX firmware
 *
 * Some older autoclave firmware (MQX/Freescale) sends HTTP responses with
 * malformed headers that Node.js's strict HTTP parser rejects. This function
 * detects such failures and automatically retries with lenient parsing.
 *
 * Strategy:
 * 1. If we know the server needs lenient parsing (cached), use it directly
 * 2. Try standard fetch with a SHORT timeout first (2 seconds)
 * 3. If it fails with parsing error OR times out, retry with lenient fetch
 * 4. Cache the result for future requests
 */
async function autoclaveRequest(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'HEAD';
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
  } = {}
): Promise<Response | LenientResponse> {
  const parsedUrl = new URL(url);
  const cacheKey = `${parsedUrl.hostname}:${parsedUrl.port || 80}`;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  // Check if we already know this server needs lenient parsing
  if (needsLenientParsingCache.get(cacheKey) === true) {
    log('DEBUG', `Using lenient fetch for ${cacheKey} (cached)`);
    return lenientFetch(url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      timeout,
    });
  }

  // If we know this server works with standard fetch, use it
  if (needsLenientParsingCache.get(cacheKey) === false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Unknown server - try standard fetch with a SHORT timeout first
  // MQX servers will fail quickly with parsing errors, nginx servers will succeed
  const quickTimeout = 3000; // 3 seconds for detection

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), quickTimeout);

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    needsLenientParsingCache.set(cacheKey, false);
    log('DEBUG', `Server ${cacheKey} works with standard fetch`);
    return response;
  } catch (error) {
    // Check if it's an HTTP parsing error OR timeout that might indicate MQX firmware
    if (error instanceof Error) {
      const cause = (error as Error & { cause?: Error }).cause;
      const isParsingError =
        cause?.message?.includes('HPE_INVALID') ||
        cause?.message?.includes('Invalid header') ||
        error.message.includes('fetch failed');
      const isTimeout = error.name === 'AbortError';

      if (isParsingError || isTimeout) {
        log('DEBUG', `Standard fetch failed for ${cacheKey} (${isParsingError ? 'parsing error' : 'timeout'}), trying lenient parsing`, {
          error: error.message,
          cause: cause?.message
        });

        // Try with lenient fetch using full timeout
        try {
          const response = await lenientFetch(url, {
            method: options.method,
            headers: options.headers,
            body: options.body,
            timeout,
          });

          // If lenient fetch worked, cache that this server needs it
          needsLenientParsingCache.set(cacheKey, true);
          log('DEBUG', `Server ${cacheKey} needs lenient parsing`);
          return response;
        } catch (lenientError) {
          // Lenient fetch also failed - don't cache, let caller handle
          log('DEBUG', `Lenient fetch also failed for ${cacheKey}`, { lenientError });
          throw lenientError;
        }
      }
    }
    throw error;
  }
}

/**
 * Detect the firmware type of an autoclave based on server response headers
 * - nginx: Newer firmware with /us/archives.php endpoint
 * - mqx: Older Freescale MQX firmware with POST-based CGI endpoints
 */
async function detectFirmwareType(
  ipAddress: string,
  port: number = 80
): Promise<FirmwareType> {
  const baseUrl = `http://${ipAddress}:${port}`;
  log('DEBUG', `Detecting firmware type`, { ipAddress, port });

  try {
    const response = await autoclaveRequest(`${baseUrl}/`, {
      method: 'HEAD',
      timeout: DEFAULT_TIMEOUT,
    });

    const server = getHeader(response, 'server')?.toLowerCase() || '';
    log('DEBUG', `Server header: ${server}`);

    if (server.includes('nginx')) {
      return 'nginx';
    } else if (server.includes('mqx') || server.includes('freescale')) {
      return 'mqx';
    }

    // Fallback: try to detect by checking if /us/archives.php exists
    try {
      const archivesResponse = await autoclaveRequest(`${baseUrl}/us/archives.php`, {
        method: 'HEAD',
        timeout: DEFAULT_TIMEOUT,
      });

      if (archivesResponse.ok) {
        return 'nginx';
      }
    } catch {
      // archives.php doesn't exist, likely MQX
    }

    return 'mqx'; // Default to older firmware if unsure
  } catch (error) {
    log('DEBUG', `Failed to detect firmware type, defaulting to mqx`, { error });
    return 'mqx';
  }
}

// Cache for MQX firmware full cycle data (GET returns all data at once)
const mqxCycleDataCache = new Map<string, AutoclaveCycleIndex[]>();

/**
 * Try to list scilog files in a directory using file_reader.php
 * This is used for MQX firmware which doesn't return day/cycle details in cycles.cgi
 */
async function listScilogFilesInDirectory(
  ipAddress: string,
  port: number,
  dirPath: string
): Promise<string[]> {
  const baseUrl = `http://${ipAddress}:${port}`;
  log('DEBUG', `Listing scilog files in directory`, { dirPath });

  try {
    // Try file_reader.php with the directory path
    const url = `${baseUrl}/data/file_reader.php?filename=${encodeURIComponent(dirPath)}`;
    const response = await autoclaveRequest(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: DEFAULT_TIMEOUT,
    });

    if (!response.ok) {
      log('DEBUG', `file_reader.php returned ${response.status} for ${dirPath}`);
      return [];
    }

    const text = await response.text();
    log('DEBUG', `file_reader.php response for ${dirPath}`, { length: text.length, preview: text.substring(0, 500) });

    // Look for .txt files that match our pattern: S{YYYYMMDD}_{cyclenum}_{serial}.txt
    const fileMatches = text.match(/S\d{8}_\d+_[A-Z0-9]+\.txt/gi) || [];
    log('DEBUG', `Found ${fileMatches.length} scilog files in directory ${dirPath}`);

    return Array.from(new Set(fileMatches)); // Remove duplicates
  } catch (error) {
    log('DEBUG', `Failed to list files in ${dirPath}`, { error });
    return [];
  }
}

/**
 * Extract cycle info from a scilog filename
 * Format: S{YYYYMMDD}_{cyclenum}_{serial}.txt
 * Example: S20250102_00123_710123B00004.txt -> { day: '02', cycleNumber: '00123' }
 */
function extractCycleInfoFromFilename(filename: string): { day: string; cycleNumber: string } | null {
  const match = filename.match(/^S\d{4}(\d{2})(\d{2})_(\d+)_[A-Z0-9]+\.txt$/i);
  if (!match) return null;

  const [, _month, day, cycleNumber] = match;
  return { day, cycleNumber };
}

/**
 * Fetch month cycles using the full index from cycles.cgi GET (for older MQX firmware)
 *
 * MQX firmware returns all cycle data in the initial GET request to cycles.cgi.
 * The POST method returns empty arrays, so we need to use the cached GET data.
 * If days data is not in the index, we try to discover cycles by listing files.
 */
async function fetchMonthCyclesMQX(
  ipAddress: string,
  port: number,
  year: string,
  month: string
): Promise<{ day: string; cycles: string[] }[]> {
  const paddedMonth = month.padStart(2, '0');
  const cacheKey = `${ipAddress}:${port}`;
  log('DEBUG', `Fetching month cycles for MQX firmware`, { ipAddress, port, year, month, paddedMonth });

  // Check if we have cached data from the initial GET request
  let cycleIndex = mqxCycleDataCache.get(cacheKey);

  if (!cycleIndex) {
    // Fetch the full index - MQX firmware returns all data in one GET
    log('DEBUG', `No cached MQX data, fetching full index`);
    cycleIndex = await fetchAvailableCycles(ipAddress, port);
    mqxCycleDataCache.set(cacheKey, cycleIndex);
  }

  // Find the year and month in the index
  const yearData = cycleIndex.find((y) => y.year === year);
  if (!yearData) {
    log('WARN', `MQX: Year ${year} not found in index`, { availableYears: cycleIndex.map(y => y.year) });
    return [];
  }

  // Match month with flexible padding
  const monthData = yearData.months.find((m) =>
    m.month === paddedMonth || m.month === month || m.month.padStart(2, '0') === paddedMonth
  );

  if (!monthData) {
    log('WARN', `MQX: Month ${paddedMonth} not found in year ${year}`, {
      availableMonths: yearData.months.map(m => m.month)
    });
    return [];
  }

  // Check if days data is already embedded in the index
  if (monthData.days && monthData.days.length > 0) {
    log('DEBUG', `MQX: Using embedded days data from index`, {
      dayCount: monthData.days.length,
      days: monthData.days.map(d => ({ day: d.day, cycleCount: d.cycles.length }))
    });
    return monthData.days.map((d) => ({
      day: d.day,
      cycles: d.cycles,
    }));
  }

  // No days data in index - try file-based discovery approach
  log('INFO', `MQX: No days data in index for ${year}/${paddedMonth}, trying file-based discovery`);

  // Try to discover cycles by listing the month directory
  const monthDirPath = `${SCILOG_BASE_PATH}/${year}/${paddedMonth}`;
  const monthDirFiles = await listScilogFilesInDirectory(ipAddress, port, monthDirPath);

  if (monthDirFiles.length > 0) {
    log('INFO', `MQX: Found ${monthDirFiles.length} files via directory listing`);

    // Group files by day
    const dayMap = new Map<string, string[]>();
    for (const file of monthDirFiles) {
      const info = extractCycleInfoFromFilename(file);
      if (info) {
        if (!dayMap.has(info.day)) {
          dayMap.set(info.day, []);
        }
        dayMap.get(info.day)!.push(info.cycleNumber);
      }
    }

    // Convert to array format
    const result: { day: string; cycles: string[] }[] = [];
    dayMap.forEach((cycles, day) => {
      result.push({ day, cycles: cycles.sort() });
    });

    log('INFO', `MQX: File-based discovery found ${result.length} days with cycles`);
    return result.sort((a, b) => parseInt(a.day) - parseInt(b.day));
  }

  // File-based approach didn't work, try listing each day directory (1-31)
  log('INFO', `MQX: Month directory listing failed, trying individual day directories`);
  const daysInMonth = new Date(parseInt(year), parseInt(paddedMonth), 0).getDate();
  const dayResults: { day: string; cycles: string[] }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = d.toString().padStart(2, '0');
    const dayDirPath = `${SCILOG_BASE_PATH}/${year}/${paddedMonth}/${dayStr}`;
    const dayFiles = await listScilogFilesInDirectory(ipAddress, port, dayDirPath);

    if (dayFiles.length > 0) {
      const cycles: string[] = [];
      for (const file of dayFiles) {
        const info = extractCycleInfoFromFilename(file);
        if (info) {
          cycles.push(info.cycleNumber);
        }
      }

      if (cycles.length > 0) {
        dayResults.push({ day: dayStr, cycles: cycles.sort() });
      }
    }
  }

  if (dayResults.length > 0) {
    log('INFO', `MQX: Day-by-day discovery found ${dayResults.length} days with cycles`);
    return dayResults.sort((a, b) => parseInt(a.day) - parseInt(b.day));
  }

  // Last resort: try POST to cycles.cgi (may not work on all MQX versions)
  log('DEBUG', `MQX: File-based discovery found nothing, trying POST fallback`);
  const baseUrl = `http://${ipAddress}:${port}`;
  const timestamp = Date.now();

  try {
    const response = await autoclaveRequest(`${baseUrl}/data/cycles.cgi?${timestamp}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ year, month: paddedMonth }),
      timeout: DEFAULT_TIMEOUT,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    log('DEBUG', `MQX cycles.cgi POST response`, { dataLength: JSON.stringify(data).length });

    // Response format: [{ year, months: [{ month, days: [{ day, cycles: [...] }] }] }]
    if (Array.isArray(data) && data.length > 0) {
      const postYearData = data.find((y: { year: string }) => y.year === year);
      if (postYearData?.months) {
        const postMonthData = postYearData.months.find((m: { month: string }) =>
          m.month === paddedMonth || m.month === month || m.month.padStart(2, '0') === paddedMonth
        );
        if (postMonthData?.days) {
          return postMonthData.days.map((d: { day: string; cycles: string[] }) => ({
            day: d.day,
            cycles: d.cycles,
          }));
        }
      }
    }

    log('WARN', `MQX cycles.cgi POST returned no data for ${year}/${paddedMonth}`);
  } catch (error) {
    log('ERROR', `fetchMonthCyclesMQX POST fallback failed`, { error });
  }

  // Ultimate fallback: probe cycleData.cgi directly with cycle numbers
  // Uses smart binary search to find valid cycle number range first
  log('INFO', `MQX: Attempting smart cycle probing for ${year}/${paddedMonth}`);
  return probeCyclesForMonthMQX(ipAddress, port, year, month);
}

/**
 * Fetch cycle data using POST to cycleData.cgi (for older MQX firmware)
 *
 * MQX firmware expects POST with specific headers matching browser behavior
 */
async function fetchCycleDataMQX(
  ipAddress: string,
  port: number,
  year: string,
  month: string,
  day: string,
  cycleNumber: string
): Promise<AutoclaveCycleData | null> {
  const baseUrl = `http://${ipAddress}:${port}`;
  const timestamp = Date.now();
  // Pad cycle number to 5 digits as the browser does
  const paddedCycle = cycleNumber.padStart(5, '0');
  log('DEBUG', `Fetching cycle data via MQX POST`, { ipAddress, port, year, month, day, cycleNumber, paddedCycle });

  try {
    const response = await autoclaveRequest(`${baseUrl}/data/cycleData.cgi?${timestamp}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      // Body is JSON string (matching browser behavior)
      body: JSON.stringify({
        year,
        month: month.padStart(2, '0'),
        day: day.padStart(2, '0'),
        cycle: paddedCycle,
      }),
      timeout: DEFAULT_TIMEOUT * 2,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    log('DEBUG', `MQX cycleData.cgi response`, { succeeded: data?.succeeded, number: data?.number });

    if (data?.succeeded === false) {
      log('WARN', `Cycle data not found via MQX`, { year, month, day, cycleNumber });
      return null;
    }

    return data;
  } catch (error) {
    log('ERROR', `fetchCycleDataMQX failed`, { error });
    return null;
  }
}

// Cache for last known cycle number per autoclave (to speed up probing)
const lastKnownCycleNumberCache = new Map<string, number>();

/**
 * Probe for cycles in a given year/month by trying cycleData.cgi with various cycle numbers
 * This is used as a last resort for MQX firmware that doesn't support file listing
 *
 * Uses a smart probing strategy:
 * 1. Start from a cached last known cycle number if available
 * 2. Otherwise, use binary search to find the cycle number range
 * 3. Then probe within that range for the specific month
 *
 * Returns cycles found with their date information extracted from the response
 */
async function probeCyclesForMonthMQX(
  ipAddress: string,
  port: number,
  year: string,
  month: string
): Promise<{ day: string; cycles: string[] }[]> {
  const baseUrl = `http://${ipAddress}:${port}`;
  const paddedMonth = month.padStart(2, '0');
  const cacheKey = `${ipAddress}:${port}`;

  log('INFO', `MQX: Smart probing for cycles in ${year}/${paddedMonth}`);

  // First, find a valid cycle number using binary search or cached value
  let lastKnownCycle: number | undefined = lastKnownCycleNumberCache.get(cacheKey);

  if (!lastKnownCycle) {
    // Binary search to find a valid cycle number
    const foundCycle = await findValidCycleNumberMQX(ipAddress, port);
    if (foundCycle) {
      lastKnownCycle = foundCycle;
      lastKnownCycleNumberCache.set(cacheKey, foundCycle);
      log('INFO', `MQX: Found valid cycle number ${foundCycle} via binary search`);
    } else {
      log('WARN', `MQX: Could not find any valid cycle numbers`);
      return [];
    }
  }

  // Now probe around the known cycle number to find cycles for this specific month
  // We need to search both backward and forward since cycles are numbered sequentially
  const foundCycles = new Map<string, string[]>();
  const targetDate = `${year}-${paddedMonth}`;

  // Probe backward and forward from the known cycle
  const maxProbesPerDirection = 500;
  const batchSize = 10; // Check in batches for efficiency

  // Search backward first (older cycles)
  let backwardCursor = lastKnownCycle;
  let backwardMisses = 0;
  const maxConsecutiveMisses = 50;

  log('DEBUG', `MQX: Probing backward from cycle ${lastKnownCycle}`);

  while (backwardMisses < maxConsecutiveMisses && backwardCursor > 0 && (lastKnownCycle - backwardCursor) < maxProbesPerDirection) {
    const cycleStr = backwardCursor.toString();

    try {
      const data = await probeSingleCycleMQX(baseUrl, year, paddedMonth, cycleStr);

      if (data && data.date) {
        backwardMisses = 0;

        // Check if this cycle is in our target month
        if (data.date.startsWith(targetDate)) {
          const dayPart = data.date.split('-')[2];
          if (!foundCycles.has(dayPart)) {
            foundCycles.set(dayPart, []);
          }
          foundCycles.get(dayPart)!.push(cycleStr.padStart(5, '0'));
          log('DEBUG', `MQX probe: Found cycle ${cycleStr} on ${data.date}`);
        } else if (data.date < targetDate) {
          // We've gone past our target month, stop searching backward
          log('DEBUG', `MQX probe: Reached cycle from ${data.date}, stopping backward search`);
          break;
        }
      } else {
        backwardMisses++;
      }
    } catch {
      backwardMisses++;
    }

    backwardCursor--;
  }

  // Search forward (newer cycles)
  let forwardCursor = lastKnownCycle + 1;
  let forwardMisses = 0;

  log('DEBUG', `MQX: Probing forward from cycle ${forwardCursor}`);

  while (forwardMisses < maxConsecutiveMisses && (forwardCursor - lastKnownCycle) < maxProbesPerDirection) {
    const cycleStr = forwardCursor.toString();

    try {
      const data = await probeSingleCycleMQX(baseUrl, year, paddedMonth, cycleStr);

      if (data && data.date) {
        forwardMisses = 0;

        // Update cache with the highest known cycle
        if (forwardCursor > (lastKnownCycleNumberCache.get(cacheKey) || 0)) {
          lastKnownCycleNumberCache.set(cacheKey, forwardCursor);
        }

        // Check if this cycle is in our target month
        if (data.date.startsWith(targetDate)) {
          const dayPart = data.date.split('-')[2];
          if (!foundCycles.has(dayPart)) {
            foundCycles.set(dayPart, []);
          }
          foundCycles.get(dayPart)!.push(cycleStr.padStart(5, '0'));
          log('DEBUG', `MQX probe: Found cycle ${cycleStr} on ${data.date}`);
        } else if (data.date > targetDate + '-31') {
          // We've gone past our target month, stop searching forward
          log('DEBUG', `MQX probe: Reached cycle from ${data.date}, stopping forward search`);
          break;
        }
      } else {
        forwardMisses++;
      }
    } catch {
      forwardMisses++;
    }

    forwardCursor++;
  }

  // Convert to the expected format
  const result: { day: string; cycles: string[] }[] = [];
  foundCycles.forEach((cycles, day) => {
    result.push({
      day,
      cycles: cycles.sort((a, b) => parseInt(a) - parseInt(b)),
    });
  });

  log('INFO', `MQX probe: Found ${result.length} days with ${result.reduce((sum, d) => sum + d.cycles.length, 0)} total cycles in ${year}/${paddedMonth}`);
  return result.sort((a, b) => parseInt(a.day) - parseInt(b.day));
}

/**
 * Probe a single cycle number and return the data if found
 *
 * MQX firmware expects POST with specific headers matching browser behavior.
 * If year/month are not provided, uses current date as placeholder (firmware
 * looks up cycle by number, date params may be optional hints).
 */
async function probeSingleCycleMQX(
  baseUrl: string,
  year: string,
  month: string,
  cycleNumber: string
): Promise<AutoclaveCycleData | null> {
  try {
    const timestamp = Date.now();
    // Pad cycle number to 5 digits as the browser does
    const paddedCycle = cycleNumber.padStart(5, '0');

    // Use current date as fallback if not provided
    const now = new Date();
    const useYear = year || now.getFullYear().toString();
    const useMonth = month || (now.getMonth() + 1).toString().padStart(2, '0');
    const useDay = now.getDate().toString().padStart(2, '0');

    const response = await autoclaveRequest(`${baseUrl}/data/cycleData.cgi?${timestamp}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      // Body is JSON string (matching browser behavior)
      body: JSON.stringify({
        year: useYear,
        month: useMonth,
        day: useDay,
        cycle: paddedCycle,
      }),
      timeout: DEFAULT_TIMEOUT,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as AutoclaveCycleData;

    if (data?.succeeded === false || !data?.date) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Find a valid cycle number using binary search
 * This helps find the approximate range of cycle numbers on the autoclave
 */
async function findValidCycleNumberMQX(
  ipAddress: string,
  port: number
): Promise<number | null> {
  const baseUrl = `http://${ipAddress}:${port}`;

  log('DEBUG', `MQX: Binary searching for valid cycle number`);

  // Try common starting points first (many autoclaves have cycles in hundreds/thousands)
  // Based on user data showing cycle 01879, try higher numbers first
  const quickProbes = [1900, 1800, 1500, 1000, 2000, 500, 100, 5000, 10000];

  for (const probe of quickProbes) {
    const data = await probeSingleCycleMQX(baseUrl, '', '', probe.toString());
    if (data) {
      log('DEBUG', `MQX: Quick probe found valid cycle at ${probe}`);
      return probe;
    }
  }

  // If quick probes fail, do binary search between 1 and 50000
  let low = 1;
  let high = 50000;
  let lastValidCycle: number | null = null;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const data = await probeSingleCycleMQX(baseUrl, '', '', mid.toString());

    if (data) {
      lastValidCycle = mid;
      // Found a valid cycle, search for higher numbers
      low = mid + 1;
      log('DEBUG', `MQX: Binary search found valid cycle at ${mid}, searching higher`);
    } else {
      // No cycle at this number, search lower
      high = mid - 1;
    }

    // Limit iterations
    if (high - low > 10000 && lastValidCycle) {
      break; // We found something, that's good enough
    }
  }

  return lastValidCycle;
}

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

  try {
    const response = await autoclaveRequest(`${baseUrl}/us/archives.php`, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: DEFAULT_TIMEOUT * 2,
    });

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

  try {
    // First try: file_reader.php with directory path
    const url = `${baseUrl}/data/file_reader.php?filename=${encodeURIComponent(dirPath)}`;
    log('DEBUG', `Fetching directory listing from ${url}`);

    const response = await autoclaveRequest(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: DEFAULT_TIMEOUT,
    });

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

  try {
    // Fetch the archives page - it might have a date selector or list all files
    const url = `${baseUrl}/us/archives.php`;
    log('DEBUG', `Fetching archives page ${url}`);

    const response = await autoclaveRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: DEFAULT_TIMEOUT,
    });

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
    log('DEBUG', `Fetching cycles index from ${baseUrl}/data/cycles.cgi`);
    const startTime = Date.now();

    const response = await autoclaveRequest(`${baseUrl}/data/cycles.cgi`, {
      method: 'GET',
      timeout: DEFAULT_TIMEOUT,
    });

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
 *
 * Note: MQX firmware requires specific headers and URL format to respond properly
 */
export async function fetchAvailableCycles(
  ipAddress: string,
  port: number = 80
): Promise<AutoclaveCycleIndex[]> {
  const baseUrl = `http://${ipAddress}:${port}`;
  const timestamp = Date.now();
  log('DEBUG', `Fetching available cycles`, { ipAddress, port });

  // Build POST body with current date - MQX firmware returns full day/cycle data
  // only when year/month/day params are provided
  const now = new Date();
  const postBody = JSON.stringify({
    year: now.getFullYear().toString(),
    month: (now.getMonth() + 1).toString().padStart(2, '0'),
    day: now.getDate().toString().padStart(2, '0'),
  });

  const startTime = Date.now();
  // MQX firmware expects POST with specific headers (matching browser behavior)
  const response = await autoclaveRequest(`${baseUrl}/data/cycles.cgi?${timestamp}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: postBody,
    timeout: DEFAULT_TIMEOUT,
  });

  log('DEBUG', `fetchAvailableCycles response in ${Date.now() - startTime}ms`, { status: response.status });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const rawText = await response.text();
  log('DEBUG', `fetchAvailableCycles raw response (first 500 chars)`, { rawText: rawText.substring(0, 500) });

  // Try to parse as JSON
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    log('ERROR', `fetchAvailableCycles failed to parse JSON`, { error: e, rawText: rawText.substring(0, 200) });
    return [];
  }

  log('DEBUG', `fetchAvailableCycles parsed ${data?.length || 0} years`);

  // Log the structure of the first year to understand the data format
  if (data?.length > 0) {
    const firstYear = data[0];
    const lastYear = data[data.length - 1];
    log('INFO', `fetchAvailableCycles data structure`, {
      firstYear: firstYear.year,
      firstYearMonths: firstYear.months?.length,
      firstMonthHasDays: firstYear.months?.[0]?.days !== undefined,
      firstMonthSample: firstYear.months?.[0],
      lastYear: lastYear.year,
      lastMonthSample: lastYear.months?.[lastYear.months?.length - 1],
    });
  }

  return data;
}

/**
 * Fetch available cycles for a specific month (with day/cycle details)
 *
 * Supports both newer (nginx) and older (MQX) firmware versions:
 * - nginx: Uses archives.php to get all cycles
 * - mqx: Uses POST to cycles.cgi with year/month params
 */
export async function fetchMonthCycles(
  ipAddress: string,
  port: number,
  year: string,
  month: string
): Promise<{ day: string; cycles: string[] }[]> {
  log('INFO', `Fetching month cycles`, { ipAddress, port, year, month });

  // Detect firmware type
  const firmwareType = await detectFirmwareType(ipAddress, port);
  log('INFO', `Detected firmware type for ${ipAddress}: ${firmwareType}`);

  // For older MQX firmware, use POST to cycles.cgi
  if (firmwareType === 'mqx') {
    return fetchMonthCyclesMQX(ipAddress, port, year, month);
  }

  // For newer nginx firmware, use archives.php
  try {
    const allCycles = await fetchAllCyclesFromArchives(ipAddress, port);
    const monthCycles = filterCyclesByDate(allCycles, year, month);

    log('DEBUG', `Found ${monthCycles.length} cycles for ${year}/${month} from archives.php`);

    // Group by day
    const dayMap = new Map<string, string[]>();
    for (const cycle of monthCycles) {
      const date = new Date(cycle.cycle_start_time * 1000);
      const dayStr = date.getDate().toString().padStart(2, '0');

      // Use the actual cycle_number field from the autoclave (matches the screen display)
      // Pad with leading zeros to 5 digits to match the autoclave's display format
      const cycleNum = cycle.cycle_number.toString().padStart(5, '0');

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
 * Supports both newer (nginx) and older (MQX) firmware versions:
 * - nginx: Uses cycleData.php with GET and file path
 * - mqx: Uses cycleData.cgi with POST and JSON body
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

  // Detect firmware type
  const firmwareType = await detectFirmwareType(ipAddress, port);
  log('DEBUG', `Detected firmware type for cycle data: ${firmwareType}`);

  // For older MQX firmware, use POST to cycleData.cgi
  if (firmwareType === 'mqx') {
    return fetchCycleDataMQX(ipAddress, port, year, month, day, cycleNumber);
  }

  // For newer nginx firmware, use cycleData.php with file path
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

    const response = await autoclaveRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/javascript, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: DEFAULT_TIMEOUT * 2,
    });

    log('DEBUG', `fetchCycleData response in ${Date.now() - startTime}ms`, { status: response.status });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    log('DEBUG', `fetchCycleData parsed`, { cycleNumber: data?.number, succeeded: data?.succeeded });
    return data;
  } catch (error) {
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

  try {
    const jsonParams = JSON.stringify({
      year: parsed.year,
      month: parsed.month,
      day: parsed.day,
      cycle: parsed.cycleNumber,
    });

    const url = `${baseUrl}/data/cycleData.php?filename=${encodeURIComponent(cptFilename)}&t=${timestamp}&${encodeURIComponent(jsonParams)}`;

    const response = await autoclaveRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/javascript, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: DEFAULT_TIMEOUT * 2,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
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

  try {
    // Extract cycle number from filename
    const cycleNumMatch = cycleInfo.file_name.match(/_(\d+)_/);
    const cycleNumber = cycleNumMatch ? cycleNumMatch[1] : cycleInfo.cycle_number.toString();

    const jsonParams = JSON.stringify({ year, month, day, cycle: cycleNumber });
    const url = `${baseUrl}/data/cycleData.php?filename=${encodeURIComponent(cptFilename)}&t=${timestamp}&${encodeURIComponent(jsonParams)}`;

    log('DEBUG', `Fetching from ${url}`);
    const startTime = Date.now();

    const response = await autoclaveRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/javascript, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: DEFAULT_TIMEOUT * 2,
    });

    log('DEBUG', `fetchCycleDataFromInfo response in ${Date.now() - startTime}ms`, { status: response.status });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    log('DEBUG', `fetchCycleDataFromInfo parsed`, { cycleNumber: data?.number, succeeded: data?.succeeded });
    return data;
  } catch (error) {
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

  try {
    const url = `${baseUrl}/data/file_reader.php?filename=${encodeURIComponent(filename)}`;

    const response = await autoclaveRequest(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: DEFAULT_TIMEOUT,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
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
 * Supports both newer (nginx) and older (MQX) firmware versions
 */
export async function getLatestCycle(
  ipAddress: string,
  port: number = 80
): Promise<FlattenedCycle | null> {
  log('DEBUG', `Getting latest cycle`, { ipAddress, port });

  // Detect firmware type
  const firmwareType = await detectFirmwareType(ipAddress, port);
  log('DEBUG', `Detected firmware type for latest cycle: ${firmwareType}`);

  try {
    if (firmwareType === 'mqx') {
      // For MQX firmware, get the cycle index and find the latest month
      const index = await fetchAvailableCycles(ipAddress, port);
      if (!index.length) {
        log('DEBUG', `No cycles found in index`);
        return null;
      }

      // Get the latest year and month
      const latestYear = index[index.length - 1];
      const latestMonth = latestYear.months[latestYear.months.length - 1];

      // Fetch cycles for that month
      const monthCycles = await fetchMonthCyclesMQX(ipAddress, port, latestYear.year, latestMonth.month);
      if (!monthCycles.length) {
        log('DEBUG', `No cycles found in latest month`);
        return null;
      }

      // Get the latest day and cycle
      const latestDay = monthCycles[monthCycles.length - 1];
      const latestCycleNum = latestDay.cycles[latestDay.cycles.length - 1];

      log('DEBUG', `Latest MQX cycle: ${latestCycleNum} on ${latestYear.year}-${latestMonth.month}-${latestDay.day}`);

      return {
        year: latestYear.year,
        month: latestMonth.month,
        day: latestDay.day,
        cycleNumber: latestCycleNum,
        date: new Date(
          parseInt(latestYear.year),
          parseInt(latestMonth.month) - 1,
          parseInt(latestDay.day)
        ),
      };
    }

    // For nginx firmware, use archives.php
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
 *
 * For nginx firmware: Uses the cycles.cgi index + archives.php
 * For MQX firmware: Uses probing since cycles.cgi returns empty
 */
export async function flattenAllCycles(
  ipAddress: string,
  port: number = 80,
  sinceYear?: string,
  sinceMonth?: string
): Promise<FlattenedCycle[]> {
  log('INFO', `flattenAllCycles starting`, { ipAddress, port, sinceYear, sinceMonth });

  const index = await fetchAvailableCycles(ipAddress, port);
  log('INFO', `flattenAllCycles got index`, { ipAddress, yearCount: index.length, years: index.map(y => y.year) });

  // If index is empty, this is likely MQX firmware - use probing approach
  if (index.length === 0) {
    log('INFO', `flattenAllCycles: Empty index, using MQX probing approach`);
    return flattenAllCyclesByProbing(ipAddress, port, sinceYear, sinceMonth);
  }

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
      log('INFO', `flattenAllCycles got days for ${yearData.year}/${monthData.month}`, { dayCount: days.length, days: days.map(d => ({ day: d.day, cycleCount: d.cycles.length })) });

      for (const dayData of days) {
        for (const cycleNum of dayData.cycles) {
          const flattenedCycle = {
            year: yearData.year,
            month: monthData.month,
            day: dayData.day,
            cycleNumber: cycleNum,
            date: new Date(
              parseInt(yearData.year),
              parseInt(monthData.month) - 1,
              parseInt(dayData.day)
            ),
          };

          cycles.push(flattenedCycle);
        }
      }
    }
  }

  log('INFO', `flattenAllCycles returning ${cycles.length} total cycles`);
  return cycles;
}

/**
 * Flatten all cycles by probing cycleData.cgi directly (for MQX firmware)
 *
 * MQX firmware doesn't have a working cycles.cgi index, so we need to:
 * 1. Find a valid cycle number using binary search
 * 2. Probe backward and forward to find all cycles
 * 3. Extract date info from each cycle's response
 */
async function flattenAllCyclesByProbing(
  ipAddress: string,
  port: number,
  sinceYear?: string,
  sinceMonth?: string
): Promise<FlattenedCycle[]> {
  const baseUrl = `http://${ipAddress}:${port}`;
  const cacheKey = `${ipAddress}:${port}`;

  log('INFO', `MQX probing: Starting cycle discovery for ${ipAddress}`);

  // First, find the highest valid cycle number
  let highestKnown = lastKnownCycleNumberCache.get(cacheKey);

  if (!highestKnown) {
    // Binary search to find a valid cycle
    highestKnown = await findValidCycleNumberMQX(ipAddress, port) ?? undefined;
    if (highestKnown) {
      lastKnownCycleNumberCache.set(cacheKey, highestKnown);
      log('INFO', `MQX probing: Found valid cycle number ${highestKnown}`);
    } else {
      log('WARN', `MQX probing: Could not find any valid cycle numbers`);
      return [];
    }
  }

  // Now probe to find the actual highest cycle number
  let currentHighest = highestKnown;
  let consecutiveMisses = 0;

  // Search upward to find the highest
  while (consecutiveMisses < 20) {
    const nextCycle = currentHighest + 1;
    const data = await probeSingleCycleMQX(baseUrl, '', '', nextCycle.toString());
    if (data && data.date) {
      currentHighest = nextCycle;
      consecutiveMisses = 0;
      lastKnownCycleNumberCache.set(cacheKey, currentHighest);
    } else {
      consecutiveMisses++;
    }
  }

  log('INFO', `MQX probing: Highest cycle number is approximately ${currentHighest}`);

  // Now collect cycles by probing backward from the highest
  const cycles: FlattenedCycle[] = [];
  let cursor = currentHighest;
  consecutiveMisses = 0;
  const maxMisses = 100; // Allow gaps in cycle numbers
  const maxCycles = 1000; // Limit to prevent infinite loops

  while (consecutiveMisses < maxMisses && cursor > 0 && cycles.length < maxCycles) {
    const cycleStr = cursor.toString();
    const data = await probeSingleCycleMQX(baseUrl, '', '', cycleStr);

    if (data && data.date) {
      consecutiveMisses = 0;

      // Parse date from response (format: "2026-01-05")
      const dateParts = data.date.split('-');
      if (dateParts.length === 3) {
        const [year, month, day] = dateParts;

        // Apply filters if specified
        if (sinceYear && year < sinceYear) {
          log('DEBUG', `MQX probing: Reached year ${year}, stopping (filter: ${sinceYear})`);
          break;
        }
        if (sinceYear && year === sinceYear && sinceMonth && month < sinceMonth) {
          cursor--;
          continue;
        }

        cycles.push({
          year,
          month,
          day,
          cycleNumber: cycleStr.padStart(5, '0'),
          date: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
        });

        log('DEBUG', `MQX probing: Found cycle #${cycleStr} on ${data.date}`);
      }
    } else {
      consecutiveMisses++;
    }

    cursor--;
  }

  log('INFO', `MQX probing: Found ${cycles.length} cycles total`);

  // Return in chronological order (oldest first)
  return cycles.reverse();
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

/**
 * Fetch cycles for a specific date range.
 *
 * This is the simplest entry point - it detects firmware and fetches cycles
 * for the requested dates directly without complex probing.
 *
 * @param range - 'today' | 'yesterday' | 'week' | 'month'
 *   - today: Only today's cycles
 *   - yesterday: Only yesterday's cycles (NOT including today)
 *   - week: Last 7 days (NOT including today)
 *   - month: Last 30 days (NOT including today)
 */
export async function fetchCyclesForRange(
  ipAddress: string,
  port: number = 80,
  range: 'today' | 'yesterday' | 'week' | 'month'
): Promise<FlattenedCycle[]> {
  log('INFO', `fetchCyclesForRange`, { ipAddress, port, range });

  const firmwareType = await detectFirmwareType(ipAddress, port);
  log('INFO', `Detected firmware: ${firmwareType}`);

  // Calculate date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate: Date;
  let endDate: Date;

  switch (range) {
    case 'today':
      startDate = new Date(today);
      endDate = new Date(today);
      break;
    case 'yesterday':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 1);
      endDate = new Date(startDate);
      break;
    case 'week':
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() - 1); // Yesterday
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() - 1); // Yesterday
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      break;
  }

  log('INFO', `Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

  if (firmwareType === 'nginx') {
    return fetchCyclesForRangeNginx(ipAddress, port, startDate, endDate);
  } else {
    return fetchCyclesForRangeMQX(ipAddress, port, startDate, endDate);
  }
}

/**
 * Fetch cycles for a date range from nginx firmware (archives.php)
 */
async function fetchCyclesForRangeNginx(
  ipAddress: string,
  port: number,
  startDate: Date,
  endDate: Date
): Promise<FlattenedCycle[]> {
  // Nginx firmware has all cycles in archives.php - fetch once and filter
  const allCycles = await fetchAllCyclesFromArchives(ipAddress, port);

  if (!allCycles.length) {
    log('WARN', 'No cycles found in archives.php');
    return [];
  }

  const cycles: FlattenedCycle[] = [];

  for (const cycle of allCycles) {
    const cycleDate = new Date(cycle.cycle_start_time * 1000);
    cycleDate.setHours(0, 0, 0, 0);

    if (cycleDate >= startDate && cycleDate <= endDate) {
      const year = cycleDate.getFullYear().toString();
      const month = (cycleDate.getMonth() + 1).toString().padStart(2, '0');
      const day = cycleDate.getDate().toString().padStart(2, '0');
      const cycleNum = cycle.cycle_number.toString().padStart(5, '0');

      cycles.push({
        year,
        month,
        day,
        cycleNumber: cycleNum,
        date: cycleDate,
      });
    }
  }

  log('INFO', `nginx: Found ${cycles.length} cycles in date range`);
  return cycles.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Fetch cycles for a date range from MQX firmware (cycles.cgi POST)
 */
async function fetchCyclesForRangeMQX(
  ipAddress: string,
  port: number,
  startDate: Date,
  endDate: Date
): Promise<FlattenedCycle[]> {
  const baseUrl = `http://${ipAddress}:${port}`;
  const cycles: FlattenedCycle[] = [];

  // Collect unique year/month pairs in the range
  const monthsToFetch = new Set<string>();
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const year = cursor.getFullYear().toString();
    const month = (cursor.getMonth() + 1).toString().padStart(2, '0');
    monthsToFetch.add(`${year}-${month}`);
    cursor.setMonth(cursor.getMonth() + 1);
    cursor.setDate(1); // Move to first of next month
  }
  // Also add the endDate's month in case the loop missed it
  monthsToFetch.add(`${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}`);

  log('INFO', `MQX: Fetching months: ${[...monthsToFetch].join(', ')}`);

  for (const yearMonth of monthsToFetch) {
    const [year, month] = yearMonth.split('-');
    // For each day in this month within our range, send POST to get cycle data
    const day = startDate > new Date(parseInt(year), parseInt(month) - 1, 1)
      ? startDate.getDate().toString().padStart(2, '0')
      : '01';

    try {
      const timestamp = Date.now();
      const postBody = JSON.stringify({ year, month, day });

      const response = await autoclaveRequest(`${baseUrl}/data/cycles.cgi?${timestamp}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: postBody,
        timeout: DEFAULT_TIMEOUT,
      });

      if (!response.ok) {
        log('WARN', `MQX cycles.cgi returned ${response.status} for ${year}/${month}`);
        continue;
      }

      const rawText = await response.text();
      log('DEBUG', `MQX cycles.cgi raw response length: ${rawText.length}`, { first200: rawText.substring(0, 200) });

      if (!rawText || rawText.trim().length === 0) {
        log('WARN', `MQX cycles.cgi returned empty response for ${year}/${month}`);
        continue;
      }

      let data: AutoclaveCycleIndex[];
      try {
        data = JSON.parse(rawText) as AutoclaveCycleIndex[];
      } catch (parseErr) {
        log('ERROR', `MQX cycles.cgi JSON parse failed for ${year}/${month}`, { parseErr, first200: rawText.substring(0, 200) });
        continue;
      }

      if (!Array.isArray(data) || data.length === 0) {
        log('WARN', `MQX cycles.cgi returned empty array for ${year}/${month}`);
        continue;
      }

      // Extract cycles from the response
      for (const yearData of data) {
        for (const monthData of yearData.months) {
          if (!monthData.days) continue;
          for (const dayData of monthData.days) {
            const cycleDate = new Date(
              parseInt(yearData.year),
              parseInt(monthData.month) - 1,
              parseInt(dayData.day)
            );
            cycleDate.setHours(0, 0, 0, 0);

            // Only include if within our date range
            if (cycleDate >= startDate && cycleDate <= endDate) {
              for (const cycleNum of dayData.cycles) {
                cycles.push({
                  year: yearData.year,
                  month: monthData.month,
                  day: dayData.day,
                  cycleNumber: cycleNum,
                  date: cycleDate,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      log('ERROR', `MQX: Failed to fetch cycles for ${year}/${month}`, { error });
    }
  }

  log('INFO', `MQX: Found ${cycles.length} cycles in date range`);
  return cycles.sort((a, b) => a.date.getTime() - b.date.getTime());
}
