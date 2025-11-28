# Contract Management

> **Sub-Area**: [Lab Vendor Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Contract Management tracks agreements with lab vendors including term dates, discount terms, minimum volume commitments, and service level agreements. The system provides renewal reminders and stores contract documents for reference.

---

## Core Requirements

- [ ] Store contract documents (PDF) securely
- [ ] Track contract start and end dates
- [ ] Configure renewal reminders before expiration
- [ ] Record negotiated discount percentages
- [ ] Track minimum volume commitments
- [ ] Document service level agreements (SLA)
- [ ] Support auto-renewal flags
- [ ] Track contract amendments

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/contracts` | `lab:manage_vendors` | List contracts |
| GET | `/api/lab/contracts/:id` | `lab:manage_vendors` | Get contract details |
| POST | `/api/lab/contracts` | `lab:manage_vendors` | Create contract |
| PUT | `/api/lab/contracts/:id` | `lab:manage_vendors` | Update contract |
| GET | `/api/lab/contracts/expiring` | `lab:manage_vendors` | Get expiring contracts |
| POST | `/api/lab/contracts/:id/document` | `lab:manage_vendors` | Upload contract document |

---

## Data Model

```prisma
model LabContract {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  contractNumber String?
  name          String
  status        ContractStatus @default(ACTIVE)

  startDate     DateTime
  endDate       DateTime?
  autoRenew     Boolean  @default(false)
  renewalNotice Int?     // Days before expiry

  discountPercent Decimal?
  minimumVolume Int?
  volumePeriod  String?  // monthly, quarterly, annual
  slaTerms      String?

  documentUrl   String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([clinicId])
  @@index([vendorId])
  @@index([endDate])
}
```

---

## Business Rules

- Contract discount applies to all orders for that vendor
- Renewal notifications sent at configured notice period
- Expired contracts marked automatically
- Contract terms visible on vendor profile
- Volume commitments tracked against actual orders

---

## Dependencies

**Depends On:**
- Lab Directory Management (vendor context)

**Required By:**
- Pricing & Fee Schedules (contract discounts)
- Performance Metrics (SLA tracking)

---

## Notes

- Consider contract compliance reporting
- Support multi-year contracts with annual terms
- Alert when approaching minimum volume deadline

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
