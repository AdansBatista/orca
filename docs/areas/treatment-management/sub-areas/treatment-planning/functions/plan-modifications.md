# Plan Modifications

> **Sub-Area**: [Treatment Planning](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Plan Modifications manages changes to treatment plans after initial acceptance, maintaining version control and audit history. When significant changes occur (appliance type, extended duration, fee changes), a new plan version is created. Minor adjustments are tracked without versioning. All modifications require documentation of reason and may require patient acknowledgment.

---

## Core Requirements

- [ ] Track all treatment plan modifications
- [ ] Create new version for significant changes
- [ ] Document modification reason and details
- [ ] Require patient acknowledgment for major changes
- [ ] Update financial estimates when applicable
- [ ] Maintain complete modification history
- [ ] Support rollback/comparison between versions
- [ ] Generate modification summary reports

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/treatment-plans/:id/versions` | `treatment:read` | List plan versions |
| POST | `/api/treatment-plans/:id/modify` | `treatment:update` | Create modification |
| GET | `/api/treatment-plans/:id/modifications` | `treatment:read` | List modifications |
| GET | `/api/treatment-modifications/:id` | `treatment:read` | Get modification details |
| POST | `/api/treatment-modifications/:id/acknowledge` | `treatment:update` | Patient acknowledgment |
| GET | `/api/treatment-plans/:id/compare/:versionId` | `treatment:read` | Compare versions |

---

## Data Model

```prisma
model TreatmentModification {
  id                    String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId              String   @db.ObjectId
  treatmentPlanId       String   @db.ObjectId

  // Modification Details
  modificationType      ModificationType
  modificationDate      DateTime @default(now())
  modifiedBy            String   @db.ObjectId

  // Version Info
  previousVersion       Int
  newVersion            Int?     // null for minor modifications

  // Changes
  changeDescription     String
  reason                String
  changedFields         Json     // Field-level changes

  // Financial Impact
  feeChange             Decimal?
  newTotalFee           Decimal?

  // Acknowledgment
  requiresAcknowledgment Boolean @default(false)
  acknowledgedAt         DateTime?
  acknowledgedBy         String?  @db.ObjectId

  // Timestamps
  createdAt             DateTime @default(now())

  @@index([clinicId])
  @@index([treatmentPlanId])
}

enum ModificationType {
  MINOR_ADJUSTMENT      // No version change
  PHASE_ADDITION        // May require consent
  APPLIANCE_CHANGE      // Requires new consent
  DURATION_EXTENSION    // Financial update needed
  TREATMENT_UPGRADE     // Requires new consent
  TREATMENT_DOWNGRADE   // May require consent
  FEE_ADJUSTMENT        // Financial update
  PROVIDER_CHANGE       // Documentation only
}
```

---

## Business Rules

- Significant changes create new plan version
- Appliance type changes require new informed consent
- Fee increases require patient acknowledgment
- Duration extensions update financial payment terms
- Provider changes documented but don't require consent
- All modifications logged in audit trail
- Original plan versions never modified (immutable)

---

## Dependencies

**Depends On:**
- Treatment Plan Creation (parent plan)
- Case Acceptance (existing consent)
- Financial Management (fee updates)

**Required By:**
- Audit & Compliance (modification history)

---

## Notes

- Version comparison helps explain changes to patients
- Consider notification workflow for significant modifications
- Financial management integration updates payment schedules

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
