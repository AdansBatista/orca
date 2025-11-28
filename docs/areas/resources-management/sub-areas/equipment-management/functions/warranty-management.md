# Warranty Management

> **Sub-Area**: [Equipment Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Warranty Management tracks equipment warranties and service contracts to maximize coverage benefits and prevent unexpected repair costs. The system records warranty terms, monitors expiration dates, generates proactive alerts, documents warranty claims, and manages extended warranty and service contract options. This ensures practices take full advantage of coverage before expiration and maintain accurate records for claim support.

---

## Core Requirements

- [ ] Record warranty start dates, terms, and expiration dates
- [ ] Set warranty expiration alerts (30, 60, 90 days before expiry)
- [ ] Track service contract terms and renewal dates
- [ ] Document warranty claims with claim numbers
- [ ] Link to vendor contact information for claims
- [ ] Track extended warranty options and coverage
- [ ] Manage multiple warranty types per equipment (parts, labor, on-site)
- [ ] View warranty status dashboard
- [ ] Generate warranty expiration reports
- [ ] Track claim outcomes (approved, denied, pending)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/equipment/:id/warranty` | `equipment:read` | Get warranty details |
| PUT | `/api/resources/equipment/:id/warranty` | `equipment:update` | Update warranty info |
| GET | `/api/resources/warranties/expiring` | `equipment:read` | Get expiring warranties |
| POST | `/api/resources/equipment/:id/warranty/claims` | `equipment:update` | Create warranty claim |
| GET | `/api/resources/equipment/:id/warranty/claims` | `equipment:read` | Get warranty claims |
| GET | `/api/resources/service-contracts` | `equipment:read` | List service contracts |
| POST | `/api/resources/service-contracts` | `equipment:create` | Add service contract |

---

## Data Model

```prisma
// Fields on Equipment model
model Equipment {
  // ... existing fields ...

  // Warranty
  warrantyStartDate DateTime?
  warrantyExpiry    DateTime?
  warrantyNotes     String?
  warrantyTerms     String?   // Coverage description

  // Extended warranty
  hasExtendedWarranty Boolean @default(false)
  extendedWarrantyExpiry DateTime?

  // Service contract
  serviceContractId String? @db.ObjectId
}

model ServiceContract {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId

  // Contract details
  contractNumber  String
  vendorId        String   @db.ObjectId

  // Coverage
  description     String?
  coverageType    CoverageType
  coveredEquipment String[] @db.ObjectId  // Equipment IDs covered

  // Terms
  startDate       DateTime
  endDate         DateTime
  renewalDate     DateTime?
  autoRenew       Boolean  @default(false)

  // Costs
  annualCost      Decimal?
  monthlyPayment  Decimal?

  // Contact
  contactName     String?
  contactPhone    String?
  contactEmail    String?

  // Status
  status          ContractStatus @default(ACTIVE)

  // Documents
  contractUrl     String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  vendor    Supplier @relation(fields: [vendorId], references: [id])
  claims    WarrantyClaim[]

  @@index([clinicId])
  @@index([vendorId])
  @@index([endDate])
}

enum CoverageType {
  FULL_SERVICE       // Parts, labor, and on-site
  PARTS_AND_LABOR    // Parts and labor, no travel
  PARTS_ONLY         // Parts replacement only
  PREVENTIVE         // Preventive maintenance only
  EXTENDED_WARRANTY  // Extended manufacturer warranty
}

enum ContractStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PENDING_RENEWAL
}

model WarrantyClaim {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  equipmentId     String   @db.ObjectId
  repairId        String?  @db.ObjectId

  // Claim details
  claimNumber     String?
  vendorClaimNumber String?
  claimDate       DateTime @default(now())
  issueDescription String

  // Coverage source
  coverageType    ClaimCoverageType
  serviceContractId String? @db.ObjectId

  // Status
  status          ClaimStatus @default(SUBMITTED)

  // Resolution
  resolution      String?
  resolvedDate    DateTime?

  // Financial
  claimedAmount   Decimal?
  approvedAmount  Decimal?
  denialReason    String?

  // Documents
  attachments     String[]

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String   @db.ObjectId

  // Relations
  clinic    Clinic    @relation(fields: [clinicId], references: [id])
  equipment Equipment @relation(fields: [equipmentId], references: [id])

  @@index([clinicId])
  @@index([equipmentId])
  @@index([status])
  @@index([claimDate])
}

enum ClaimCoverageType {
  MANUFACTURER_WARRANTY
  EXTENDED_WARRANTY
  SERVICE_CONTRACT
}

enum ClaimStatus {
  SUBMITTED
  IN_REVIEW
  APPROVED
  PARTIALLY_APPROVED
  DENIED
  COMPLETED
  CANCELLED
}
```

---

## Business Rules

- Warranty expiration alerts generated at configurable intervals (default: 30, 60, 90 days)
- Repairs should automatically check warranty status and prompt for claim creation
- Expired warranties cannot have new claims submitted
- Service contracts can cover multiple pieces of equipment
- Contract renewal reminders generated 60 days before expiration
- Claim documentation should include repair record reference
- Denied claims should capture denial reason for future reference

---

## Dependencies

**Depends On:**
- Equipment Catalog (requires equipment registration)
- Repair History (claims linked to repairs)
- Supplier Management (vendor contact information)
- Auth & Authorization (user authentication, permissions)

**Required By:**
- Repair History (warranty claim verification)
- Financial Management (warranty/contract cost tracking)

---

## Notes

- Consider integration with vendor warranty registration systems
- Reminder emails should include equipment details and coverage terms
- Dashboard should highlight equipment without warranty (risk exposure)
- Extended warranty purchase recommendations could be based on equipment type reliability
- Service contract cost-benefit analysis compared to repair history

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
