#!/usr/bin/env tsx
/**
 * Database Restore Script
 *
 * Restores a database from a BSON snapshot.
 *
 * Usage:
 *   npm run db:restore -- --snapshot phase-1-complete_20241129
 *   npm run db:restore -- --list
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';

interface RestoreOptions {
  snapshot: string;
  drop: boolean;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const options: RestoreOptions = {
    snapshot: '',
    drop: true,
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--snapshot':
      case '-s':
        options.snapshot = args[++i];
        break;
      case '--no-drop':
        options.drop = false;
        break;
      case '--list':
      case '-l':
        listSnapshots();
        return;
      case '--help':
      case '-h':
        printHelp();
        return;
    }
  }

  if (!options.snapshot) {
    console.error('❌ Snapshot name required. Use --list to see available snapshots.');
    process.exit(1);
  }

  await restoreSnapshot(options);
}

async function restoreSnapshot(options: RestoreOptions): Promise<void> {
  const mongoUri = process.env.DATABASE_URL;
  if (!mongoUri) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const dbName = new URL(mongoUri).pathname.slice(1);
  const snapshotDir = path.join(process.cwd(), 'seeds', 'snapshots', options.snapshot);

  if (!existsSync(snapshotDir)) {
    console.error(`❌ Snapshot not found: ${options.snapshot}`);
    console.log('\nAvailable snapshots:');
    listSnapshots();
    process.exit(1);
  }

  // Read metadata
  const metadataPath = path.join(snapshotDir, '_metadata.json');
  let metadata: Record<string, unknown> = {};
  if (existsSync(metadataPath)) {
    metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
  }

  console.log(`\n📥 Restoring database from snapshot: ${options.snapshot}\n`);

  if (metadata.description) {
    console.log(`Description: ${metadata.description}`);
  }
  if (metadata.createdAt) {
    console.log(`Created: ${metadata.createdAt}`);
  }
  console.log('');

  try {
    // Build restore command
    const dataDir = path.join(snapshotDir, 'data', metadata.databaseName as string || dbName);

    const restoreCommand = [
      'mongorestore',
      `--uri="${mongoUri}"`,
      options.drop ? '--drop' : '',
      '--gzip',
      `"${dataDir}"`,
    ]
      .filter(Boolean)
      .join(' ');

    console.log('Running mongorestore...');
    execSync(restoreCommand, { stdio: 'inherit' });

    console.log(`\n✅ Database restored successfully from: ${options.snapshot}\n`);
  } catch (error) {
    console.error('\n❌ Failed to restore snapshot:', error);
    process.exit(1);
  }
}

function listSnapshots(): void {
  const snapshotsDir = path.join(process.cwd(), 'seeds', 'snapshots');

  if (!existsSync(snapshotsDir)) {
    console.log('\nNo snapshots directory found.');
    return;
  }

  const entries = readdirSync(snapshotsDir, { withFileTypes: true });
  const snapshots = entries.filter(
    (e) => e.isDirectory() && !e.name.startsWith('.')
  );

  if (snapshots.length === 0) {
    console.log('\nNo snapshots found.');
    return;
  }

  console.log('\n📋 Available Snapshots:\n');

  for (const snapshot of snapshots) {
    const metadataPath = path.join(snapshotsDir, snapshot.name, '_metadata.json');
    let info = '';

    if (existsSync(metadataPath)) {
      try {
        const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
        info = ` (Phase ${metadata.phase || '?'}, ${metadata.createdAt?.split('T')[0] || 'unknown date'})`;
      } catch {
        // Ignore metadata read errors
      }
    }

    console.log(`  ${snapshot.name}${info}`);
  }

  console.log('');
}

function printHelp(): void {
  console.log(`
📥 Database Restore Script

Restores the database from a BSON snapshot.

Usage: npm run db:restore [options]

Options:
  -s, --snapshot <name>   Name of snapshot to restore (required)
  --no-drop               Don't drop existing collections before restore
  -l, --list              List available snapshots
  -h, --help              Show this help

Examples:
  npm run db:restore -- --list
  npm run db:restore -- --snapshot phase-1-complete_20241129
  npm run db:restore -- -s dev-snapshot --no-drop

Requirements:
  - MongoDB Database Tools (mongorestore) must be installed
  - DATABASE_URL environment variable must be set
`);
}

main().catch((error) => {
  console.error('Restore failed:', error);
  process.exit(1);
});
