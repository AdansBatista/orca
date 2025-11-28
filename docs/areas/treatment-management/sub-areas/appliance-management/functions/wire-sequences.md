# Wire Sequences

> **Sub-Area**: [Appliance Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Wire Sequences manages wire progression throughout orthodontic treatment, tracking each wire change with size, material, and placement details. The function supports standard wire sequence protocols (initial NiTi through finishing TMA) while allowing customization for individual cases. Wire history provides a complete record of treatment progression.

---

## Core Requirements

- [ ] Record wire type, size, and material
- [ ] Track wire placement and removal dates
- [ ] Manage wire sequence protocols
- [ ] Document wire bends and customizations
- [ ] Track by arch (upper, lower)
- [ ] Assign sequence numbers
- [ ] Record placing provider
- [ ] Generate wire history reports

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/appliances/:applianceId/wires` | `appliance:read` | List wire records |
| POST | `/api/appliances/:applianceId/wires` | `appliance:create` | Add wire record |
| PUT | `/api/wires/:wireId` | `appliance:update` | Update wire record |
| POST | `/api/wires/:wireId/remove` | `appliance:update` | Remove wire |
| GET | `/api/patients/:patientId/wire-history` | `appliance:read` | Patient wire history |
| GET | `/api/wire-sequences` | `appliance:read` | Get wire sequence protocols |

---

## Data Model

```prisma
model WireRecord {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  applianceRecordId   String   @db.ObjectId

  // Wire Details
  wireType            WireType
  wireSize            String   // ".014", ".016x.022"
  wireMaterial        WireMaterial
  manufacturer        String?

  // Placement
  arch                Arch

  // Dates
  placedDate          DateTime
  removedDate         DateTime?

  // Status
  status              WireStatus @default(ACTIVE)

  // Provider
  placedBy            String   @db.ObjectId
  removedBy           String?  @db.ObjectId

  // Sequence
  sequenceNumber      Int      @default(1)

  // Notes
  notes               String?
  bends               String?  // Description of bends placed

  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([clinicId])
  @@index([applianceRecordId])
  @@index([placedDate])
}

enum WireType {
  ROUND
  RECTANGULAR
  SQUARE
}

enum WireMaterial {
  NITI
  NITI_HEAT
  STAINLESS_STEEL
  TMA
  BETA_TITANIUM
  COPPER_NITI
}

enum WireStatus {
  ACTIVE
  REMOVED
  BROKEN
  REPLACED
}
```

---

## Business Rules

- Wire changes documented at each adjustment visit
- Standard sequence: .014 NiTi → .016 NiTi → .016x.022 NiTi → .019x.025 NiTi → .019x.025 SS → TMA
- Sequence numbers track progression order
- Broken wires trigger immediate replacement documentation
- Wire material appropriate to treatment phase
- Custom bends documented for reference

---

## Dependencies

**Depends On:**
- Bracket Tracking (parent appliance record)
- Staff Management (provider records)

**Required By:**
- Treatment Tracking (progress monitoring)
- Clinical Documentation (procedure records)

---

## Notes

- Wire sequence protocols configurable per clinic
- Consider wire inventory integration for supply tracking
- Heat-activated NiTi appropriate for initial alignment

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
