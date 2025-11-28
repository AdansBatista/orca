# Receiving

> **Sub-Area**: [Order Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Receiving handles the process of accepting vendor deliveries, verifying quantities against purchase orders, inspecting quality, and updating inventory. This function supports partial receiving for split shipments, quality inspection with acceptance/rejection, lot number and expiration date capture for medical supplies, and automatic inventory updates upon receipt completion.

---

## Core Requirements

- [ ] Create receiving records against purchase orders
- [ ] Match received items to PO line items
- [ ] Verify and record quantities received
- [ ] Support partial receiving for split shipments
- [ ] Perform quality inspection with pass/fail status
- [ ] Document rejection reasons for failed items
- [ ] Capture lot numbers and serial numbers
- [ ] Record expiration dates for dated products
- [ ] Auto-update inventory upon receipt completion
- [ ] Generate receiving reports and packing slip capture

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/orders/:id/receipts` | `order:read` | Get order receipts |
| POST | `/api/vendors/orders/:id/receive` | `order:receive` | Create receipt |
| GET | `/api/vendors/receipts/:id` | `order:read` | Get receipt details |
| PUT | `/api/vendors/receipts/:id` | `order:receive` | Update receipt |
| POST | `/api/vendors/receipts/:id/complete` | `order:receive` | Complete receiving |
| GET | `/api/vendors/orders/pending-receipt` | `order:read` | Orders awaiting receipt |
| POST | `/api/vendors/receipts/:id/inspect` | `order:receive` | Record inspection |

---

## Data Model

```prisma
model OrderReceipt {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  purchaseOrderId String @db.ObjectId

  // Receipt Details
  receiptNumber String   @unique
  receiptDate   DateTime @default(now())
  receivedBy    String   @db.ObjectId

  // Shipping Info
  trackingNumber String?
  carrier       String?
  packingSlipNumber String?

  // Status
  status        ReceiptStatus @default(PENDING)

  // Quality Check
  inspectedBy   String?  @db.ObjectId
  inspectedAt   DateTime?
  qualityStatus QualityStatus?

  // Notes
  notes         String?

  // Documents
  documentUrl   String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  items         OrderReceiptItem[]

  @@index([clinicId])
  @@index([purchaseOrderId])
  @@index([receiptNumber])
}

model OrderReceiptItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  orderReceiptId String  @db.ObjectId
  purchaseOrderItemId String @db.ObjectId

  // Quantities
  quantityReceived Decimal
  quantityAccepted Decimal?
  quantityRejected Decimal?

  // Quality
  qualityStatus QualityStatus?
  rejectionReason String?

  // Lot/Serial Tracking
  lotNumber     String?
  serialNumber  String?
  expirationDate DateTime?

  // Storage Location
  storageLocation String?

  @@index([orderReceiptId])
  @@index([purchaseOrderItemId])
}

enum ReceiptStatus {
  PENDING
  PROCESSING
  COMPLETED
  REJECTED
}

enum QualityStatus {
  PASSED
  FAILED
  PARTIAL_PASS
  PENDING_INSPECTION
}
```

---

## Business Rules

- Receipt numbers: RCV-{YEAR}-{SEQUENCE}
- Cannot receive more than ordered quantity (flag over-shipments)
- Partial receipts update PO status to PARTIALLY_RECEIVED
- All items received updates PO to RECEIVED
- Quality inspection may be required for certain product categories
- Rejected items initiate return process
- Lot numbers required for medical/sterile supplies
- Expiration dates validated against acceptable minimums
- Inventory auto-updated when receipt completed
- Three-way match: PO quantity vs Receipt quantity vs Invoice quantity

---

## Dependencies

**Depends On:**
- Purchase Orders (PO to receive against)
- Order Tracking (delivery information)

**Required By:**
- Returns (items to return)
- Vendor Performance (quality and accuracy metrics)
- Resources Management (inventory updates)
- Financial Management (three-way match)

---

## Notes

- Barcode scanning for faster receiving
- Photo documentation for damaged items
- Storage location assignment for put-away
- Packing slip image capture
- Receiving dashboard showing expected deliveries
- Mobile-optimized for warehouse receiving

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
