import type { PrismaClient } from '@prisma/client';

/**
 * Seed configuration for controlling data volume and behavior
 */
export interface SeedConfig {
  /** Data counts per clinic */
  counts: {
    clinics: number;
    usersPerClinic: number;
    patientsPerClinic: number;
    staffPerClinic: number;
    appointmentsPerClinic: number;
  };
  /** Seeding mode affects data richness */
  mode: 'minimal' | 'standard' | 'full';
  /** Whether to clear existing data before seeding */
  clearBeforeSeed: boolean;
  /** Specific areas to seed (null = all available) */
  areas: string[] | null;
  /** Maximum phase to seed up to (1-5) */
  maxPhase: number;
}

/**
 * Context passed to all seed functions
 */
export interface SeedContext {
  /** Prisma client instance */
  db: PrismaClient;
  /** Current configuration */
  config: SeedConfig;
  /** ID tracker for managing relationships */
  idTracker: IdTracker;
  /** Current clinic ID being seeded (for multi-clinic support) */
  currentClinicId: string | null;
  /** Logger for progress output */
  logger: SeedLogger;
}

/**
 * ID Tracker interface for managing created record IDs
 */
export interface IdTracker {
  /** Add an ID to the tracker */
  add(model: string, id: string, clinicId?: string): void;
  /** Get all IDs for a model */
  getAll(model: string): string[];
  /** Get a random ID for a model */
  getRandom(model: string): string;
  /** Get the first ID for a model */
  getFirst(model: string): string;
  /** Get IDs filtered by clinic */
  getByClinic(model: string, clinicId: string): string[];
  /** Get a random ID for a model within a clinic */
  getRandomByClinic(model: string, clinicId: string): string;
  /** Check if any IDs exist for a model */
  has(model: string): boolean;
  /** Get count of IDs for a model */
  count(model: string): number;
  /** Clear all tracked IDs */
  clear(): void;
}

/**
 * Logger interface for seed progress
 */
export interface SeedLogger {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  startArea(areaName: string): void;
  endArea(areaName: string, count: number): void;
}

/**
 * Area seed function signature
 */
export type SeedFunction = (ctx: SeedContext) => Promise<void>;

/**
 * Clear function signature for removing area data
 */
export type ClearFunction = (ctx: SeedContext) => Promise<void>;

/**
 * Area definition in the registry
 */
export interface SeedArea {
  /** Unique identifier for the area (e.g., 'auth:users') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Implementation phase (0-5) */
  phase: number;
  /** IDs of areas that must be seeded first */
  dependencies: string[];
  /** Function to seed this area */
  seed: SeedFunction;
  /** Optional function to clear this area's data */
  clear?: ClearFunction;
}

/**
 * Factory options for creating records
 */
export interface FactoryOptions<T> {
  /** Override default field values */
  overrides?: Partial<T>;
  /** Number of records to create (for createMany) */
  count?: number;
  /** Traits to apply (predefined field combinations) */
  traits?: string[];
}

/**
 * Base factory context
 */
export interface FactoryContext {
  db: PrismaClient;
  clinicId: string;
  createdBy?: string;
  idTracker: IdTracker;
}

/**
 * Snapshot metadata stored alongside BSON dumps
 */
export interface SnapshotMetadata {
  /** Unique snapshot identifier */
  snapshotId: string;
  /** When the snapshot was created */
  createdAt: string;
  /** Prisma schema version (migration name) */
  prismaSchemaVersion: string;
  /** Orca application version */
  orcaVersion: string;
  /** Phase level of this snapshot */
  phase: number;
  /** Areas included in this snapshot */
  areas: string[];
  /** Record counts by collection */
  recordCounts: Record<string, number>;
  /** Description of this snapshot */
  description: string;
  /** MongoDB server version used */
  mongoVersion?: string;
}
