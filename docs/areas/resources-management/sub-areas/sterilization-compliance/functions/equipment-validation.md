# Equipment Validation

> **Sub-Area**: [Sterilization & Compliance](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Equipment Validation tracks sterilizer validation, maintenance, and performance verification to ensure equipment operates correctly and safely. This includes initial qualification testing, routine validation, preventive maintenance, calibration, and post-repair verification. Complete documentation supports regulatory compliance and demonstrates due diligence in infection control equipment management.

---

## Core Requirements

- [ ] Document initial sterilizer qualification (IQ/OQ/PQ)
- [ ] Track routine validation schedules
- [ ] Record preventive maintenance activities
- [ ] Log calibration with certificates
- [ ] Document repairs and return-to-service testing
- [ ] Manage validation schedules with reminders
- [ ] Store manufacturer certifications
- [ ] Track Bowie-Dick test results (for prevacuum sterilizers)
- [ ] Record leak rate tests (vacuum sterilizers)
- [ ] Monitor sterilizer lifecycle and performance trends

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/sterilization/validations` | `sterilization:read` | List validations |
| GET | `/api/resources/sterilization/validations/:id` | `sterilization:read` | Get validation details |
| POST | `/api/resources/sterilization/validations` | `sterilization:validate` | Log validation |
| PUT | `/api/resources/sterilization/validations/:id` | `sterilization:validate` | Update validation |
| GET | `/api/resources/sterilization/validations/schedule` | `sterilization:read` | Validation schedule |
| GET | `/api/resources/sterilization/validations/due` | `sterilization:read` | Overdue validations |
| GET | `/api/resources/sterilization/equipment/:id/history` | `sterilization:read` | Equipment history |

---

## Data Model

```prisma
model SterilizerValidation {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  equipmentId     String   @db.ObjectId

  // Validation type
  validationType  ValidationType

  // Dates
  validationDate  DateTime
  nextValidationDue DateTime?

  // Results
  result          ValidationResult
  parameters      Json?    // Test parameters and measurements

  // Documentation
  performedBy     String   // Can be vendor or staff name
  performedById   String?  @db.ObjectId  // If internal staff
  vendorName      String?
  technicianName  String?

  // Certificates
  certificateNumber String?
  certificateUrl    String?
  certificateExpiry DateTime?

  // For failures
  failureDetails    String?
  correctiveAction  String?
  retestDate        DateTime?
  retestResult      ValidationResult?

  // Related maintenance
  maintenanceRecordId String? @db.ObjectId

  // Notes
  notes           String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String   @db.ObjectId

  // Relations
  clinic    Clinic    @relation(fields: [clinicId], references: [id])
  equipment Equipment @relation(fields: [equipmentId], references: [id])

  @@index([clinicId])
  @@index([equipmentId])
  @@index([validationDate])
  @@index([validationType])
  @@index([nextValidationDue])
}

enum ValidationType {
  INSTALLATION_QUALIFICATION   // Initial installation verification
  OPERATIONAL_QUALIFICATION    // Functionality verification
  PERFORMANCE_QUALIFICATION    // Performance verification
  BOWIE_DICK_TEST             // Steam penetration test (daily for prevac)
  LEAK_RATE_TEST              // Vacuum leak test
  CALIBRATION                 // Temperature/pressure calibration
  PREVENTIVE_MAINTENANCE      // Scheduled PM
  REPAIR_VERIFICATION         // Post-repair testing
  ANNUAL_VALIDATION           // Comprehensive annual validation
}

enum ValidationResult {
  PASS          // All criteria met
  FAIL          // Failed one or more criteria
  CONDITIONAL   // Pass with conditions/notes
}

model ValidationSchedule {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  equipmentId     String   @db.ObjectId

  // Schedule details
  validationType  ValidationType
  frequencyDays   Int      // How often (365 for annual, 1 for daily)
  isActive        Boolean  @default(true)

  // Last/Next
  lastPerformed   DateTime?
  nextDue         DateTime?

  // Reminders
  reminderDays    Int      @default(30)  // Days before to remind
  reminderSent    Boolean  @default(false)

  // Notes
  notes           String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic    @relation(fields: [clinicId], references: [id])
  equipment Equipment @relation(fields: [equipmentId], references: [id])

  @@unique([equipmentId, validationType])
  @@index([clinicId])
  @@index([equipmentId])
  @@index([nextDue])
}
```

---

## Business Rules

- Initial qualification (IQ/OQ/PQ) required before first patient use
- Bowie-Dick test required daily for prevacuum sterilizers (before first load)
- Annual validation comprehensive testing per manufacturer requirements
- Failed validation requires equipment out of service until corrected
- Repairs require return-to-service testing before patient use
- Calibration certificates stored with expiration tracking
- Validation schedule reminders sent at configurable intervals
- All validation activities linked to equipment record

---

## Dependencies

**Depends On:**
- Equipment Management (sterilizers are equipment)
- Maintenance Scheduling (PM records)
- Auth & Authorization (user authentication, permissions)

**Required By:**
- Compliance Reporting (validation documentation)
- Equipment Status (validation affects availability)

---

## Notes

- Calendar view shows all scheduled validations
- Dashboard highlights overdue and upcoming validations
- Integration with service vendors for automatic certificate upload
- Manufacturer IFU (Instructions for Use) reference links
- Historical trending: equipment performance over time
- Cost tracking for validation services
- Consider QR code on equipment linking to validation history

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
