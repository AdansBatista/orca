# Phase Management

> **Sub-Area**: [Treatment Planning](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Phase Management enables definition and tracking of treatment phases within a treatment plan. Standard orthodontic phases (alignment, leveling, space closure, finishing) are supported along with custom phases. Each phase has objectives, planned dates, and progress tracking, helping clinical teams monitor treatment progression and identify delays.

---

## Core Requirements

- [ ] Define treatment phases with objectives
- [ ] Set planned start and end dates per phase
- [ ] Track actual phase start and completion dates
- [ ] Monitor phase progress percentage
- [ ] Support standard phase templates by treatment type
- [ ] Allow custom phase creation
- [ ] Manage phase transitions and status changes
- [ ] Link phases to treatment milestones

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/treatment-plans/:id/phases` | `treatment:read` | List treatment phases |
| POST | `/api/treatment-plans/:id/phases` | `treatment:create` | Add treatment phase |
| PUT | `/api/treatment-phases/:phaseId` | `treatment:update` | Update phase |
| DELETE | `/api/treatment-phases/:phaseId` | `treatment:update` | Remove phase |
| POST | `/api/treatment-phases/:phaseId/start` | `treatment:update` | Start phase |
| POST | `/api/treatment-phases/:phaseId/complete` | `treatment:update` | Complete phase |

---

## Data Model

```prisma
model TreatmentPhase {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  treatmentPlanId     String   @db.ObjectId

  // Phase Details
  phaseNumber         Int
  phaseName           String
  phaseType           TreatmentPhaseType
  description         String?
  objectives          String[]

  // Status
  status              PhaseStatus @default(NOT_STARTED)

  // Dates
  plannedStartDate    DateTime?
  plannedEndDate      DateTime?
  actualStartDate     DateTime?
  actualEndDate       DateTime?

  // Progress
  estimatedVisits     Int?
  completedVisits     Int      @default(0)
  progressPercent     Int      @default(0)

  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([clinicId])
  @@index([treatmentPlanId])
  @@index([status])
}

enum TreatmentPhaseType {
  INITIAL_ALIGNMENT
  LEVELING
  SPACE_CLOSURE
  FINISHING
  DETAILING
  RETENTION
  PRE_SURGICAL
  POST_SURGICAL
  PHASE_I_ACTIVE
  OBSERVATION
  CUSTOM
}

enum PhaseStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  SKIPPED
}
```

---

## Business Rules

- Phases should generally be completed in sequence
- Only one phase should be IN_PROGRESS at a time (typically)
- Phase completion triggers related milestone updates
- Standard phases auto-created based on treatment plan type
- Custom phases can be added for unique case requirements
- Skipping phases requires documentation reason

---

## Dependencies

**Depends On:**
- Treatment Plan Creation (parent plan)

**Required By:**
- Treatment Tracking (timeline visualization)
- Milestone Tracking (phase-based milestones)
- Progress Monitoring (phase progress)

---

## Notes

- Standard phase templates reduce setup time for common treatments
- Phase progress calculated from completed visits vs. estimated
- Consider phase-specific wire sequence recommendations

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
