#!/usr/bin/env tsx
/**
 * Database Seeder CLI
 *
 * Usage:
 *   npm run db:seed                    # Seed with standard profile
 *   npm run db:seed -- --profile minimal
 *   npm run db:seed -- --profile full
 *   npm run db:seed -- --area auth:users
 *   npm run db:seed -- --phase 2
 *   npm run db:seed -- --list
 *   npm run db:seed -- --no-clear
 *   npm run db:seed -- --help
 */

import { seed, seedWithProfile, seedAreas, seedPhase, listAreas, profiles } from '../../prisma/seed';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse arguments
  const options = {
    profile: 'standard',
    areas: [] as string[],
    phase: null as number | null,
    noClear: false,
    list: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--profile':
      case '-p':
        options.profile = args[++i];
        break;

      case '--area':
      case '-a':
        options.areas.push(args[++i]);
        break;

      case '--phase':
        options.phase = parseInt(args[++i], 10);
        break;

      case '--no-clear':
        options.noClear = true;
        break;

      case '--list':
      case '-l':
        options.list = true;
        break;

      case '--help':
      case '-h':
        options.help = true;
        break;

      default:
        if (!arg.startsWith('-')) {
          // Treat as profile name if no flag
          options.profile = arg;
        }
    }
  }

  // Show help
  if (options.help) {
    printHelp();
    return;
  }

  // List areas
  if (options.list) {
    listAreas();
    return;
  }

  // Seed specific areas
  if (options.areas.length > 0) {
    await seedAreas(options.areas);
    return;
  }

  // Seed up to specific phase
  if (options.phase !== null) {
    await seedPhase(options.phase);
    return;
  }

  // Seed with profile
  const config = {
    ...profiles[options.profile],
    clearBeforeSeed: !options.noClear,
  };

  await seed(config);
}

function printHelp(): void {
  console.log(`
🌱 Orca Database Seeder

Usage: npm run db:seed [options]

Options:
  -p, --profile <name>   Seed with a specific profile (default: standard)
                         Available: minimal, standard, full

  -a, --area <id>        Seed specific area(s), can be repeated
                         Dependencies are automatically included

  --phase <n>            Seed up to phase n (0-5)

  --no-clear             Don't clear existing data before seeding

  -l, --list             List all available seed areas

  -h, --help             Show this help message

Profiles:
  minimal    1 clinic, 5 users, 10 patients (fast dev reset)
  standard   1 clinic, 20 users, 50 patients (default)
  full       3 clinics, 30 users each, 200 patients (load testing)

Examples:
  npm run db:seed                        # Standard profile
  npm run db:seed -- --profile minimal   # Quick minimal seed
  npm run db:seed -- --area auth:users   # Seed only users (+ deps)
  npm run db:seed -- --phase 1           # Seed Phase 1 only
  npm run db:seed -- --no-clear          # Keep existing data

Default Credentials:
  Super Admin: admin@system.local / Password123!
  Clinic Admin: admin@main.smileortho.com / Password123!
`);
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
