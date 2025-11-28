# Certification Management

> **Sub-Area**: [Staff Training](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Certification Management tracks all staff licenses, certifications, and credentials required for their roles in the orthodontic practice. It maintains certification records with expiration dates, stores credential documentation, supports license verification, and ensures staff maintain the certifications required by regulatory bodies and professional standards.

---

## Core Requirements

- [ ] Create and maintain certification records for all staff
- [ ] Track expiration dates with configurable alert thresholds
- [ ] Store certification document uploads securely
- [ ] Support license verification through external databases
- [ ] Track certification history and renewal records
- [ ] Define certification requirements by role
- [ ] Support multi-state license tracking for mobile providers
- [ ] Generate certification status reports

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/compliance/certifications` | `training:view_all` | List all certifications |
| GET | `/api/compliance/certifications/my` | `training:view_own` | Get my certifications |
| GET | `/api/compliance/certifications/:id` | `training:view_all` | Get certification details |
| POST | `/api/compliance/certifications` | `training:manage` | Add certification |
| PUT | `/api/compliance/certifications/:id` | `training:manage` | Update certification |
| POST | `/api/compliance/certifications/:id/renew` | `training:manage` | Record renewal |
| POST | `/api/compliance/certifications/:id/verify` | `training:manage` | Verify certification |
| GET | `/api/compliance/certifications/requirements/:role` | `training:read` | Get role requirements |

---

## Data Model

```prisma
model Certification {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId

  // Certification info
  type          CertificationType
  name          String
  issuingBody   String
  licenseNumber String?
  state         String?   // For state-specific licenses

  // Dates
  issueDate     DateTime
  expirationDate DateTime?
  renewedDate   DateTime?  // Last renewal

  // Verification
  verificationStatus VerificationStatus @default(PENDING)
  verifiedAt    DateTime?
  verifiedBy    String?  @db.ObjectId
  verificationNotes String?

  // Documentation
  documentUrl   String?
  documentName  String?

  // Status
  status        CertificationStatus @default(ACTIVE)

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])
  user      User   @relation(fields: [userId], references: [id])
  history   CertificationHistory[]
  alerts    CertificationAlert[]

  @@index([clinicId])
  @@index([userId])
  @@index([type])
  @@index([expirationDate])
  @@index([status])
}

enum CertificationType {
  DENTAL_LICENSE
  DENTAL_ASSISTANT_LICENSE
  RDA
  RDH
  DEA
  CPR_BLS
  ACLS
  PALS
  XRAY_CERTIFICATION
  HIPAA_TRAINING
  OSHA_TRAINING
  INFECTION_CONTROL
  CORONAL_POLISH
  LOCAL_ANESTHESIA
  NITROUS_OXIDE
  EXPANDED_FUNCTIONS
  INVISALIGN
  OTHER
}

enum VerificationStatus {
  PENDING
  VERIFIED
  FAILED
  EXPIRED
}

enum CertificationStatus {
  ACTIVE
  EXPIRING_SOON
  EXPIRED
  REVOKED
  SUPERSEDED
}
```

---

## Business Rules

- Required certifications by role:
  - Orthodontist: Dental license, DEA (if applicable), CPR/BLS, State radiation certification
  - Dental Assistant: DA license/registration, CPR/BLS, Radiation certification
  - Front Desk: HIPAA training (CPR/BLS recommended)
  - All clinical staff: CPR/BLS, HIPAA, OSHA training
- Expired certifications may restrict job functions
- License verification required for professional licenses
- Renewal records create history entries; don't modify existing records
- Certifications without expiration dates (e.g., lifetime certifications) supported
- Multi-state licenses tracked separately for providers at multiple locations

---

## Dependencies

**Depends On:**
- Auth & User Management (user records)
- Staff Management (staff profiles and roles)
- Document Storage (credential document storage)

**Required By:**
- Expiration Alert System (monitors certification expirations)
- Training Compliance Reporting (includes certification status)
- Audit Management (certification compliance for audits)

---

## Notes

- Consider integration with state licensing board APIs for automated verification
- Common certifications: CPR (2 years), HIPAA (annual), OSHA (annual), state licenses (varies)
- Support for CE credits required to maintain certain certifications (see CE Tracking)
- Dashboard should highlight: expiring soon, expired, pending verification

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
