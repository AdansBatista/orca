# Retention Protocols

> **Sub-Area**: [Treatment Tracking](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Retention Protocols manages the post-treatment retention phase, tracking retainer wear compliance, scheduling retention check appointments, and monitoring stability. Retention follows a phased approach from full-time wear through as-needed maintenance. The system supports long-term retention monitoring to ensure treatment results are maintained.

---

## Core Requirements

- [ ] Define retention protocols by case type
- [ ] Track retainer delivery and status
- [ ] Set wear schedule by retention phase
- [ ] Schedule retention check appointments
- [ ] Document retention checks with findings
- [ ] Monitor compliance and stability
- [ ] Track retainer replacements
- [ ] Support long-term retention monitoring

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/treatment-plans/:id/retention` | `treatment:read` | Get retention protocol |
| POST | `/api/treatment-plans/:id/retention` | `treatment:create` | Create retention protocol |
| PUT | `/api/retention/:id` | `treatment:update` | Update retention protocol |
| POST | `/api/retention/:id/checks` | `treatment:create` | Record retention check |
| GET | `/api/retention/:id/checks` | `treatment:read` | List retention checks |
| GET | `/api/retention/checks/due` | `treatment:read` | Due retention checks |
| POST | `/api/retention/:id/advance-phase` | `treatment:update` | Advance retention phase |

---

## Data Model

```prisma
model RetentionProtocol {
  id                    String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId              String   @db.ObjectId
  treatmentPlanId       String   @db.ObjectId @unique

  // Protocol Details
  protocolStartDate     DateTime
  currentPhase          RetentionPhase @default(INITIAL)

  // Wear Schedule
  currentWearSchedule   RetentionWearSchedule
  wearInstructions      String?

  // Check Schedule
  nextCheckDate         DateTime?
  checkIntervalMonths   Int      @default(3)

  // Compliance
  lastComplianceCheck   DateTime?
  complianceStatus      ComplianceStatus?
  complianceNotes       String?

  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([clinicId])
  @@index([treatmentPlanId])
}

model RetentionCheck {
  id                      String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId                String   @db.ObjectId
  retentionProtocolId     String   @db.ObjectId

  // Check Details
  checkDate               DateTime
  performedBy             String   @db.ObjectId

  // Assessment
  retainerConditionUpper  RetainerCondition?
  retainerConditionLower  RetainerCondition?
  wearCompliance          ComplianceStatus
  stabilityStatus         StabilityStatus

  // Findings
  findings                String?
  actionTaken             String?

  // Next Steps
  nextCheckDate           DateTime?
  wearScheduleChange      RetentionWearSchedule?

  // Timestamps
  createdAt               DateTime @default(now())

  @@index([retentionProtocolId])
}

enum RetentionPhase {
  INITIAL          // 0-6 months, full-time
  TRANSITION       // 6-12 months, nights
  MAINTENANCE      // 12-24 months, every other night
  LONG_TERM        // 24+ months, as directed
}

enum RetentionWearSchedule {
  FULL_TIME
  NIGHTS_ONLY
  EVERY_OTHER_NIGHT
  FEW_NIGHTS_WEEK
  AS_NEEDED
}

enum ComplianceStatus {
  EXCELLENT
  GOOD
  FAIR
  POOR
  NON_COMPLIANT
}

enum RetainerCondition {
  GOOD
  WORN
  DAMAGED
  LOST
  NEEDS_REPLACEMENT
}

enum StabilityStatus {
  STABLE
  MINOR_RELAPSE
  SIGNIFICANT_RELAPSE
  REQUIRES_TREATMENT
}
```

---

## Business Rules

- Retention protocol created at debond
- Initial phase: full-time wear, 6-8 week checks
- Transition phase: nights only, 3-month checks
- Maintenance phase: every other night, 6-month checks
- Poor compliance triggers additional education
- Relapse may require active treatment consideration

---

## Dependencies

**Depends On:**
- Debond Scheduling (triggers retention start)
- Retainer Management (retainer status)
- Scheduling (check appointments)

**Required By:**
- Patient Communications (retention reminders)
- Reporting & Analytics (retention outcomes)

---

## Notes

- Long-term retention monitoring continues indefinitely
- Consider patient self-reported compliance via portal
- Retention check intervals customizable per practice

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
