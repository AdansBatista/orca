# Instrument Tracking

> **Sub-Area**: [Sterilization & Compliance](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Instrument Tracking manages instrument sets through their complete lifecycle from availability through patient use, reprocessing, and sterilization. Each set is registered with unique identification, tracked through status changes, linked to patient records for traceability, and connected to sterilization cycles. This ensures proper instrument handling, supports infection control, and enables recall traceability if needed.

---

## Core Requirements

- [ ] Register instrument sets with unique identifiers
- [ ] Track set contents and instrument counts
- [ ] Monitor set status through workflow (available → in use → dirty → sterilizing → available)
- [ ] Link set usage to patient and appointment records
- [ ] Record sterilization history per set
- [ ] Track set lifecycle and usage counts
- [ ] Support barcode/RFID identification
- [ ] Manage instrument set retirement
- [ ] Handle quarantine for pending biological results
- [ ] View real-time set availability

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/sterilization/instrument-sets` | `sterilization:read` | List sets |
| GET | `/api/resources/sterilization/instrument-sets/:id` | `sterilization:read` | Get set details |
| POST | `/api/resources/sterilization/instrument-sets` | `sterilization:create` | Add set |
| PUT | `/api/resources/sterilization/instrument-sets/:id` | `sterilization:update` | Update set |
| POST | `/api/resources/sterilization/instrument-sets/:id/checkout` | `sterilization:use` | Check out for use |
| POST | `/api/resources/sterilization/instrument-sets/:id/return` | `sterilization:use` | Return after use |
| GET | `/api/resources/sterilization/instrument-sets/available` | `sterilization:read` | Available sets |
| GET | `/api/resources/sterilization/instrument-sets/:id/history` | `sterilization:read` | Set history |

---

## Data Model

```prisma
model InstrumentSet {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId

  // Identification
  name            String
  setNumber       String
  barcode         String?
  rfidTag         String?

  // Classification
  setType         InstrumentSetType

  // Contents
  description     String?
  instrumentCount Int
  instrumentList  Json?    // Detailed list of instruments

  // Status
  status          InstrumentSetStatus @default(AVAILABLE)
  currentLocation String?

  // Tracking
  lastSterilizedAt      DateTime?
  lastSterilizedCycleId String? @db.ObjectId
  lastUsedAt            DateTime?
  lastUsedPatientId     String? @db.ObjectId
  lastUsedAppointmentId String? @db.ObjectId

  // Usage statistics
  totalUseCount         Int @default(0)
  totalSterilizationCount Int @default(0)

  // Lifecycle
  inServiceDate   DateTime?
  retirementDate  DateTime?
  expectedLifeCycles Int?

  // Condition
  condition       String?
  notes           String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, setNumber])
  @@index([clinicId])
  @@index([status])
  @@index([setType])
  @@index([barcode])
}

enum InstrumentSetType {
  BASIC_ORTHO    // Explorers, mirrors, cotton pliers
  WIRE_SET       // Wire cutters, distal end cutters
  BONDING_SET    // Bracket holders, scalers, band pushers
  BAND_SET       // Band pushers, removers, seaters
  DEBOND_SET     // Debond pliers, adhesive removers
  EMERGENCY_KIT  // Wax spatulas, bracket removers
  SURGICAL_SET   // Surgical instruments
  CUSTOM         // Custom configuration
}

enum InstrumentSetStatus {
  AVAILABLE      // Ready for use (sterile)
  IN_USE         // Currently being used with patient
  DIRTY          // Used, awaiting sterilization
  PROCESSING     // In cleaning/preparation
  STERILIZING    // In sterilization cycle
  QUARANTINE     // Awaiting biological test results
  OUT_OF_SERVICE // Not available for use
  RETIRED        // No longer in service
}

model InstrumentSetUsage {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  instrumentSetId String   @db.ObjectId

  // Usage context
  patientId       String?  @db.ObjectId
  appointmentId   String?  @db.ObjectId
  providerId      String?  @db.ObjectId
  roomId          String?  @db.ObjectId

  // Timing
  checkedOutAt    DateTime @default(now())
  checkedOutBy    String   @db.ObjectId
  returnedAt      DateTime?
  returnedBy      String?  @db.ObjectId

  // Condition
  returnCondition String?
  issuesReported  String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic        @relation(fields: [clinicId], references: [id])
  instrumentSet InstrumentSet @relation(fields: [instrumentSetId], references: [id])

  @@index([clinicId])
  @@index([instrumentSetId])
  @@index([patientId])
  @@index([checkedOutAt])
}

model InstrumentSetCycle {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  instrumentSetId String   @db.ObjectId
  cycleId         String   @db.ObjectId

  // Load details
  loadPosition    String?  // Position in sterilizer load
  packagingType   String?  // Pouch, wrap, cassette

  // Indicator
  internalIndicatorPass Boolean?

  // Quarantine (if biological indicator used)
  isQuarantined         Boolean  @default(false)
  quarantineReleasedAt  DateTime?
  quarantineReleasedBy  String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic        Clinic             @relation(fields: [clinicId], references: [id])
  instrumentSet InstrumentSet      @relation(fields: [instrumentSetId], references: [id])
  cycle         SterilizationCycle @relation(fields: [cycleId], references: [id])

  @@index([clinicId])
  @@index([instrumentSetId])
  @@index([cycleId])
}
```

---

## Business Rules

- Only sets with status AVAILABLE can be checked out for patient use
- Set usage must be linked to patient/appointment when applicable
- Sets must be returned before end of business day
- Status workflow: Available → In Use → Dirty → Processing → Sterilizing → (Quarantine) → Available
- Sets in QUARANTINE status remain until biological test results confirmed
- Sets exceeding lifecycle limit should be flagged for retirement
- Issues reported on return trigger review/repair workflow
- Barcode/RFID scanning speeds checkout and return

---

## Dependencies

**Depends On:**
- Auth & Authorization (user authentication, permissions)
- Patient Records (patient linking for usage)
- Scheduling (appointment linking)
- Cycle Logging (sterilization cycle records)

**Required By:**
- Cycle Logging (sets included in cycles)
- Biological Monitoring (quarantine management)
- Compliance Reporting (instrument traceability)

---

## Notes

- Visual status board shows all sets and current status at a glance
- Color coding: green (available), blue (in use), orange (dirty), yellow (sterilizing), red (quarantine)
- Mobile/tablet interface for quick checkout at chairside
- Set history provides complete traceability for any patient
- Consider set "kits" that can be checked out together
- Retirement workflow should ensure proper disposal documentation

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
