# Certification Tracking

> **Sub-Area**: [Staff Profiles & HR](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Monitor clinical certifications required for orthodontic practice operations including X-ray certification, CPR/BLS, HIPAA training, OSHA compliance, and specialty certifications (Invisalign, Incognito, etc.). Tracks CE credits earned and generates compliance reports to ensure all clinical staff maintain required certifications.

---

## Core Requirements

- [ ] Track required certifications per role
- [ ] Monitor certification expiration dates
- [ ] Record CE credits earned toward renewal
- [ ] Generate certification compliance reports
- [ ] Implement automated renewal reminders
- [ ] Store certification documents
- [ ] Define role-based certification requirements

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/:id/certifications` | `staff:read` | List certifications |
| POST | `/api/staff/:id/certifications` | `credentials:manage` | Add certification |
| PUT | `/api/staff/certifications/:certId` | `credentials:manage` | Update certification |
| DELETE | `/api/staff/certifications/:certId` | `credentials:manage` | Remove certification |
| GET | `/api/staff/certifications/expiring` | `staff:read` | Get expiring certifications |
| GET | `/api/staff/certifications/compliance` | `staff:read` | Get compliance report |

---

## Data Model

```prisma
model Certification {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  certificationType CertificationType
  certificationName String
  issuingOrganization String
  certificateNumber String?

  issueDate     DateTime
  expirationDate DateTime?
  renewalDueDate DateTime?

  ceCredits     Decimal?
  ceCategory    String?
  status        CertificationStatus @default(ACTIVE)
  documentUrl   String?

  @@index([staffProfileId])
  @@index([certificationType])
  @@index([expirationDate])
}

enum CertificationType {
  XRAY_CERTIFICATION
  CPR_BLS
  HIPAA
  OSHA
  INFECTION_CONTROL
  NITROUS_OXIDE
  INVISALIGN
  INCOGNITO
  SURESMILE
  DAMON
  OTHER
}
```

---

## Business Rules

- Clinical staff must maintain: X-ray (state-dependent), CPR/BLS, Infection Control
- All staff must maintain: HIPAA, OSHA training
- X-ray certification requirements vary by state
- CPR/BLS typically requires renewal every 2 years
- HIPAA/OSHA training typically annual
- Specialty certifications (Invisalign, etc.) enhance capabilities
- Expired certifications restrict staff from performing related procedures

### Required Certifications by Role

| Role | X-Ray | CPR | HIPAA | OSHA | Infection Control |
|------|-------|-----|-------|------|-------------------|
| Orthodontist | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dental Assistant | ✓* | ✓ | ✓ | ✓ | ✓ |
| Front Desk | - | - | ✓ | ✓ | - |

*State-dependent requirements

---

## Dependencies

**Depends On:**
- Employee Profiles
- Document Storage
- Notification Service

**Required By:**
- Staff scheduling (ensures qualified staff)
- Compliance audits
- CE Credit Management

---

## Notes

- State-specific requirements should be configurable
- Consider: integration with certification training platforms
- Specialty certifications may require manufacturer verification
