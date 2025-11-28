# Returns

> **Sub-Area**: [Order Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Returns handles the process of returning items to vendors for credit, exchange, or replacement. This function manages return merchandise authorization (RMA) requests, documents return reasons, tracks return shipments, and reconciles credits received. Supports various return scenarios including damaged goods, wrong items, quality defects, and manufacturer recalls.

---

## Core Requirements

- [ ] Create return requests against purchase orders/receipts
- [ ] Request RMA from vendor with reason documentation
- [ ] Track RMA numbers issued by vendors
- [ ] Document return reasons with detail
- [ ] Generate return shipping labels (where integrated)
- [ ] Track return shipments to vendor
- [ ] Record restocking fees where applicable
- [ ] Track expected and received credits
- [ ] Reconcile credits against vendor payments
- [ ] Update inventory for returned items

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/orders/:id/returns` | `order:read` | Get order returns |
| POST | `/api/vendors/orders/:id/returns` | `order:return` | Create return |
| GET | `/api/vendors/returns/:id` | `order:read` | Get return details |
| PUT | `/api/vendors/returns/:id` | `order:return` | Update return |
| PUT | `/api/vendors/returns/:id/status` | `order:return` | Update status |
| POST | `/api/vendors/returns/:id/ship` | `order:return` | Record shipment |
| POST | `/api/vendors/returns/:id/credit` | `order:return` | Record credit |
| GET | `/api/vendors/returns/pending-credit` | `order:read` | Pending credits |
| GET | `/api/vendors/returns/open` | `order:read` | Open returns |

---

## Data Model

```prisma
model OrderReturn {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  purchaseOrderId String @db.ObjectId
  vendorId      String   @db.ObjectId

  // Return Details
  returnNumber  String   @unique
  rmaNumber     String?  // Vendor's RMA number
  returnDate    DateTime @default(now())
  returnReason  ReturnReason

  // Status
  status        ReturnStatus @default(PENDING)

  // Shipping
  trackingNumber String?
  carrier       String?
  shippedDate   DateTime?

  // Financial
  creditExpected Decimal?
  creditReceived Decimal?
  creditDate    DateTime?
  restockingFee Decimal?

  // Notes
  notes         String?
  vendorNotes   String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  items         OrderReturnItem[]

  @@index([clinicId])
  @@index([purchaseOrderId])
  @@index([vendorId])
  @@index([returnNumber])
  @@index([status])
}

model OrderReturnItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  orderReturnId String   @db.ObjectId
  purchaseOrderItemId String @db.ObjectId

  // Quantities
  quantityReturned Decimal

  // Reason
  returnReason  ReturnReason
  reasonDetails String?

  // Financial
  unitCredit    Decimal?
  lineCredit    Decimal?

  @@index([orderReturnId])
}

enum ReturnReason {
  WRONG_ITEM
  DAMAGED
  DEFECTIVE
  QUANTITY_ERROR
  NOT_ORDERED
  QUALITY_ISSUE
  EXPIRED
  RECALL
  OTHER
}

enum ReturnStatus {
  PENDING
  RMA_REQUESTED
  RMA_RECEIVED
  SHIPPED
  RECEIVED_BY_VENDOR
  CREDIT_PENDING
  CREDIT_RECEIVED
  CLOSED
  CANCELLED
}
```

---

## Business Rules

- Return numbers: RTN-{YEAR}-{SEQUENCE}
- RMA required from vendor before shipping returns
- Photo documentation recommended for damaged/defective items
- Restocking fees tracked and deducted from credit
- Credits tracked until received and matched to A/P
- Returns within vendor return policy timeframe
- Expired product returns per vendor recall procedures
- Inventory adjusted when return shipped
- Issue created in Vendor Performance for quality returns
- Credit discrepancies flagged for follow-up

---

## Dependencies

**Depends On:**
- Purchase Orders (order reference)
- Receiving (receipt reference for returns)
- Vendor Profile Management (vendor contact for RMA)

**Required By:**
- Vendor Performance (quality issue tracking)
- Financial Management (credit reconciliation)
- Resources Management (inventory adjustment)

---

## Notes

- Photo upload for return documentation
- Vendor return policy reference
- Return shipping label generation (carrier integration)
- Batch returns for efficiency
- Return aging report for pending credits
- Integration with vendor portals for RMA requests

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
