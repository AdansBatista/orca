# Debond Scheduling

> **Sub-Area**: [Treatment Tracking](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Debond Scheduling manages the assessment of debond readiness and coordination of debond appointments. A comprehensive checklist verifies clinical criteria (treatment goals, occlusion, stability), administrative requirements (retainers ordered/received, final records taken), and patient satisfaction. The function coordinates the debond workflow from readiness assessment through appointment scheduling.

---

## Core Requirements

- [ ] Define debond readiness criteria checklist
- [ ] Track criteria completion status
- [ ] Assess overall debond readiness
- [ ] Schedule debond appointments
- [ ] Coordinate retainer timing
- [ ] Document debond decision
- [ ] Support debond postponement with reasons
- [ ] Generate debond preparation tasks

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/treatment-plans/:id/debond-readiness` | `treatment:read` | Get debond assessment |
| POST | `/api/treatment-plans/:id/debond-readiness` | `treatment:create` | Create assessment |
| PUT | `/api/debond-readiness/:id` | `treatment:update` | Update assessment |
| POST | `/api/debond-readiness/:id/approve` | `treatment:update` | Approve for debond |
| GET | `/api/debond-readiness/ready` | `treatment:read` | Get debond-ready cases |
| GET | `/api/debond-readiness/pending` | `treatment:read` | Cases pending approval |

---

## Data Model

```prisma
model DebondReadiness {
  id                    String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId              String   @db.ObjectId
  treatmentPlanId       String   @db.ObjectId @unique

  // Assessment
  assessmentDate        DateTime
  assessedBy            String   @db.ObjectId

  // Clinical Criteria Checklist
  treatmentGoalsMet     Boolean  @default(false)
  overbiteAcceptable    Boolean  @default(false)
  overjetAcceptable     Boolean  @default(false)
  molarRelationshipOk   Boolean  @default(false)
  midlinesAcceptable    Boolean  @default(false)
  spacingResolved       Boolean  @default(false)
  rootParallelingOk     Boolean?
  patientSatisfied      Boolean  @default(false)

  // Administrative Criteria
  finalRecordsTaken     Boolean  @default(false)
  retainersReady        Boolean  @default(false)

  // Overall Status
  isReady               Boolean  @default(false)
  readyDate             DateTime?

  // If Not Ready
  notReadyReason        String?
  targetReadyDate       DateTime?

  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([clinicId])
  @@index([treatmentPlanId])
}
```

---

## Business Rules

- All required criteria must be met for debond approval
- Retainers must be received before scheduling debond
- Final records (photos, models) taken before or at debond
- Patient satisfaction confirmation required
- Not-ready cases document reason and target date
- Debond appointment type auto-suggested when ready

---

## Dependencies

**Depends On:**
- Treatment Planning (treatment goals)
- Clinical Documentation (clinical status)
- Retainer Management (retainer readiness)
- Imaging Management (final records)

**Required By:**
- Scheduling (debond appointment)
- Retention Protocols (post-debond setup)

---

## Notes

- Debond checklist customizable per practice
- Consider provider preference for final review
- Link to debond procedure documentation

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
