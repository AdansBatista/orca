# Auxiliary Appliances

> **Sub-Area**: [Appliance Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Auxiliary Appliances tracks additional orthodontic devices beyond brackets, wires, and retainers. This includes functional appliances (Herbst, MARA), expansion devices (RPE, Quad Helix), temporary anchorage devices (TADs), headgear/facemask, and accessories (elastics, springs, power chain). Each appliance type has specific tracking requirements and activation protocols.

---

## Core Requirements

- [ ] Document auxiliary appliance placement
- [ ] Track functional appliances (Herbst, MARA)
- [ ] Record expansion appliance activation schedule
- [ ] Monitor elastic wear prescriptions
- [ ] Track TAD placement and status
- [ ] Document headgear/facemask usage
- [ ] Record spring and power chain usage
- [ ] Track appliance adjustments and activations

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/appliances/auxiliary` | `appliance:read` | List auxiliary appliances |
| POST | `/api/appliances/auxiliary` | `appliance:create` | Create auxiliary appliance |
| PUT | `/api/appliances/auxiliary/:id` | `appliance:update` | Update auxiliary appliance |
| POST | `/api/appliances/auxiliary/:id/activation` | `appliance:update` | Record activation |
| GET | `/api/patients/:patientId/elastics` | `appliance:read` | Current elastic prescription |
| POST | `/api/patients/:patientId/elastics` | `appliance:create` | Set elastic prescription |

---

## Data Model

```prisma
model AuxiliaryAppliance {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  patientId           String   @db.ObjectId
  treatmentPlanId     String?  @db.ObjectId

  // Appliance Details
  applianceCategory   AuxiliaryCategory
  applianceName       String
  manufacturer        String?

  // Placement
  placedDate          DateTime
  removedDate         DateTime?
  arch                Arch?
  toothNumbers        Int[]

  // Status
  status              ApplianceStatus @default(ACTIVE)

  // Activation (for expanders)
  activationSchedule  String?
  activationCount     Int      @default(0)
  lastActivation      DateTime?

  // Provider
  placedBy            String   @db.ObjectId
  removedBy           String?  @db.ObjectId

  // Notes
  notes               String?
  instructions        String?

  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  // Relation to activation log
  activations         ApplianceActivation[]

  @@index([clinicId])
  @@index([patientId])
  @@index([applianceCategory])
}

model ApplianceActivation {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  auxiliaryApplianceId String  @db.ObjectId

  activationDate      DateTime
  activationType      String   // "turn", "adjustment"
  activationAmount    String?  // "1/4 turn", "2mm"
  performedBy         String?  @db.ObjectId  // null if patient/parent
  notes               String?

  createdAt           DateTime @default(now())

  @@index([auxiliaryApplianceId])
}

model ElasticPrescription {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  patientId           String   @db.ObjectId

  // Prescription Details
  prescriptionDate    DateTime
  elasticType         ElasticType
  elasticSize         String   // "3/16 medium", "1/4 heavy"
  wearPattern         String   // "Class II", "Triangle", "Box"
  wearSchedule        String   // "Full-time", "Nights only"

  // Configuration
  fromTooth           Int[]
  toTooth             Int[]

  // Status
  isActive            Boolean  @default(true)
  endDate             DateTime?

  // Provider
  prescribedBy        String   @db.ObjectId

  // Notes
  instructions        String?

  createdAt           DateTime @default(now())

  @@index([clinicId])
  @@index([patientId])
  @@index([isActive])
}

enum AuxiliaryCategory {
  FUNCTIONAL          // Herbst, MARA, Twin Block
  EXPANDER            // RPE, Schwarz, Quad Helix
  ANCHORAGE           // TAD, Nance, TPA
  ORTHOPEDIC          // Headgear, Facemask
  ACCESSORY           // Power chain, springs, stops
}

enum ElasticType {
  CLASS_II
  CLASS_III
  VERTICAL
  CROSS
  TRIANGLE
  BOX
  CUSTOM
}
```

---

## Business Rules

- Expansion appliances require activation tracking
- Elastic prescriptions documented with wear pattern
- TAD placement documented with location coordinates
- Functional appliances tracked with adjustment schedule
- Headgear usage may require compliance monitoring
- Power chain placement documented at each adjustment

---

## Dependencies

**Depends On:**
- Patient Management (patient records)
- Treatment Planning (treatment plan linkage)
- Staff Management (provider records)

**Required By:**
- Treatment Tracking (appliance status)
- Clinical Documentation (procedure records)

---

## Notes

- Expansion activation often performed by parent (home instructions)
- Elastic compliance critical for treatment success
- Consider TAD location diagram/chart integration

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
