import type { SeedLogger } from '../types';

/**
 * Console-based seed logger with colored output and timing
 */
export class ConsoleLogger implements SeedLogger {
  private areaStartTimes: Map<string, number> = new Map();

  info(message: string): void {
    console.log(`  ${message}`);
  }

  success(message: string): void {
    console.log(`  ✓ ${message}`);
  }

  warn(message: string): void {
    console.log(`  ⚠ ${message}`);
  }

  error(message: string): void {
    console.log(`  ✗ ${message}`);
  }

  startArea(areaName: string): void {
    this.areaStartTimes.set(areaName, Date.now());
    console.log(`\n▶ Seeding ${areaName}...`);
  }

  endArea(areaName: string, count: number): void {
    const startTime = this.areaStartTimes.get(areaName);
    const duration = startTime ? Date.now() - startTime : 0;
    console.log(`  ✓ ${areaName} complete (${count} records, ${duration}ms)`);
    this.areaStartTimes.delete(areaName);
  }
}

/**
 * Silent logger for testing or CI environments
 */
export class SilentLogger implements SeedLogger {
  info(): void {}
  success(): void {}
  warn(): void {}
  error(): void {}
  startArea(): void {}
  endArea(): void {}
}

/**
 * Create appropriate logger based on environment
 */
export function createLogger(silent = false): SeedLogger {
  if (silent || process.env.SEED_SILENT === 'true') {
    return new SilentLogger();
  }
  return new ConsoleLogger();
}
