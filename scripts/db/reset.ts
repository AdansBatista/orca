#!/usr/bin/env tsx
/**
 * Database Reset Script
 *
 * Drops the database and reseeds with fresh data.
 *
 * Usage:
 *   npm run db:reset                    # Reset with standard profile
 *   npm run db:reset -- --profile minimal
 *   npm run db:reset -- --snapshot phase-2-complete_20241129
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface ResetOptions {
  profile: string;
  snapshot: string | null;
  skipPush: boolean;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const options: ResetOptions = {
    profile: 'standard',
    snapshot: null,
    skipPush: false,
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--profile':
      case '-p':
        options.profile = args[++i];
        break;
      case '--snapshot':
      case '-s':
        options.snapshot = args[++i];
        break;
      case '--skip-push':
        options.skipPush = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        return;
    }
  }

  await resetDatabase(options);
}

async function resetDatabase(options: ResetOptions): Promise<void> {
  console.log('\n🔄 Resetting database...\n');

  const mongoUri = process.env.DATABASE_URL;
  if (!mongoUri) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  try {
    // Step 1: Drop the database
    console.log('Step 1: Dropping database...');
    const dbName = new URL(mongoUri).pathname.slice(1);

    // Use mongosh to drop the database
    try {
      execSync(`mongosh "${mongoUri}" --eval "db.dropDatabase()"`, {
        stdio: 'pipe',
      });
      console.log('  ✓ Database dropped\n');
    } catch {
      console.log('  ⚠ Could not drop database (may not exist)\n');
    }

    // Step 2: Push Prisma schema
    if (!options.skipPush) {
      console.log('Step 2: Pushing Prisma schema...');
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('  ✓ Schema pushed\n');
    }

    // Step 3: Seed or restore
    if (options.snapshot) {
      console.log(`Step 3: Restoring from snapshot: ${options.snapshot}...`);
      execSync(`npm run db:restore -- --snapshot ${options.snapshot}`, {
        stdio: 'inherit',
      });
    } else {
      console.log(`Step 3: Seeding with profile: ${options.profile}...`);
      execSync(`npm run db:seed -- --profile ${options.profile}`, {
        stdio: 'inherit',
      });
    }

    console.log('\n✅ Database reset complete!\n');
  } catch (error) {
    console.error('\n❌ Reset failed:', error);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
🔄 Database Reset Script

Drops the database and reseeds with fresh data.

Usage: npm run db:reset [options]

Options:
  -p, --profile <name>     Seed profile to use (default: standard)
                           Available: minimal, standard, full

  -s, --snapshot <name>    Restore from snapshot instead of seeding

  --skip-push              Skip Prisma schema push

  -h, --help               Show this help

Examples:
  npm run db:reset                              # Standard profile
  npm run db:reset -- --profile minimal         # Quick minimal reset
  npm run db:reset -- --snapshot dev-backup     # Restore from snapshot

This script performs:
  1. Drops the existing database
  2. Pushes the Prisma schema (creates collections)
  3. Seeds or restores data
`);
}

main().catch((error) => {
  console.error('Reset failed:', error);
  process.exit(1);
});
