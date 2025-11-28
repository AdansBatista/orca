# Credential Management

> **Sub-Area**: [Staff Profiles & HR](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Track and monitor provider credentials including state dental licenses, DEA registrations, NPI numbers, and specialty certifications. Implements automated expiration alerts at 90/60/30 days to ensure providers maintain valid credentials for patient care and billing.

---

## Core Requirements

- [ ] Record credential details (type, number, issuing authority)
- [ ] Track expiration and renewal dates
- [ ] Implement automated expiration alerts (90/60/30 days)
- [ ] Support credential verification workflow
- [ ] Store credential document copies
- [ ] Generate credential compliance reports
- [ ] Flag providers with expired credentials for scheduling restrictions

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/:id/credentials` | `credentials:read` | List staff credentials |
| POST | `/api/staff/:id/credentials` | `credentials:manage` | Add credential |
| PUT | `/api/staff/credentials/:credentialId` | `credentials:manage` | Update credential |
| DELETE | `/api/staff/credentials/:credentialId` | `credentials:manage` | Remove credential |
| POST | `/api/staff/credentials/:credentialId/verify` | `credentials:manage` | Mark as verified |
| GET | `/api/staff/credentials/expiring` | `credentials:read` | Get expiring credentials |

---

## Data Model

```prisma
model Credential {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  credentialType CredentialType
  credentialNumber String
  issuingAuthority String
  issuingState  String?

  issueDate     DateTime
  expirationDate DateTime?
  renewalDate   DateTime?

  status        CredentialStatus @default(ACTIVE)
  verifiedAt    DateTime?
  verifiedBy    String?  @db.ObjectId
  documentUrl   String?

  @@index([staffProfileId])
  @@index([expirationDate])
  @@index([status])
}

enum CredentialType {
  DENTAL_LICENSE
  ORTHO_SPECIALTY_LICENSE
  DEA_REGISTRATION
  NPI
  STATE_CONTROLLED_SUBSTANCE
  HYGIENIST_LICENSE
  EFDA_CERTIFICATION
}

enum CredentialStatus {
  ACTIVE
  EXPIRED
  PENDING_RENEWAL
  SUSPENDED
  REVOKED
  PENDING_VERIFICATION
}
```

---

## Business Rules

- Expiration alerts sent at 90, 60, and 30 days before expiration
- Expired credentials automatically update status to EXPIRED
- Providers with expired required credentials flagged in scheduling
- NPI numbers are permanent (no expiration)
- DEA registration typically 3-year renewal cycle
- State licenses vary by state for renewal periods
- Verification should include checking against state databases when available

---

## Dependencies

**Depends On:**
- Employee Profiles
- Document Storage (for credential copies)
- Notification Service (for alerts)

**Required By:**
- Provider scheduling
- Billing (NPI required)
- Compliance reporting

---

## Notes

- DEA verification may require integration with DEA database
- State license verification APIs vary by state
- Consider: automated verification service integration
- HIPAA requires tracking who can prescribe controlled substances
