# Visit Records

> **Sub-Area**: [Clinical Documentation](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Visit Records links and aggregates all documentation associated with a patient appointment, providing a comprehensive view of each clinical visit. This includes the progress note, procedures performed, findings recorded, measurements taken, images captured, and next steps planned. Visit records support documentation completeness checks and visit summary generation.

---

## Core Requirements

- [ ] Link progress notes to scheduled appointments
- [ ] Aggregate all visit documentation components
- [ ] Track visit completion status
- [ ] Generate visit summaries
- [ ] Support walk-in/unscheduled visits
- [ ] Track actual visit duration
- [ ] Verify documentation completeness
- [ ] Link to billing records

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/appointments/:appointmentId/visit-record` | `documentation:read` | Get visit record |
| GET | `/api/patients/:patientId/visit-records` | `documentation:read` | List patient visit records |
| POST | `/api/appointments/:appointmentId/visit-record` | `documentation:create` | Create visit record |
| GET | `/api/visit-records/:id/summary` | `documentation:read` | Get visit summary |
| GET | `/api/visit-records/incomplete` | `documentation:read` | Incomplete visit records |
| POST | `/api/visit-records/:id/complete` | `documentation:update` | Mark visit complete |

---

## Data Model

```prisma
model VisitRecord {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  patientId           String   @db.ObjectId
  appointmentId       String?  @db.ObjectId
  treatmentPlanId     String?  @db.ObjectId

  // Visit Details
  visitDate           DateTime
  visitType           VisitType
  isWalkIn            Boolean  @default(false)

  // Timing
  checkInTime         DateTime?
  startTime           DateTime?
  endTime             DateTime?
  actualDuration      Int?     // minutes

  // Documentation Links
  progressNoteId      String?  @db.ObjectId
  procedureCount      Int      @default(0)
  findingCount        Int      @default(0)
  measurementCount    Int      @default(0)
  imageCount          Int      @default(0)

  // Status
  documentationStatus DocumentationStatus @default(PENDING)
  isComplete          Boolean  @default(false)

  // Next Steps
  nextAppointmentId   String?  @db.ObjectId
  patientInstructions String?

  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([clinicId])
  @@index([patientId])
  @@index([appointmentId])
  @@index([visitDate])
}

enum VisitType {
  SCHEDULED
  WALK_IN
  EMERGENCY
  TELEHEALTH
}

enum DocumentationStatus {
  PENDING
  IN_PROGRESS
  COMPLETE
  NEEDS_SIGNATURE
}
```

---

## Business Rules

- Visit records link appointments to clinical documentation
- Documentation completeness requires signed progress note
- Walk-in visits create visit record without appointment
- Visit duration tracked for scheduling optimization
- Incomplete documentation flagged for provider review
- Patient instructions documented before checkout

---

## Dependencies

**Depends On:**
- Scheduling (appointment records)
- Progress Notes (clinical documentation)
- Procedure Documentation (procedures performed)
- Clinical Findings (findings recorded)
- Clinical Measurements (measurements taken)

**Required By:**
- Practice Orchestration (patient flow)
- Billing & Insurance (visit-based billing)

---

## Notes

- Visit summaries useful for patient communication
- Incomplete visit alerts ensure documentation compliance
- Duration tracking informs appointment type scheduling

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
