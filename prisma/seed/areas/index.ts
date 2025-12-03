import type { SeedArea, SeedContext } from '../types';

// Import area seed functions
import { seedCore, clearCore } from './core.seed';
import { seedRoles, seedUsers, clearAuth } from './auth.seed';
import { seedStaff, clearStaff } from './staff.seed';
import { seedScheduling, clearScheduling } from './scheduling.seed';
import { seedPerformance, clearPerformance } from './performance.seed';
import { seedResources, clearResources } from './resources.seed';
import { seedPatients, clearPatients } from './patients.seed';
import { seedBooking, clearBooking } from './booking.seed';

/**
 * Registry of all seedable areas with their dependencies.
 *
 * Areas are organized by implementation phase:
 * - Phase 0: Core (clinics, system settings)
 * - Phase 1: Foundation (auth, staff, resources)
 * - Phase 2: Core Operations (patients, booking, communications)
 * - Phase 3: Clinical (treatment, imaging, lab)
 * - Phase 4: Financial (billing, insurance, compliance)
 * - Phase 5: Support (vendors)
 *
 * Dependencies ensure proper seeding order (e.g., users need roles first).
 */
export const areaRegistry: SeedArea[] = [
  // ============================================================================
  // PHASE 0: Core (always seeded first)
  // ============================================================================
  {
    id: 'core',
    name: 'Core (Clinics)',
    phase: 0,
    dependencies: [],
    seed: seedCore,
    clear: clearCore,
  },

  // ============================================================================
  // PHASE 1: Foundation
  // ============================================================================
  {
    id: 'auth:roles',
    name: 'Roles & Permissions',
    phase: 1,
    dependencies: ['core'],
    seed: seedRoles,
    clear: clearAuth,
  },
  {
    id: 'auth:users',
    name: 'Users',
    phase: 1,
    dependencies: ['auth:roles', 'core'],
    seed: seedUsers,
  },
  {
    id: 'staff',
    name: 'Staff Profiles',
    phase: 1,
    dependencies: ['auth:users'],
    seed: seedStaff,
    clear: clearStaff,
  },
  {
    id: 'scheduling',
    name: 'Scheduling & Time Management',
    phase: 1,
    dependencies: ['staff'],
    seed: seedScheduling,
    clear: clearScheduling,
  },
  {
    id: 'performance',
    name: 'Performance & Training',
    phase: 1,
    dependencies: ['staff'],
    seed: seedPerformance,
    clear: clearPerformance,
  },
  {
    id: 'resources',
    name: 'Resources (Equipment)',
    phase: 1,
    dependencies: ['core', 'auth:users'],
    seed: seedResources,
    clear: clearResources,
  },

  // ============================================================================
  // PHASE 2: Core Operations
  // ============================================================================
  {
    id: 'patients',
    name: 'Patients (Basic)',
    phase: 2,
    dependencies: ['core', 'auth:users'],
    seed: seedPatients,
    clear: clearPatients,
    // NOTE: This is a temporary basic seeder for booking testing.
    // Will be expanded when Patient Management area is implemented.
  },
  {
    id: 'booking',
    name: 'Booking (Appointment Types & Appointments)',
    phase: 2,
    dependencies: ['core', 'auth:users', 'staff', 'resources', 'patients'],
    seed: seedBooking,
    clear: clearBooking,
  },

  // ============================================================================
  // PHASE 3: Clinical
  // ============================================================================
  // Areas to be added: treatment, imaging, lab

  // ============================================================================
  // PHASE 4: Financial
  // ============================================================================
  // Areas to be added: billing, insurance, compliance

  // ============================================================================
  // PHASE 5: Support
  // ============================================================================
  // Areas to be added: vendors
];

/**
 * Get an area by ID
 */
export function getAreaById(id: string): SeedArea | undefined {
  return areaRegistry.find((a) => a.id === id);
}

/**
 * Get all areas up to and including a specific phase
 */
export function getAreasForPhase(maxPhase: number): SeedArea[] {
  return areaRegistry.filter((a) => a.phase <= maxPhase);
}

/**
 * Get all areas that match the given IDs, plus their dependencies
 */
export function getAreasWithDependencies(areaIds: string[]): SeedArea[] {
  const result = new Set<string>();

  function addWithDeps(id: string) {
    if (result.has(id)) return;

    const area = getAreaById(id);
    if (!area) {
      console.warn(`Area not found: ${id}`);
      return;
    }

    // Add dependencies first
    for (const depId of area.dependencies) {
      addWithDeps(depId);
    }

    result.add(id);
  }

  for (const id of areaIds) {
    addWithDeps(id);
  }

  // Return in registry order (which respects dependencies)
  return areaRegistry.filter((a) => result.has(a.id));
}

/**
 * Topological sort of areas based on dependencies.
 * Returns areas in an order safe for seeding.
 */
export function resolveSeedOrder(areas: SeedArea[]): SeedArea[] {
  const areaMap = new Map(areas.map((a) => [a.id, a]));
  const visited = new Set<string>();
  const result: SeedArea[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);

    const area = areaMap.get(id);
    if (!area) return;

    // Visit dependencies first
    for (const depId of area.dependencies) {
      if (areaMap.has(depId)) {
        visit(depId);
      }
    }

    result.push(area);
  }

  for (const area of areas) {
    visit(area.id);
  }

  return result;
}

/**
 * Get clear order (reverse of seed order)
 */
export function resolveClearOrder(areas: SeedArea[]): SeedArea[] {
  return [...resolveSeedOrder(areas)].reverse();
}
