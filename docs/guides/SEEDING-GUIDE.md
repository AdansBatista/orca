# Database Seeding Guide

> Complete guide to creating and managing seed data for Orca

---

## Quick Start

```bash
# Seed with standard profile (1 clinic, 20 users, 50 patients)
npm run db:seed

# Quick minimal seed for fast dev resets
npm run db:seed -- --profile minimal

# Full reset (drop database + push schema + seed)
npm run db:reset
```

---

## Overview

Orca uses a **modular, factory-based seeding system** that:

- Generates realistic orthodontic practice data
- Supports incremental seeding by area/phase
- Enables BSON snapshots for fast database restoration
- Maintains proper relationships and multi-clinic isolation

---

## Directory Structure

```
prisma/
├── schema.prisma              # Prisma schema
├── seed.ts                    # Prisma seed entry point
└── seed/
    ├── index.ts               # Main orchestrator
    ├── config.ts              # Seed profiles
    ├── types.ts               # TypeScript interfaces
    │
    ├── factories/             # Model factories
    │   ├── base.factory.ts    # Abstract base class
    │   └── {model}.factory.ts # One per model
    │
    ├── fixtures/              # Static reference data
    │   ├── roles.fixture.ts
    │   ├── permissions.fixture.ts
    │   └── ortho-data.fixture.ts
    │
    ├── generators/            # Dynamic data generators
    │   └── ortho.generator.ts
    │
    ├── areas/                 # Area seed modules
    │   ├── index.ts           # Registry + dependencies
    │   ├── core.seed.ts
    │   ├── auth.seed.ts
    │   └── {area}.seed.ts
    │
    └── utils/
        ├── id-tracker.ts      # Relationship tracking
        ├── context.ts         # Seed context
        └── logger.ts          # Progress logging

scripts/db/
├── seed.ts                    # CLI entry point
├── dump.ts                    # Export to BSON
├── restore.ts                 # Restore from BSON
└── reset.ts                   # Full reset

seeds/
├── snapshots/                 # BSON dumps (gitignored)
└── metadata/                  # Snapshot metadata (tracked)
```

---

## Seed Profiles

### Minimal
Fast resets for quick development.
- 1 clinic
- 5 users
- 10 patients
- Phase 1 only

```bash
npm run db:seed -- --profile minimal
```

### Standard (Default)
Realistic development environment.
- 1 clinic
- 20 users
- 50 patients
- All phases

```bash
npm run db:seed
# or
npm run db:seed -- --profile standard
```

### Full
Large dataset for performance testing.
- 3 clinics
- 30 users per clinic
- 200 patients per clinic
- All phases

```bash
npm run db:seed -- --profile full
```

---

## Adding Seed Data for New Models

When you create a new Prisma model, follow these steps:

### Step 1: Create a Factory

```typescript
// prisma/seed/factories/patient.factory.ts
import { BaseFactory } from './base.factory';
import type { FactoryOptions } from '../types';
import { orthoGenerator } from '../generators';

export class PatientFactory extends BaseFactory<PatientCreateInput, Patient> {
  build(options?: FactoryOptions<PatientCreateInput>): PatientCreateInput {
    const profile = orthoGenerator.patientProfile();

    const base: PatientCreateInput = {
      clinic: { connect: { id: this.clinicId } },
      patientNumber: orthoGenerator.patientNumber(),
      firstName: profile.firstName,
      lastName: profile.lastName,
      dateOfBirth: profile.dateOfBirth,
      email: profile.email,
      phone: profile.phone,
      status: 'ACTIVE',
      isActive: true,
      createdBy: this.createdBy,
    };

    return this.mergeOptions(base, options);
  }

  async create(options?: FactoryOptions<PatientCreateInput>): Promise<Patient> {
    const data = this.build(options);
    const patient = await this.db.patient.create({ data });

    // Track ID for relationships
    this.idTracker.add('Patient', patient.id, this.clinicId);

    return patient;
  }
}
```

### Step 2: Add Fixtures (for Reference Data)

```typescript
// prisma/seed/fixtures/patient-status.fixture.ts
export const PATIENT_STATUSES = [
  { code: 'PROSPECT', name: 'Prospect', color: '#6B7280' },
  { code: 'ACTIVE', name: 'Active Treatment', color: '#10B981' },
  { code: 'RETENTION', name: 'Retention', color: '#3B82F6' },
  { code: 'INACTIVE', name: 'Inactive', color: '#9CA3AF' },
] as const;
```

### Step 3: Create Area Seed Function

```typescript
// prisma/seed/areas/patients.seed.ts
import type { SeedContext } from '../types';
import { PatientFactory } from '../factories/patient.factory';
import { createFactoryContext } from '../factories';

export async function seedPatients(ctx: SeedContext): Promise<void> {
  const { db, config, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Patients');

  let totalPatients = 0;

  for (const clinicId of clinicIds) {
    const adminId = idTracker.getRandomByClinic('User', clinicId);

    const factoryCtx = createFactoryContext(db, idTracker, clinicId, adminId);
    const factory = new PatientFactory(factoryCtx);

    await factory.createMany(config.counts.patientsPerClinic);
    totalPatients += config.counts.patientsPerClinic;
  }

  logger.endArea('Patients', totalPatients);
}
```

### Step 4: Register in Area Registry

```typescript
// prisma/seed/areas/index.ts
import { seedPatients } from './patients.seed';

export const areaRegistry: SeedArea[] = [
  // ... existing areas

  {
    id: 'patients',
    name: 'Patients',
    phase: 2,
    dependencies: ['auth:users'],  // Patients need users for createdBy
    seed: seedPatients,
  },
];
```

### Step 5: Export Factory

```typescript
// prisma/seed/factories/index.ts
export { PatientFactory } from './patient.factory';
```

---

## Using the Orthodontic Generator

The `orthoGenerator` provides realistic orthodontic data:

```typescript
import { orthoGenerator } from '../generators';

// Patient demographics
const age = orthoGenerator.patientAge();           // 70% kids, 30% adults
const name = orthoGenerator.patientName(age);      // Age-appropriate names
const dob = orthoGenerator.dateOfBirth(age);

// Clinical data
const complaint = orthoGenerator.chiefComplaint(); // "Crowding", "Overbite", etc.
const measurements = orthoGenerator.clinicalMeasurements();

// Treatment data
const type = orthoGenerator.treatmentType();       // COMPREHENSIVE, INVISALIGN, etc.
const fee = orthoGenerator.treatmentFee('COMPREHENSIVE'); // $5000-$7500
const duration = orthoGenerator.treatmentDuration('COMPREHENSIVE'); // 18-30 months

// Appointments
const futureDate = orthoGenerator.futureAppointmentDate();
const pastDate = orthoGenerator.pastAppointmentDate();

// Insurance
const insurance = orthoGenerator.insuranceInfo();
// { provider, groupNumber, memberId, maxBenefit, remainingBenefit }

// Referrals
const referral = orthoGenerator.referralSource();
const dentist = orthoGenerator.referringDentist();
```

---

## Available Fixtures

### Roles & Permissions
```typescript
import { SYSTEM_ROLES, ROLE_PERMISSIONS } from '../fixtures';
```

### Orthodontic Reference Data
```typescript
import {
  APPOINTMENT_TYPES,     // NEW_PATIENT_EXAM, ADJUSTMENT, DEBOND, etc.
  TREATMENT_TYPES,       // COMPREHENSIVE, INVISALIGN, PHASE_I, etc.
  BRACKET_SYSTEMS,       // Damon Q, Clarity, Victory, etc.
  WIRE_PROGRESSIONS,     // .014 NiTi → .019x.025 SS sequence
  CDT_PROCEDURE_CODES,   // D8080, D8670, etc.
  CHIEF_COMPLAINTS,      // Crowding, Spacing, Overbite, etc.
  INSURANCE_PROVIDERS,   // Delta, MetLife, Cigna, etc.
  REFERRAL_SOURCES,      // Dentist, Google, Patient Referral, etc.
} from '../fixtures';
```

---

## CLI Commands

### Seeding

```bash
# Standard profile
npm run db:seed

# Specific profile
npm run db:seed -- --profile minimal
npm run db:seed -- --profile full

# Specific area (includes dependencies)
npm run db:seed -- --area auth:users
npm run db:seed -- --area patients

# Specific phase
npm run db:seed -- --phase 1
npm run db:seed -- --phase 2

# Without clearing existing data
npm run db:seed -- --no-clear

# List available areas
npm run db:seed -- --list
```

### Snapshots

```bash
# Export current DB to snapshot
npm run db:dump -- --name "dev-checkpoint"
npm run db:dump -- --name "phase-2-complete" --phase 2

# List available snapshots
npm run db:restore -- --list

# Restore from snapshot
npm run db:restore -- --snapshot dev-checkpoint_20241129
```

### Reset

```bash
# Full reset with standard profile
npm run db:reset

# Reset with specific profile
npm run db:reset -- --profile minimal

# Reset from snapshot
npm run db:reset -- --snapshot phase-2-complete_20241129
```

---

## Default Credentials

After seeding, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@system.local | Password123! |
| Clinic Admin | admin@main.smileortho.com | Password123! |
| Doctor | dr.{lastname}@main.smileortho.com | Password123! |
| Front Desk | frontdesk@main.smileortho.com | Password123! |

---

## Best Practices

### 1. Always Track IDs

Use `idTracker` to maintain relationships:

```typescript
// After creating a record
const patient = await db.patient.create({ data });
idTracker.add('Patient', patient.id, clinicId);

// When referencing in related records
const patientId = idTracker.getRandomByClinic('Patient', clinicId);
```

### 2. Respect Multi-Clinic Isolation

Always include `clinicId` when creating clinic-scoped data:

```typescript
const patient = await db.patient.create({
  data: {
    clinicId,  // REQUIRED
    // ... other fields
  },
});
```

### 3. Use Factories for Complex Models

Factories provide:
- Consistent data generation
- Trait support for variations
- Easy testing

```typescript
// Create with traits
const inactivePatient = await factory.create({
  traits: ['inactive'],
});

// Create with overrides
const specificPatient = await factory.create({
  overrides: { email: 'test@example.com' },
});
```

### 4. Register Dependencies Correctly

Ensure seed order respects dependencies:

```typescript
{
  id: 'appointments',
  dependencies: ['patients', 'staff', 'booking:types'],
  // appointments need patients, staff, and appointment types to exist first
}
```

---

## Troubleshooting

### "No IDs registered for model"

The dependency order is wrong. Check that prerequisite areas are listed in `dependencies`.

### Seeding is slow

Use `--profile minimal` for faster resets during development.

### Snapshot restore fails

1. Check MongoDB tools are installed (`mongorestore --version`)
2. Verify `DATABASE_URL` is set
3. Ensure snapshot exists (`npm run db:restore -- --list`)

### TypeScript errors after schema change

Run `npx prisma generate` to regenerate the Prisma client.

---

## Adding New Areas

1. Create seed file in `prisma/seed/areas/{area}.seed.ts`
2. Register in `prisma/seed/areas/index.ts` with correct phase and dependencies
3. Create factories for new models
4. Add fixtures for reference data
5. Test with `npm run db:seed -- --area {area-id}`

---

**Last Updated**: 2024-11-29
