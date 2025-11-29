#!/usr/bin/env tsx
/**
 * Database Dump Script
 *
 * Exports the current database to a BSON snapshot for fast restoration.
 *
 * Usage:
 *   npm run db:dump -- --name "phase-1-complete"
 *   npm run db:dump -- --name "dev-snapshot" --phase 1
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

interface DumpOptions {
  name: string;
  phase?: number;
  description?: string;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const options: DumpOptions = {
    name: `snapshot-${Date.now()}`,
    phase: 5,
    description: '',
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--name':
      case '-n':
        options.name = args[++i];
        break;
      case '--phase':
      case '-p':
        options.phase = parseInt(args[++i], 10);
        break;
      case '--description':
      case '-d':
        options.description = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        return;
    }
  }

  await createSnapshot(options);
}

async function createSnapshot(options: DumpOptions): Promise<void> {
  const mongoUri = process.env.DATABASE_URL;
  if (!mongoUri) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  // Parse database name from URI
  const dbName = new URL(mongoUri).pathname.slice(1);
  if (!dbName) {
    console.error('❌ Could not parse database name from DATABASE_URL');
    process.exit(1);
  }

  // Create snapshot directory
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const snapshotId = `${options.name}_${timestamp}`;
  const snapshotDir = path.join(process.cwd(), 'seeds', 'snapshots', snapshotId);

  if (!existsSync(snapshotDir)) {
    mkdirSync(snapshotDir, { recursive: true });
  }

  console.log(`\n📦 Creating database snapshot: ${snapshotId}\n`);

  try {
    // Run mongodump
    const dumpCommand = [
      'mongodump',
      `--uri="${mongoUri}"`,
      `--out="${snapshotDir}/data"`,
      '--gzip',
    ].join(' ');

    console.log('Running mongodump...');
    execSync(dumpCommand, { stdio: 'inherit' });

    // Get collection counts
    const counts = await getCollectionCounts(mongoUri, dbName);

    // Create metadata file
    const metadata = {
      snapshotId,
      name: options.name,
      createdAt: new Date().toISOString(),
      phase: options.phase,
      description: options.description || `Database snapshot created on ${new Date().toLocaleDateString()}`,
      databaseName: dbName,
      recordCounts: counts,
    };

    const metadataPath = path.join(snapshotDir, '_metadata.json');
    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // Also save to metadata directory for git tracking
    const metadataTrackPath = path.join(
      process.cwd(),
      'seeds',
      'metadata',
      `${snapshotId}.json`
    );
    writeFileSync(metadataTrackPath, JSON.stringify(metadata, null, 2));

    console.log(`\n✅ Snapshot created successfully!`);
    console.log(`\nLocation: ${snapshotDir}`);
    console.log(`Metadata: ${metadataTrackPath}`);
    console.log(`\nRecord counts:`);
    for (const [collection, count] of Object.entries(counts)) {
      console.log(`  ${collection}: ${count}`);
    }
    console.log('');
  } catch (error) {
    console.error('\n❌ Failed to create snapshot:', error);
    process.exit(1);
  }
}

async function getCollectionCounts(
  uri: string,
  dbName: string
): Promise<Record<string, number>> {
  // This would ideally use the MongoDB driver to get actual counts
  // For now, return a placeholder
  console.log('(Collection counts not implemented - requires MongoDB driver)');
  return {};
}

function printHelp(): void {
  console.log(`
📦 Database Dump Script

Creates a BSON snapshot of the current database for fast restoration.

Usage: npm run db:dump [options]

Options:
  -n, --name <name>          Snapshot name (default: timestamp)
  -p, --phase <n>            Phase level of this snapshot
  -d, --description <text>   Description for metadata
  -h, --help                 Show this help

Examples:
  npm run db:dump -- --name "phase-1-complete"
  npm run db:dump -- --name "dev-checkpoint" --phase 2

Requirements:
  - MongoDB Database Tools (mongodump) must be installed
  - DATABASE_URL environment variable must be set
`);
}

main().catch((error) => {
  console.error('Dump failed:', error);
  process.exit(1);
});
