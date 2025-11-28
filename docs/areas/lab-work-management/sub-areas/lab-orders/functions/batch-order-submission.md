# Batch Order Submission

> **Sub-Area**: [Lab Orders](../) | **Status**: 📋 Planned | **Priority**: Low

---

## Overview

Batch Order Submission enables staff to submit multiple draft orders to the same lab in a single operation. This is efficient for end-of-day processing when multiple orders have been prepared. Batch submission can also request combined shipping to reduce costs.

---

## Core Requirements

- [ ] Select multiple draft orders for batch submission
- [ ] Filter pending orders by lab vendor
- [ ] Submit all selected orders in single operation
- [ ] Request combined shipping for batch orders
- [ ] Track batch submission status
- [ ] Handle individual order failures gracefully
- [ ] Confirmation summary for all submitted orders
- [ ] View pending orders awaiting submission

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/orders/pending` | `lab:track` | List orders pending submission |
| POST | `/api/lab/orders/batch/submit` | `lab:submit_order` | Submit multiple orders |
| GET | `/api/lab/orders/batch/:batchId` | `lab:track` | Get batch submission status |
| POST | `/api/lab/orders/batch/validate` | `lab:submit_order` | Validate batch before submit |

---

## Data Model

```prisma
model LabOrderBatch {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  orderIds      String[] @db.ObjectId
  orderCount    Int

  status        BatchStatus @default(PENDING)
  combineShipping Boolean @default(false)

  submittedAt   DateTime?
  submittedBy   String   @db.ObjectId

  // Results
  successCount  Int      @default(0)
  failureCount  Int      @default(0)
  errors        Json?    // Array of {orderId, error}

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([clinicId])
  @@index([vendorId])
  @@index([status])
}

enum BatchStatus {
  PENDING
  PROCESSING
  COMPLETED
  PARTIAL_FAILURE
  FAILED
}
```

---

## Business Rules

- All orders in batch must be for same vendor
- All orders must be in DRAFT status
- Failed orders remain in draft for individual retry
- Successful orders marked SUBMITTED
- Combined shipping requires vendor support

---

## Dependencies

**Depends On:**
- Lab Order Creation (draft orders to submit)
- Lab Vendor Management (vendor submission methods)

**Required By:**
- Order Tracking (submitted orders tracked)

---

## Notes

- Consider scheduled auto-submission at end of day
- Show real-time progress for large batches
- Email confirmation of batch submission results

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
