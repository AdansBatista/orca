# Bad Debt Management

> **Sub-Area**: [Collections Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Bad Debt Management handles write-offs for uncollectible accounts. This function provides a request and approval workflow for write-offs, tracks write-off reasons for analysis, supports partial and full write-offs, manages recovery of previously written-off amounts, and generates reports for tax documentation purposes.

---

## Core Requirements

- [ ] Write-off request and approval workflow
- [ ] Write-off reason categorization and tracking
- [ ] Support partial and full write-offs
- [ ] Write-off recovery if paid later
- [ ] Approval thresholds by amount
- [ ] Write-off reporting and analytics
- [ ] Tax documentation support (1099-C if applicable)
- [ ] Audit trail for all write-off activity

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/collections/write-offs` | `collections:read` | List write-offs |
| GET | `/api/collections/write-offs/:id` | `collections:read` | Get write-off details |
| POST | `/api/collections/write-offs` | `collections:write_off` | Request write-off |
| GET | `/api/collections/write-offs/pending` | `collections:read` | Pending approvals |
| POST | `/api/collections/write-offs/:id/approve` | `collections:approve_write_off` | Approve write-off |
| POST | `/api/collections/write-offs/:id/reject` | `collections:approve_write_off` | Reject write-off |
| POST | `/api/collections/write-offs/:id/recover` | `collections:write_off` | Record recovery |
| GET | `/api/collections/write-offs/report` | `collections:read` | Write-off report |

---

## Data Model

```prisma
model WriteOff {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  accountId     String   @db.ObjectId
  invoiceId     String?  @db.ObjectId

  // Write-off identification
  writeOffNumber String  @unique
  writeOffType   WriteOffType @default(FULL)

  // Amount
  amount         Decimal
  originalBalance Decimal

  // Reason
  reason         WriteOffReason
  reasonDetails  String?
  supportingDocs String[]  // URLs to supporting documents

  // Approval workflow
  status         WriteOffStatus @default(PENDING)
  requestedBy    String   @db.ObjectId
  requestedAt    DateTime @default(now())
  requestNotes   String?

  approvedBy     String?  @db.ObjectId
  approvedAt     DateTime?
  approvalNotes  String?

  rejectedBy     String?  @db.ObjectId
  rejectedAt     DateTime?
  rejectionReason String?

  // Recovery tracking
  recoveredAmount  Decimal @default(0)
  recoveries       WriteOffRecovery[]

  // Tax reporting
  require1099C     Boolean @default(false)
  form1099CSent    Boolean @default(false)
  form1099CSentAt  DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([accountId])
  @@index([writeOffNumber])
  @@index([status])
  @@index([reason])
}

model WriteOffRecovery {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  writeOffId    String   @db.ObjectId

  // Recovery details
  amount        Decimal
  paymentId     String?  @db.ObjectId
  paymentDate   DateTime
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  recordedBy String?  @db.ObjectId

  // Relations
  writeOff    WriteOff @relation(fields: [writeOffId], references: [id])

  @@index([writeOffId])
  @@index([paymentDate])
}

enum WriteOffType {
  FULL
  PARTIAL
}

enum WriteOffReason {
  BANKRUPTCY
  DECEASED
  UNCOLLECTIBLE
  STATUTE_OF_LIMITATIONS
  SMALL_BALANCE
  HARDSHIP
  INSURANCE_DENIAL
  CHARITY_CARE
  BILLING_ERROR
  OTHER
}

enum WriteOffStatus {
  PENDING
  APPROVED
  REJECTED
  RECOVERED
  PARTIALLY_RECOVERED
}
```

---

## Business Rules

- Write-offs over threshold require manager approval
- Small balance write-offs (< $25) may auto-approve
- Bankruptcy write-offs require proof of filing
- Deceased write-offs may require death certificate
- IRS 1099-C required for write-offs > $600
- Written-off accounts flagged for future payment acceptance
- Recovery reverses write-off proportionally
- Write-off history retained indefinitely

---

## Dependencies

**Depends On:**
- Collection Agency Integration (post-agency write-offs)
- Late Payment Tracking (collection exhaustion)
- Patient Account Management (balance adjustment)

**Required By:**
- Financial Reporting (bad debt expense)
- Tax Reporting (1099-C generation)

---

## Notes

- Implement write-off batch processing for small balances
- Track write-off rate by patient demographics
- Consider offering hardship/charity care programs
- Generate annual write-off summary for accounting
- Alert on write-off recovery opportunities

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
