/**
 * Lenient HTTP Client for Autoclave Communication
 *
 * Some older autoclave firmware (MQX/Freescale) sends HTTP responses with
 * malformed headers that Node.js's strict HTTP parser rejects. This module
 * provides a lenient HTTP client that can handle these responses.
 *
 * The key issue is that the MQX HTTP server sends headers with invalid
 * characters (like leading newlines), which causes Node.js fetch to fail
 * with "HPE_INVALID_HEADER_TOKEN" errors.
 */

import http from 'http';

interface LenientFetchOptions {
  method?: 'GET' | 'POST' | 'HEAD';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface LenientResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Map<string, string>;
  text: () => Promise<string>;
  json: <T = unknown>() => Promise<T>;
}

/**
 * Perform an HTTP request with lenient parsing
 * This uses Node.js's http module with insecureHTTPParser enabled
 */
export function lenientFetch(
  url: string,
  options: LenientFetchOptions = {}
): Promise<LenientResponse> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const timeout = options.timeout ?? 5000;

    const requestOptions: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      insecureHTTPParser: true, // Key: allows malformed headers
      timeout,
    };

    const req = http.request(requestOptions, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        const headers = new Map<string, string>();

        // Convert headers to Map
        for (const [key, value] of Object.entries(res.headers)) {
          if (typeof value === 'string') {
            headers.set(key.toLowerCase(), value);
          } else if (Array.isArray(value)) {
            headers.set(key.toLowerCase(), value.join(', '));
          }
        }

        const response: LenientResponse = {
          ok: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode || 0,
          statusText: res.statusMessage || '',
          headers,
          text: async () => body,
          json: async <T = unknown>() => JSON.parse(body) as T,
        };

        resolve(response);
      });

      res.on('error', reject);
    });

    req.on('error', reject);

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Helper to check if we need to use lenient parsing for a given server
 * Returns true for MQX/Freescale servers that have malformed headers
 */
export async function needsLenientParsing(ipAddress: string, port: number = 80): Promise<boolean> {
  try {
    // Try with standard fetch first
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    await fetch(`http://${ipAddress}:${port}/`, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return false; // Standard fetch works
  } catch (error) {
    if (error instanceof Error) {
      // Check if it's a parsing error
      const cause = (error as Error & { cause?: Error }).cause;
      if (cause?.message?.includes('Invalid header') ||
          cause?.message?.includes('HPE_INVALID')) {
        return true;
      }
    }
    // For other errors (network, timeout), we don't know
    // Default to false and let the caller handle the error
    return false;
  }
}
