# Aligner Tracking

> **Sub-Area**: [Appliance Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Aligner Tracking manages clear aligner treatment from case submission through completion. This includes tracking total aligner count, current aligner number, deliveries with attachments and IPR, refinement sets, and wear compliance. Integration with aligner systems (Invisalign, ClearCorrect) enables case synchronization and progress monitoring.

---

## Core Requirements

- [ ] Track aligner case details (system, case number)
- [ ] Record total aligner count and current position
- [ ] Document aligner deliveries with quantities
- [ ] Track refinement sets separately
- [ ] Monitor wear compliance
- [ ] Record attachment placements
- [ ] Document IPR performed
- [ ] Support aligner system API integration

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/aligners` | `appliance:read` | List aligner records |
| GET | `/api/aligners/:id` | `appliance:read` | Get aligner record |
| POST | `/api/aligners` | `appliance:create` | Create aligner record |
| PUT | `/api/aligners/:id` | `appliance:update` | Update aligner record |
| POST | `/api/aligners/:id/deliveries` | `appliance:create` | Record aligner delivery |
| PUT | `/api/aligners/:id/progress` | `appliance:update` | Update current aligner |
| GET | `/api/patients/:patientId/aligners` | `appliance:read` | Patient's aligners |

---

## Data Model

```prisma
model AlignerRecord {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  patientId           String   @db.ObjectId
  treatmentPlanId     String?  @db.ObjectId

  // Aligner Details
  alignerSystem       String   // "Invisalign", "ClearCorrect"
  caseNumber          String?

  // Treatment Info
  totalAligners       Int
  currentAligner      Int      @default(1)
  refinementNumber    Int      @default(0)  // 0 = initial

  // Status
  status              AlignerTreatmentStatus @default(IN_PROGRESS)

  // Dates
  startDate           DateTime
  estimatedEndDate    DateTime?
  actualEndDate       DateTime?

  // Delivery Tracking
  alignersDelivered   Int      @default(0)
  lastDeliveryDate    DateTime?

  // Compliance
  averageWearHours    Decimal?

  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
}

model AlignerDelivery {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  alignerRecordId     String   @db.ObjectId

  // Delivery Details
  deliveryDate        DateTime
  alignerNumberStart  Int
  alignerNumberEnd    Int

  // Instructions
  wearSchedule        Int      @default(14)  // days per aligner
  wearHoursPerDay     Int      @default(22)

  // Attachments
  attachmentsPlaced   Boolean  @default(false)
  attachmentTeeth     Int[]

  // IPR
  iprPerformed        Boolean  @default(false)
  iprDetails          String?

  // Provider
  deliveredBy         String   @db.ObjectId

  // Notes
  instructions        String?
  notes               String?

  @@index([clinicId])
  @@index([alignerRecordId])
}

enum AlignerTreatmentStatus {
  SUBMITTED
  APPROVED
  MANUFACTURING
  IN_PROGRESS
  REFINEMENT
  COMPLETED
  DISCONTINUED
}
```

---

## Business Rules

- Current aligner updated at each check visit
- Attachments documented at delivery with tooth numbers
- IPR documented with location and amount
- Refinements tracked as separate sets within same case
- Wear compliance affects treatment duration
- Standard wear: 22 hours/day, 7-14 days per aligner

---

## Dependencies

**Depends On:**
- Patient Management (patient records)
- Treatment Planning (treatment plan linkage)

**Required By:**
- Treatment Tracking (progress monitoring)
- Clinical Documentation (procedure records)

---

## Notes

- Consider Invisalign/iTero API integration for case sync
- Wear compliance monitoring may use patient-reported data
- Refinement sets increment refinementNumber field

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
