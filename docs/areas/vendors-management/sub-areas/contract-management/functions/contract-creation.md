# Contract Creation

> **Sub-Area**: [Contract Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Contract Creation enables practices to create and store vendor contracts with complete document management and version control. This function supports various contract types common to orthodontic practices including supply agreements, service contracts, maintenance agreements, and BAAs. Contracts are linked to vendors and include approval workflows for high-value agreements.

---

## Core Requirements

- [ ] Create contracts with complete information (type, dates, value, terms)
- [ ] Support multiple contract types (Supply, Service, Maintenance, Lease, BAA, etc.)
- [ ] Upload and store contract documents with version tracking
- [ ] Auto-generate unique contract numbers with vendor prefix
- [ ] Link contracts to specific vendors
- [ ] Assign contracts to specific locations or organization-wide
- [ ] Implement approval workflow for contracts above threshold
- [ ] Track contract status through lifecycle (Draft, Active, Expired, etc.)
- [ ] Support contract amendments with history tracking
- [ ] Search and filter contracts by vendor, type, status, dates

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/contracts` | `contract:read` | List all contracts |
| GET | `/api/vendors/:id/contracts` | `contract:read` | Get vendor contracts |
| GET | `/api/vendors/contracts/:id` | `contract:read` | Get contract details |
| POST | `/api/vendors/:vendorId/contracts` | `contract:create` | Create contract |
| PUT | `/api/vendors/contracts/:id` | `contract:update` | Update contract |
| DELETE | `/api/vendors/contracts/:id` | `contract:delete` | Delete contract |
| POST | `/api/vendors/contracts/:id/approve` | `contract:approve` | Approve contract |
| PUT | `/api/vendors/contracts/:id/status` | `contract:update` | Update status |
| GET | `/api/vendors/contracts/search` | `contract:read` | Search contracts |

---

## Data Model

```prisma
model Contract {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Contract Details
  contractNumber String  @unique
  contractType  ContractType
  title         String
  description   String?

  // Dates
  startDate     DateTime
  endDate       DateTime?
  renewalDate   DateTime?

  // Value
  totalValue    Decimal?
  currency      String   @default("USD")

  // Terms
  autoRenewal   Boolean  @default(false)
  renewalTerms  String?
  terminationNotice Int?

  // Status
  status        ContractStatus @default(DRAFT)
  signedAt      DateTime?
  signedBy      String?  @db.ObjectId

  // Documents
  documentUrl   String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId
  approvedBy String? @db.ObjectId
  approvedAt DateTime?

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  vendor        Vendor   @relation(fields: [vendorId], references: [id])
  terms         ContractTerm[]
  slas          ContractSLA[]
  amendments    ContractAmendment[]

  @@index([clinicId])
  @@index([vendorId])
  @@index([contractNumber])
  @@index([status])
  @@index([endDate])
}

enum ContractType {
  SUPPLY_AGREEMENT
  SERVICE_AGREEMENT
  MAINTENANCE
  LEASE
  SUBSCRIPTION
  CONSULTING
  NDA
  BAA
  MASTER_SERVICE
  PURCHASE
  OTHER
}

enum ContractStatus {
  DRAFT
  PENDING_APPROVAL
  PENDING_SIGNATURE
  ACTIVE
  EXPIRED
  TERMINATED
  RENEWED
  ON_HOLD
}
```

---

## Business Rules

- Contract numbers auto-generated: {VENDOR_CODE}-C{SEQUENCE}
- Contracts over threshold require management approval
- Final contracts must have signed document uploaded
- Only active vendors can have new contracts created
- BAA contracts required for vendors with PHI access
- Contracts cannot be edited after ACTIVE status (use amendments)
- End date required except for perpetual contracts
- Auto-renewal contracts flagged for review before renewal
- Expired contracts retained for reference (soft archive)

---

## Dependencies

**Depends On:**
- Vendor Profile Management (vendor record)
- Document Storage (contract documents)
- Authentication & Authorization (approval workflow)

**Required By:**
- Terms Tracking (contract terms)
- Renewal Management (renewal tracking)
- Pricing Agreements (pricing terms)
- SLA Monitoring (service levels)
- Order Management (contracted pricing)

---

## Notes

- Consider e-signature integration (DocuSign, Adobe Sign)
- Support for multi-party contracts (rare but possible)
- Contract templates for common agreement types
- Compliance: BAA tracking critical for HIPAA
- Alert on contracts without documents in ACTIVE status

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
