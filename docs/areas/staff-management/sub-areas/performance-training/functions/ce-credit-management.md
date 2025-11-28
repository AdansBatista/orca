# CE Credit Management

> **Sub-Area**: [Performance & Training](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Track continuing education requirements for licensed providers to maintain state licensure. Records CE credits by category, monitors progress toward renewal requirements, and provides reporting for license renewal submissions. Supports state-specific CE requirements.

---

## Core Requirements

- [ ] Track CE requirements by license type and state
- [ ] Record CE credit completion details
- [ ] Categorize credits (clinical, ethics, etc.)
- [ ] Monitor progress toward renewal period
- [ ] Generate CE summary reports for renewal
- [ ] Implement CE expiration alerts
- [ ] Store CE certificates
- [ ] Verify CE provider accreditation

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/:id/ce-credits` | `training:read` | Get CE credits |
| POST | `/api/staff/:id/ce-credits` | `training:manage` | Add CE credit |
| PUT | `/api/staff/ce-credits/:creditId` | `training:manage` | Update CE credit |
| DELETE | `/api/staff/ce-credits/:creditId` | `training:manage` | Delete CE credit |
| GET | `/api/staff/:id/ce-credits/summary` | `training:read` | Get CE summary |
| POST | `/api/staff/ce-credits/:creditId/verify` | `training:verify` | Verify CE credit |
| GET | `/api/staff/:id/ce-credits/requirements` | `training:read` | Get CE requirements |
| GET | `/api/staff/ce-credits/expiring` | `training:read` | Get expiring CE |

---

## Data Model

```prisma
model CECredit {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  courseName    String
  provider      String
  providerNumber String?  // ADA CERP number
  credits       Decimal
  category      CECategory

  completionDate DateTime
  expirationDate DateTime?

  certificateNumber String?
  certificateUrl String?
  verified      Boolean  @default(false)
  verifiedBy    String?  @db.ObjectId
  verifiedAt    DateTime?

  licenseType   String?
  licensingBoard String?

  renewalPeriodStart DateTime?
  renewalPeriodEnd DateTime?

  @@index([staffProfileId])
  @@index([category])
  @@index([renewalPeriodEnd])
}

enum CECategory {
  CLINICAL
  ETHICS
  INFECTION_CONTROL
  PHARMACOLOGY
  RADIOLOGY
  CPR_EMERGENCY
  PRACTICE_MANAGEMENT
  SPECIAL_TOPICS
  OTHER
}
```

---

## Business Rules

- CE requirements vary by state and license type
- Credits must fall within renewal period to count
- Some categories have minimum requirements (e.g., ethics)
- CE providers should be accredited (ADA CERP, AGD PACE)
- Verification may be required for license renewal
- Credits cannot be double-counted across renewal periods
- Alert at 6 months, 3 months, 1 month before renewal deadline

### CE Requirements by License (Examples)

| License | State | Credits | Period | Categories |
|---------|-------|---------|--------|------------|
| Dental | CA | 50 | 2 years | 2 hrs infection control |
| Dental | TX | 24 | 2 years | 2 hrs ethics, 2 hrs OSHA |
| Hygienist | CA | 25 | 2 years | Varies by state |
| Orthodontic | Varies | Per board | Varies | Specialty-specific |

### CE Credit Categories

| Category | Description |
|----------|-------------|
| Clinical | Clinical orthodontics, treatment |
| Ethics | Professional ethics, jurisprudence |
| Infection Control | Sterilization, safety protocols |
| Pharmacology | Drug interactions, anesthesia |
| CPR/Emergency | BLS, emergency response |
| Practice Management | Business, leadership |

---

## Dependencies

**Depends On:**
- Employee Profiles
- Credential Management (license info)
- Document Storage (certificates)

**Required By:**
- License renewal process
- Compliance reporting
- Provider status verification

---

## Notes

- State requirements change; maintain current database
- Some states accept online CE, others require in-person
- ADA CERP and AGD PACE are primary accreditors
- Consider: CE course database integration
