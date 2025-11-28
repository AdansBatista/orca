# Bracket Tracking

> **Sub-Area**: [Appliance Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Bracket Tracking documents bracket system selection and placement throughout orthodontic treatment. This includes recording the bracket system type and manufacturer, documenting placement by individual tooth, tracking rebonds and replacements, and maintaining bracket configuration charts. The function supports all major bracket systems including self-ligating, ceramic, and lingual options.

---

## Core Requirements

- [ ] Record bracket system type and manufacturer
- [ ] Document bracket placement by tooth number
- [ ] Track bracket prescription (MBT, Roth, Damon)
- [ ] Record placement date and provider
- [ ] Track bracket replacements and rebonds
- [ ] Support multiple arch configurations
- [ ] Document debond/removal information
- [ ] Generate bracket placement charts

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/appliances` | `appliance:read` | List appliance records |
| GET | `/api/appliances/:id` | `appliance:read` | Get appliance record |
| POST | `/api/appliances` | `appliance:create` | Create appliance record |
| PUT | `/api/appliances/:id` | `appliance:update` | Update appliance |
| POST | `/api/appliances/:id/remove` | `appliance:update` | Remove/deactivate appliance |
| GET | `/api/patients/:patientId/appliances` | `appliance:read` | Patient's appliances |
| GET | `/api/patients/:patientId/bracket-chart` | `appliance:read` | Get bracket chart |

---

## Data Model

```prisma
model ApplianceRecord {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId          String   @db.ObjectId
  patientId         String   @db.ObjectId
  treatmentPlanId   String?  @db.ObjectId

  // Appliance Details
  applianceType     ApplianceRecordType  // BRACKETS
  applianceSystem   String?  // "Damon Q", "3M Clarity"
  manufacturer      String?

  // Configuration (prescription, slot size, etc.)
  specification     Json?

  // Placement
  arch              Arch
  toothNumbers      Int[]

  // Dates
  placedDate        DateTime?
  removedDate       DateTime?

  // Status
  status            ApplianceStatus @default(ACTIVE)

  // Provider
  placedBy          String?  @db.ObjectId
  removedBy         String?  @db.ObjectId

  // Notes
  notes             String?

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([clinicId])
  @@index([patientId])
  @@index([applianceType])
  @@index([status])
}

enum ApplianceRecordType {
  BRACKETS
  BANDS
  // ... other types
}

enum ApplianceStatus {
  ORDERED
  RECEIVED
  ACTIVE
  ADJUSTED
  REMOVED
  REPLACED
  LOST
  BROKEN
}
```

---

## Business Rules

- All bracket placements must document tooth numbers
- Bracket system recorded at initial bonding
- Rebonds tracked with replacement reason
- Provider must be recorded for all placements
- Bracket chart reflects current active brackets
- Removal documented at debond

---

## Dependencies

**Depends On:**
- Patient Management (patient records)
- Treatment Planning (treatment plan linkage)
- Staff Management (provider records)

**Required By:**
- Wire Sequences (bracket-wire relationship)
- Clinical Documentation (procedure records)
- Treatment Tracking (appliance status)

---

## Notes

- Bracket specification JSON stores prescription, slot size, torque values
- Consider bracket inventory integration for supply tracking
- Common systems: Damon, 3M Victory/Clarity, American Ortho, Incognito

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
