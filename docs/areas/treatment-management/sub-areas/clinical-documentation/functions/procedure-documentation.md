# Procedure Documentation

> **Sub-Area**: [Clinical Documentation](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Procedure Documentation records clinical procedures performed during patient visits using standardized ADA procedure codes. Each procedure documents the performing provider, tooth/arch location, duration, and any complications. Proper procedure coding supports insurance claim submission and clinical record completeness.

---

## Core Requirements

- [ ] Record procedures with ADA procedure codes
- [ ] Specify tooth numbers and arch locations
- [ ] Track performing and assisting providers
- [ ] Document procedure duration
- [ ] Record status (completed, deferred, cancelled)
- [ ] Note complications or variations
- [ ] Link procedures to progress notes
- [ ] Support procedure code search and lookup

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/progress-notes/:noteId/procedures` | `documentation:read` | List procedures for note |
| POST | `/api/progress-notes/:noteId/procedures` | `documentation:create` | Add procedure to note |
| PUT | `/api/procedures/:procedureId` | `documentation:update` | Update procedure |
| DELETE | `/api/procedures/:procedureId` | `documentation:update` | Remove procedure |
| GET | `/api/procedures/codes` | `documentation:read` | Get procedure code list |
| GET | `/api/patients/:patientId/procedures` | `documentation:read` | Patient's procedure history |

---

## Data Model

```prisma
model ProcedureRecord {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  progressNoteId  String   @db.ObjectId

  // Procedure Details
  procedureCode   String   // ADA code
  procedureName   String
  description     String?

  // Location
  toothNumbers    Int[]
  quadrant        Quadrant?
  arch            Arch?

  // Provider
  performedBy     String   @db.ObjectId
  assistedBy      String?  @db.ObjectId

  // Timing
  performedAt     DateTime @default(now())
  duration        Int?     // minutes

  // Status
  status          ProcedureStatus @default(COMPLETED)

  // Notes
  notes           String?
  complications   String?

  // Timestamps
  createdAt       DateTime @default(now())

  @@index([clinicId])
  @@index([progressNoteId])
  @@index([procedureCode])
}

enum Quadrant {
  UPPER_RIGHT
  UPPER_LEFT
  LOWER_LEFT
  LOWER_RIGHT
}

enum Arch {
  UPPER
  LOWER
  BOTH
}

enum ProcedureStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  DEFERRED
}
```

---

## Business Rules

- Procedures must have valid ADA codes
- Each procedure requires a performing provider
- Tooth numbers use universal numbering (1-32)
- Complications must be documented when they occur
- Deferred procedures carry forward to next visit
- Procedure codes linked to fee schedules
- Procedure history supports insurance claims

---

## Dependencies

**Depends On:**
- Progress Notes (parent note)
- Staff Management (provider records)
- ADA Procedure Code Reference

**Required By:**
- Billing & Insurance (claim submission)
- Treatment Tracking (procedure history)

---

## Notes

- Common orthodontic codes: D8070-D8090 (comprehensive), D8660 (exam), D8670 (visit)
- Consider procedure templates for common visit types
- Duration tracking supports appointment scheduling optimization

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
