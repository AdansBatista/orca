# Collection Agency Integration

> **Sub-Area**: [Collections Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Collection Agency Integration transfers severely delinquent accounts to external collection agencies. This function configures agency partnerships, exports accounts in required formats, tracks accounts sent to collections, records agency payments, and supports recalling accounts from collections. It's the last resort for uncollectible accounts.

---

## Core Requirements

- [ ] Configure collection agency partners
- [ ] Define criteria for agency referral (days, amount, exhausted workflow)
- [ ] Export accounts in agency-required format
- [ ] Track accounts currently with agency
- [ ] Record payments received through agency
- [ ] Calculate and track agency fees
- [ ] Recall accounts from agency
- [ ] Agency performance reporting

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/collections/agencies` | `collections:read` | List agencies |
| POST | `/api/collections/agencies` | `collections:manage` | Add agency |
| PUT | `/api/collections/agencies/:id` | `collections:manage` | Update agency |
| DELETE | `/api/collections/agencies/:id` | `collections:manage` | Remove agency |
| POST | `/api/collections/accounts/:id/send-to-agency` | `collections:send_to_agency` | Send to agency |
| POST | `/api/collections/accounts/:id/recall` | `collections:send_to_agency` | Recall from agency |
| GET | `/api/collections/agencies/:id/accounts` | `collections:read` | List agency accounts |
| GET | `/api/collections/agencies/:id/export` | `collections:export` | Export for agency |
| POST | `/api/collections/agencies/:id/payment` | `collections:manage` | Record agency payment |

---

## Data Model

```prisma
model CollectionAgency {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Agency info
  name          String
  contactName   String?
  phone         String?
  email         String?
  website       String?
  address       Address?

  // Integration
  accountNumber String?  // Clinic's account with agency
  exportFormat  ExportFormat @default(CSV)
  ftpDetails    Json?    // Secure FTP credentials if applicable

  // Fee structure
  feeType       AgencyFeeType @default(PERCENTAGE)
  feePercentage Decimal?
  feeFlat       Decimal?

  // Referral criteria
  minBalance    Decimal  @default(100)
  minDaysOverdue Int     @default(120)
  requireWorkflowComplete Boolean @default(true)

  // Status
  isActive      Boolean  @default(true)

  // Statistics
  totalReferred    Int      @default(0)
  totalCollected   Decimal  @default(0)
  collectionRate   Decimal? // Computed

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  referrals AgencyReferral[]

  @@index([clinicId])
  @@index([isActive])
}

model AgencyReferral {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  agencyId      String   @db.ObjectId
  accountId     String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Referral details
  referralNumber    String   @unique
  referralDate      DateTime @default(now())
  referredBalance   Decimal
  agencyAccountNumber String?

  // Status
  status        AgencyReferralStatus @default(ACTIVE)

  // Collections
  collectedAmount  Decimal @default(0)
  agencyFees       Decimal @default(0)
  netRecovered     Decimal @default(0)
  lastPaymentDate  DateTime?

  // Recall
  recalledAt    DateTime?
  recallReason  String?
  recalledBy    String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  referredBy String?  @db.ObjectId

  // Relations
  clinic    Clinic           @relation(fields: [clinicId], references: [id])
  agency    CollectionAgency @relation(fields: [agencyId], references: [id])
  payments  AgencyPayment[]

  @@index([clinicId])
  @@index([agencyId])
  @@index([accountId])
  @@index([status])
  @@index([referralDate])
}

model AgencyPayment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  referralId    String   @db.ObjectId
  clinicId      String   @db.ObjectId

  // Payment details
  paymentDate   DateTime
  grossAmount   Decimal
  agencyFee     Decimal
  netAmount     Decimal

  // Reference
  agencyReference String?
  checkNumber   String?

  // Timestamps
  createdAt DateTime @default(now())
  recordedBy String? @db.ObjectId

  // Relations
  referral    AgencyReferral @relation(fields: [referralId], references: [id])

  @@index([referralId])
  @@index([clinicId])
  @@index([paymentDate])
}

enum ExportFormat {
  CSV
  XML
  JSON
  FIXED_WIDTH
}

enum AgencyFeeType {
  PERCENTAGE
  FLAT
  TIERED
}

enum AgencyReferralStatus {
  ACTIVE
  COLLECTING
  COLLECTED
  PARTIAL
  RETURNED
  RECALLED
  CLOSED
}
```

---

## Business Rules

- Account must meet all referral criteria before sending
- Collection workflow should be exhausted first
- Patient notified before agency referral
- Referred accounts marked in patient record
- New payments on referred accounts reported to agency
- Agency fee calculated on collections, not referral amount
- Recalled accounts return to internal collection
- HIPAA BAA required with agency before sharing PHI

---

## Dependencies

**Depends On:**
- Collection Workflows (workflow completion)
- Late Payment Tracking (delinquency status)
- Patient Account Management (account data)

**Required By:**
- Bad Debt Management (post-agency write-off)
- Financial Reporting (agency collections)

---

## Notes

- Implement secure file transfer for exports
- Track agency response time and communication
- Consider multiple agency tiers (soft collection vs. hard collection)
- Comply with FDCPA and state collection laws
- Generate monthly agency reconciliation report

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
