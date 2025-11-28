# Credential Tracking

> **Sub-Area**: [Vendor Profiles](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Credential Tracking enables practices to monitor vendor licenses, insurance certificates, and professional certifications. This function ensures vendor compliance by tracking expiration dates, sending automated alerts before credentials expire, and maintaining verification records. Critical for risk management and regulatory compliance, especially for vendors with on-site access or handling of medical supplies.

---

## Core Requirements

- [ ] Add and manage multiple credentials per vendor
- [ ] Support various credential types (licenses, insurance, certifications, W-9)
- [ ] Track issue dates, expiration dates, and issuing authorities
- [ ] Record insurance coverage amounts and types
- [ ] Upload and store credential document copies
- [ ] Implement verification workflow with status tracking
- [ ] Generate automated expiration alerts at 90/60/30 days
- [ ] Flag vendors with expired required credentials
- [ ] Provide dashboard of expiring credentials across all vendors
- [ ] Support credential renewal tracking

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/:id/credentials` | `vendor:read` | List vendor credentials |
| POST | `/api/vendors/:id/credentials` | `vendor:update` | Add new credential |
| PUT | `/api/vendors/credentials/:credentialId` | `vendor:update` | Update credential |
| DELETE | `/api/vendors/credentials/:credentialId` | `vendor:update` | Delete credential |
| POST | `/api/vendors/credentials/:credentialId/verify` | `vendor:update` | Mark as verified |
| GET | `/api/vendors/credentials/expiring` | `vendor:read` | Get expiring credentials |

---

## Data Model

```prisma
model VendorCredential {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Credential Details
  credentialType VendorCredentialType
  credentialName String
  credentialNumber String?
  issuingAuthority String?

  // Dates
  issueDate     DateTime?
  expirationDate DateTime?

  // Coverage (for insurance)
  coverageAmount Decimal?
  coverageType  String?

  // Status
  status        CredentialStatus @default(ACTIVE)
  verifiedAt    DateTime?
  verifiedBy    String?  @db.ObjectId

  // Documents
  documentUrl   String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  vendor        Vendor   @relation(fields: [vendorId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([credentialType])
  @@index([expirationDate])
  @@index([status])
}

enum VendorCredentialType {
  BUSINESS_LICENSE
  PROFESSIONAL_LICENSE
  GENERAL_LIABILITY_INSURANCE
  PROFESSIONAL_LIABILITY_INSURANCE
  WORKERS_COMP_INSURANCE
  AUTO_INSURANCE
  BOND
  FDA_REGISTRATION
  DEA_LICENSE
  STATE_LICENSE
  CERTIFICATION
  W9
  COI
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

- Insurance credentials must have coverage amount and type
- Credentials expire automatically when expiration date passes
- Alert schedule: 90 days (initial), 60 days (reminder), 30 days (urgent)
- Vendors with expired required credentials should be flagged or placed on hold
- Service providers with on-site access require valid liability insurance
- W-9 must be on file before payments can be processed
- Verification requires reviewer user ID and timestamp
- FDA registration required for medical device suppliers

---

## Dependencies

**Depends On:**
- Vendor Profile Management (parent vendor record)
- Document Storage (credential document uploads)
- Email Service (expiration notifications)

**Required By:**
- Vendor Status (compliance-based holds)
- Contract Management (credential requirements in contracts)

---

## Notes

- Consider minimum coverage requirements by vendor category
- Background check tracking for on-site service providers
- Integration with insurance verification services (future)
- Credential requirements may vary by state/jurisdiction
- HIPAA compliance: BAA is a special credential for PHI-accessing vendors

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
