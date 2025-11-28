# Continuing Education Tracking

> **Sub-Area**: [Staff Training](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Continuing Education Tracking manages CE credits required for professional license renewals. It tracks CE hours by category (clinical, ethics, infection control), monitors progress toward renewal requirements, stores completion documentation, and helps licensed professionals ensure they meet state board CE requirements for license renewal.

---

## Core Requirements

- [ ] Log CE course completions with credits and categories
- [ ] Track CE requirements by license type and state
- [ ] Monitor CE progress toward renewal cycle requirements
- [ ] Store CE certificates and documentation
- [ ] Support multiple CE categories (clinical, ethics, specialty)
- [ ] Calculate CE gaps before renewal deadlines
- [ ] Generate CE transcripts for license renewal
- [ ] Verify CE provider accreditation

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/ce` | `training:view_all` | List all CE records |
| GET | `/api/compliance/ce/my` | `training:view_own` | Get my CE records |
| POST | `/api/compliance/ce` | `training:view_own` | Add CE record |
| PUT | `/api/compliance/ce/:id` | `training:view_own` | Update CE record |
| GET | `/api/compliance/ce/requirements/:userId` | `training:view_own` | Get CE requirements |
| GET | `/api/compliance/ce/progress/:userId` | `training:view_own` | Get CE progress summary |
| GET | `/api/compliance/ce/transcript/:userId` | `training:view_own` | Generate CE transcript |
| POST | `/api/compliance/ce/:id/verify` | `training:manage` | Verify CE record |

---

## Data Model

```prisma
model ContinuingEducation {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId

  // Course info
  courseName    String
  provider      String
  providerAccreditation String? // ADA CERP, AGD PACE, etc.
  courseId      String?  // External course ID
  category      CECategory
  credits       Decimal
  completionDate DateTime

  // Tracking
  licenseType   CertificationType  // Which license this applies to
  renewalCycleStart DateTime
  renewalCycleEnd   DateTime
  state         String?  // State for state-specific requirements

  // Documentation
  certificateUrl String?

  // Verification
  verified      Boolean  @default(false)
  verifiedAt    DateTime?
  verifiedBy    String?  @db.ObjectId

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])
  user      User   @relation(fields: [userId], references: [id])

  @@index([clinicId])
  @@index([userId])
  @@index([licenseType])
  @@index([completionDate])
  @@index([category])
  @@index([renewalCycleEnd])
}

model CERequirement {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Requirement definition
  licenseType   CertificationType
  state         String   // State code
  renewalPeriodYears Int // Typically 2 years

  // Hours required
  totalHoursRequired Decimal
  categoryRequirements Json // {category: hours} breakdown

  // Notes
  notes         String?
  sourceUrl     String?  // Link to state board requirements

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, licenseType, state])
  @@index([clinicId])
}

enum CECategory {
  CLINICAL
  INFECTION_CONTROL
  ETHICS
  CPR_EMERGENCY
  SPECIALTY
  PRACTICE_MANAGEMENT
  TECHNOLOGY
  OTHER
}
```

---

## Business Rules

- CE requirements vary by state and license type:
  - Dentist (typical): 40 hours/2 years with specific requirements
  - Dental Assistant: 25 hours/2 years (varies by state)
  - RDA: 25-50 hours/2 years (state-dependent)
- Category requirements common across states:
  - Infection control: 2-4 hours minimum
  - Ethics/jurisprudence: 2-4 hours minimum
  - CPR: Often required but may not count toward total
- CE credits must fall within renewal cycle dates
- Provider accreditation (ADA CERP, AGD PACE) may be required
- CE verification may require certificate review
- Transcript export format should match state board submission requirements

---

## Dependencies

**Depends On:**
- Certification Management (license records and renewal dates)
- Auth & User Management (user records)
- Document Storage (certificate storage)

**Required By:**
- Expiration Alert System (CE deadline monitoring)
- Training Compliance Reporting (CE progress metrics)

---

## Notes

- Common CE providers: ADA, state dental associations, online CE platforms
- Consider integration with CE providers for automatic credit import
- Some states have carryover provisions for excess credits
- Emergency/COVID provisions may temporarily modify requirements
- CE gap analysis should alert when unlikely to meet requirements before deadline

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
