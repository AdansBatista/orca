# Cycle Logging

> **Sub-Area**: [Sterilization & Compliance](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Cycle Logging documents every sterilization cycle with complete parameters, operator identification, and outcomes. This is critical for patient safety, infection control, and regulatory compliance. Each cycle record includes sterilizer identification, cycle type, timing, temperature/pressure parameters, mechanical and chemical indicator results, load contents, and any failures or corrective actions. Complete documentation supports inspection readiness and audit trails.

---

## Core Requirements

- [ ] Record sterilizer identification and cycle number
- [ ] Log cycle type (standard, prevacuum, flash, etc.)
- [ ] Document cycle parameters (temperature, pressure, time)
- [ ] Record mechanical indicator results (gauge readings)
- [ ] Log chemical indicator results (internal/external)
- [ ] Track operator identification
- [ ] Record cycle start and end times
- [ ] Document load contents (instrument sets included)
- [ ] Handle cycle failures with corrective action
- [ ] Support verification/sign-off by second staff member
- [ ] Link to biological indicator tests when applicable

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/sterilization/cycles` | `sterilization:read` | List cycles |
| GET | `/api/resources/sterilization/cycles/:id` | `sterilization:read` | Get cycle details |
| POST | `/api/resources/sterilization/cycles` | `sterilization:log` | Log new cycle |
| PUT | `/api/resources/sterilization/cycles/:id` | `sterilization:log` | Update cycle |
| POST | `/api/resources/sterilization/cycles/:id/complete` | `sterilization:log` | Complete cycle |
| POST | `/api/resources/sterilization/cycles/:id/fail` | `sterilization:log` | Record failure |
| GET | `/api/resources/sterilization/cycles/today` | `sterilization:read` | Today's cycles |

---

## Data Model

```prisma
model SterilizationCycle {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId

  // Equipment
  autoclaveId     String   @db.ObjectId

  // Cycle identification
  cycleNumber     String
  cycleDate       DateTime @default(now())

  // Cycle type
  cycleType       SterilizationCycleType

  // Timing
  startTime       DateTime
  endTime         DateTime?
  totalDuration   Int?     // minutes

  // Parameters
  temperature     Decimal?
  temperatureUnit TemperatureUnit @default(FAHRENHEIT)
  pressure        Decimal? // PSI
  exposureTime    Int?     // minutes

  // Results - Mechanical
  mechanicalIndicatorPass Boolean?

  // Results - Chemical
  chemicalIndicatorPass   Boolean?
  chemicalIndicatorType   String?

  // Results - Biological (linked)
  hasBiologicalIndicator  Boolean @default(false)
  biologicalIndicatorId   String? @db.ObjectId

  // Operator
  operatorId      String   @db.ObjectId
  verifiedById    String?  @db.ObjectId
  verifiedAt      DateTime?

  // Status
  status          CycleStatus @default(IN_PROGRESS)
  failureReason   String?
  correctiveAction String?

  // Load information
  loadDescription String?
  loadWeight      Decimal?

  // Notes
  notes           String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic      Clinic    @relation(fields: [clinicId], references: [id])
  autoclave   Equipment @relation(fields: [autoclaveId], references: [id])
  operator    User      @relation(fields: [operatorId], references: [id])

  @@unique([clinicId, autoclaveId, cycleNumber])
  @@index([clinicId])
  @@index([autoclaveId])
  @@index([cycleDate])
  @@index([status])
}

enum SterilizationCycleType {
  GRAVITY          // Standard gravity displacement
  PREVACUUM        // Pre-vacuum/dynamic air removal
  FLASH            // Immediate use steam sterilization
  LIQUID_CHEMICAL  // Liquid chemical sterilant
  DRY_HEAT         // Dry heat sterilization
  ETHYLENE_OXIDE   // EtO sterilization
  VALIDATION       // Validation/test cycle
  BOWIE_DICK       // Bowie-Dick test cycle
}

enum TemperatureUnit {
  FAHRENHEIT
  CELSIUS
}

enum CycleStatus {
  IN_PROGRESS     // Cycle running
  COMPLETED_PASS  // Successful completion
  COMPLETED_FAIL  // Failed cycle
  ABORTED         // Cycle aborted
  VOID            // Record voided
}
```

---

## Business Rules

- Cycle numbers are sequential per sterilizer per day
- Every cycle must have operator identification
- Mechanical and chemical indicators recorded for steam cycles
- Failed cycles require documented corrective action
- Instrument sets included in cycle must be linked
- Cycle records are immutable after completion (void only with reason)
- Verification by second staff member recommended for compliance
- All parameters required per CDC/state dental board guidelines

---

## Dependencies

**Depends On:**
- Equipment Management (autoclaves are equipment)
- Instrument Tracking (sets included in load)
- Auth & Authorization (user authentication, permissions)

**Required By:**
- Instrument Tracking (sets sterilized in cycles)
- Biological Monitoring (biological tests linked to cycles)
- Compliance Reporting (cycle documentation for audits)

---

## Notes

- Consider tablet/mobile interface at sterilization station
- Timer integration could auto-populate cycle duration
- Quick-select for common load configurations
- Failed cycle workflow should guide through corrective actions
- Print cycle log for physical record keeping if required
- Integration with digital sterilizer output possible for newer equipment

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
