# Biological Monitoring

> **Sub-Area**: [Sterilization & Compliance](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Biological Monitoring tracks spore test (biological indicator) usage and results to verify sterilization effectiveness. Per CDC guidelines, dental practices must conduct biological monitoring at least weekly. The system logs test placement, incubation timing, results, and manages quarantine procedures for positive (failed) results. Proper documentation demonstrates sterilization verification for regulatory compliance.

---

## Core Requirements

- [ ] Log biological indicator placement in cycles
- [ ] Track incubation start and end times
- [ ] Record test results (negative pass, positive fail, inconclusive)
- [ ] Document control test results
- [ ] Generate alerts for positive (failed) results
- [ ] Track lot numbers for indicators
- [ ] Manage quarantined instruments pending results
- [ ] Support external lab integration
- [ ] Maintain biological monitoring schedule
- [ ] Generate compliance reports for testing frequency

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/sterilization/biological-tests` | `sterilization:read` | List tests |
| GET | `/api/resources/sterilization/biological-tests/:id` | `sterilization:read` | Get test details |
| POST | `/api/resources/sterilization/biological-tests` | `sterilization:log` | Log test |
| PUT | `/api/resources/sterilization/biological-tests/:id` | `sterilization:log` | Update test |
| POST | `/api/resources/sterilization/biological-tests/:id/result` | `sterilization:validate` | Record result |
| POST | `/api/resources/sterilization/quarantine/release` | `sterilization:validate` | Release quarantine |
| GET | `/api/resources/sterilization/biological-tests/pending` | `sterilization:read` | Pending results |
| GET | `/api/resources/sterilization/biological-tests/schedule` | `sterilization:read` | Test schedule |

---

## Data Model

```prisma
model BiologicalIndicator {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId

  // Test identification
  testNumber      String
  testDate        DateTime

  // Product info
  productName     String?
  lotNumber       String
  expirationDate  DateTime?
  manufacturer    String?

  // Associated cycle
  cycleId         String?  @db.ObjectId

  // Incubation
  incubationStartTime DateTime?
  incubationEndTime   DateTime?
  incubationHours     Int?

  // Control test
  controlLotNumber    String?
  controlResult       ControlResult?

  // Results
  readingTime     DateTime?
  result          BiologicalResult?
  readBy          String?  @db.ObjectId

  // For positive results
  investigationNotes String?
  correctiveAction   String?
  reTestDate         DateTime?
  reTestResult       BiologicalResult?

  // External lab (if applicable)
  sentToLab       Boolean  @default(false)
  labName         String?
  labReportNumber String?
  labResultDate   DateTime?

  // Status
  status          BiologicalTestStatus @default(PENDING)

  // Notes
  notes           String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String   @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic             @relation(fields: [clinicId], references: [id])
  cycle     SterilizationCycle? @relation(fields: [cycleId], references: [id])

  @@index([clinicId])
  @@index([testDate])
  @@index([status])
  @@index([result])
  @@index([cycleId])
}

enum BiologicalResult {
  NEGATIVE      // No growth - PASS
  POSITIVE      // Growth detected - FAIL
  INCONCLUSIVE  // Unable to determine
}

enum ControlResult {
  POSITIVE      // Control showed expected growth (valid test)
  NEGATIVE      // Control failed to grow (invalid test)
}

enum BiologicalTestStatus {
  PENDING       // Test placed, awaiting incubation
  INCUBATING    // In incubation
  READY_TO_READ // Incubation complete
  COMPLETED     // Result recorded
  VOID          // Test voided
}

model QuarantineRecord {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  biologicalTestId String  @db.ObjectId

  // Quarantine details
  quarantineDate  DateTime @default(now())
  quarantineReason String

  // Affected items
  affectedCycles  String[] @db.ObjectId
  affectedSets    String[] @db.ObjectId

  // Release
  releaseDate     DateTime?
  releasedBy      String?  @db.ObjectId
  releaseReason   String?

  // Status
  status          QuarantineStatus @default(ACTIVE)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String   @db.ObjectId

  // Relations
  clinic    Clinic              @relation(fields: [clinicId], references: [id])
  bioTest   BiologicalIndicator @relation(fields: [biologicalTestId], references: [id])

  @@index([clinicId])
  @@index([biologicalTestId])
  @@index([status])
}

enum QuarantineStatus {
  ACTIVE        // Items in quarantine
  RELEASED      // Released after negative result
  REPROCESSED   // Items reprocessed after positive
  DISPOSED      // Items disposed after positive
}
```

---

## Business Rules

- Weekly biological monitoring minimum per CDC guidelines (more frequent per state)
- Each test batch should include control verification
- Results must be read and recorded within manufacturer's specified window
- Positive results require immediate quarantine of loads since last negative
- Positive results trigger immediate notification to clinic admin
- Quarantined loads released only after negative retest
- Control showing negative (no growth) invalidates the test batch
- Incubation times tracked per manufacturer requirements

---

## Dependencies

**Depends On:**
- Cycle Logging (tests linked to cycles)
- Instrument Tracking (quarantine of sets)
- Equipment Management (sterilizer identification)
- Auth & Authorization (user authentication, permissions)

**Required By:**
- Instrument Tracking (quarantine status)
- Compliance Reporting (biological monitoring documentation)
- Alert System (positive result notifications)

---

## Notes

- Calendar view showing testing schedule and compliance status
- Alert system: email/SMS for positive results
- In-office incubators: automatic time tracking
- External lab integration for mail-in testing
- Historical trending: failure rates over time
- Indicator lot tracking supports recall situations
- Consider reminder system for scheduled testing

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
