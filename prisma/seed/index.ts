import { PrismaClient } from '@prisma/client';
import type { SeedConfig, SeedContext } from './types';
import { defaultConfig, getProfile, mergeConfig } from './config';
import { createSeedContext } from './utils';
import {
  areaRegistry,
  getAreasForPhase,
  getAreasWithDependencies,
  resolveSeedOrder,
  resolveClearOrder,
} from './areas';

/**
 * Main seed orchestrator.
 * Coordinates seeding across all areas with dependency resolution.
 */
export async function seed(config: Partial<SeedConfig> = {}): Promise<void> {
  const finalConfig = mergeConfig(config);
  const db = new PrismaClient();

  try {
    await db.$connect();
    console.log('\n🌱 Orca Database Seeder\n');
    console.log(`Profile: ${finalConfig.mode}`);
    console.log(`Max Phase: ${finalConfig.maxPhase}`);
    console.log(`Clear Before Seed: ${finalConfig.clearBeforeSeed}`);
    console.log('');

    // Create seed context
    const ctx = createSeedContext(db, finalConfig);

    // Determine which areas to seed
    let areasToSeed = finalConfig.areas
      ? getAreasWithDependencies(finalConfig.areas)
      : getAreasForPhase(finalConfig.maxPhase);

    // Resolve seed order based on dependencies
    const orderedAreas = resolveSeedOrder(areasToSeed);

    console.log(`Areas to seed: ${orderedAreas.map((a) => a.id).join(', ')}\n`);

    // Clear existing data if configured
    if (finalConfig.clearBeforeSeed) {
      console.log('🗑️  Clearing existing data...\n');
      const clearOrder = resolveClearOrder(areasToSeed);

      for (const area of clearOrder) {
        if (area.clear) {
          ctx.logger.info(`Clearing ${area.name}...`);
          await area.clear(ctx);
        }
      }
      console.log('');
    }

    // Execute seeds in order
    console.log('📝 Seeding data...\n');
    for (const area of orderedAreas) {
      await area.seed(ctx);
    }

    // Summary
    console.log('\n✅ Seeding complete!\n');
    console.log('Summary:');
    const summary = ctx.idTracker.summary();
    for (const [model, count] of Object.entries(summary)) {
      console.log(`  ${model}: ${count}`);
    }
    console.log('');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

/**
 * Seed with a specific profile.
 */
export async function seedWithProfile(profileName: string): Promise<void> {
  const profile = getProfile(profileName);
  await seed(profile);
}

/**
 * Seed specific areas (plus their dependencies).
 */
export async function seedAreas(areaIds: string[]): Promise<void> {
  await seed({ areas: areaIds });
}

/**
 * Seed up to a specific phase.
 */
export async function seedPhase(maxPhase: number): Promise<void> {
  await seed({ maxPhase });
}

/**
 * List all available seed areas.
 */
export function listAreas(): void {
  console.log('\n📋 Available Seed Areas:\n');

  let currentPhase = -1;
  for (const area of areaRegistry) {
    if (area.phase !== currentPhase) {
      currentPhase = area.phase;
      console.log(`\nPhase ${currentPhase}:`);
    }
    const deps = area.dependencies.length > 0
      ? ` (deps: ${area.dependencies.join(', ')})`
      : '';
    console.log(`  ${area.id.padEnd(25)} ${area.name}${deps}`);
  }
  console.log('');
}

// Re-export for convenience
export { defaultConfig, getProfile, profiles } from './config';
export type { SeedConfig, SeedContext } from './types';
