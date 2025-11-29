import type { PrismaClient } from '@prisma/client';
import type { SeedConfig, SeedContext } from '../types';
import { IdTracker, createIdTracker } from './id-tracker';
import { createLogger } from './logger';

/**
 * Create a new seed context for use across all seed functions
 */
export function createSeedContext(
  db: PrismaClient,
  config: SeedConfig,
  options: { silent?: boolean } = {}
): SeedContext {
  return {
    db,
    config,
    idTracker: createIdTracker(),
    currentClinicId: null,
    logger: createLogger(options.silent),
  };
}

/**
 * Create a clinic-scoped context (for seeding within a specific clinic)
 */
export function withClinicScope(
  ctx: SeedContext,
  clinicId: string
): SeedContext {
  return {
    ...ctx,
    currentClinicId: clinicId,
  };
}
