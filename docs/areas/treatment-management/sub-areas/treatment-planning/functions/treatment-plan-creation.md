# Treatment Plan Creation

> **Sub-Area**: [Treatment Planning](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Treatment Plan Creation enables doctors to create comprehensive orthodontic treatment plans documenting patient diagnosis, treatment goals, estimated duration, and provider assignments. This function serves as the foundation for all treatment records, linking clinical documentation, appliance tracking, and financial management throughout the patient's treatment journey.

---

## Core Requirements

- [ ] Create treatment plans linked to patient records
- [ ] Record chief complaint and clinical diagnosis
- [ ] Define treatment goals and objectives
- [ ] Select treatment plan type (comprehensive, limited, Phase I/II, aligner, surgical)
- [ ] Assign primary and supervising providers
- [ ] Set estimated duration and visit count
- [ ] Generate unique plan numbers
- [ ] Support plan versioning for modifications
- [ ] Enforce single active plan per patient

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/treatment-plans` | `treatment:read` | List treatment plans with filters |
| GET | `/api/treatment-plans/:id` | `treatment:read` | Get treatment plan details |
| POST | `/api/treatment-plans` | `treatment:create` | Create new treatment plan |
| PUT | `/api/treatment-plans/:id` | `treatment:update` | Update treatment plan |
| DELETE | `/api/treatment-plans/:id` | `treatment:delete` | Soft delete treatment plan |
| POST | `/api/treatment-plans/:id/duplicate` | `treatment:create` | Duplicate existing plan |
| GET | `/api/patients/:patientId/treatment-plans` | `treatment:read` | Get patient's treatment plans |

---

## Data Model

```prisma
model TreatmentPlan {
  id                    String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId              String   @db.ObjectId
  patientId             String   @db.ObjectId

  // Plan Identification
  planNumber            String   @unique
  planName              String
  planType              TreatmentPlanType

  // Status & Version
  status                TreatmentPlanStatus @default(DRAFT)
  version               Int      @default(1)
  isActive              Boolean  @default(false)

  // Clinical Details
  chiefComplaint        String?
  diagnosis             String[]
  treatmentGoals        String[]

  // Providers
  primaryProviderId     String   @db.ObjectId
  supervisingProviderId String?  @db.ObjectId

  // Estimates
  estimatedDuration     Int?     // months
  estimatedVisits       Int?
  totalFee              Decimal?

  // Dates
  createdDate           DateTime @default(now())
  presentedDate         DateTime?
  acceptedDate          DateTime?
  startDate             DateTime?
  estimatedEndDate      DateTime?

  // Timestamps & Audit
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?
  createdBy             String   @db.ObjectId
  updatedBy             String?  @db.ObjectId

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
}

enum TreatmentPlanType {
  COMPREHENSIVE
  LIMITED
  PHASE_I
  PHASE_II
  INVISALIGN
  CLEAR_ALIGNER
  SURGICAL
  ADULT_LIMITED
  RETENTION_ONLY
}

enum TreatmentPlanStatus {
  DRAFT
  PRESENTED
  ACCEPTED
  ACTIVE
  ON_HOLD
  COMPLETED
  DISCONTINUED
  TRANSFERRED
}
```

---

## Business Rules

- Only doctors (with `treatment:create` permission) can create treatment plans
- Patient must exist before creating a treatment plan
- Only one treatment plan can be active per patient at a time
- Plan numbers are auto-generated and unique across clinic
- Draft plans can be freely edited; accepted/active plans require version increment
- Deleting a plan is a soft delete preserving audit history

---

## Dependencies

**Depends On:**
- Patient Management (patient records)
- Staff Management (provider assignment)

**Required By:**
- Treatment Options
- Case Presentation
- Case Acceptance
- Clinical Documentation
- Appliance Management
- Treatment Tracking

---

## Notes

- Treatment plan creation automatically generates standard milestones based on plan type
- Consider integration with imaging for diagnostic records linkage
- Plan duplication useful for creating similar plans or versioning

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
