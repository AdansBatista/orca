# Inventory Transfers

> **Sub-Area**: [Inventory Management](../) | **Status**: 📋 Planned | **Priority**: Low

---

## Overview

Inventory Transfers manages the movement of supplies between clinic locations in multi-location practices. The system handles transfer requests, approvals, tracking during transit, and stock updates upon receipt. This enables efficient resource allocation, supports urgent supply needs, and helps balance inventory across locations to reduce waste and stockouts.

---

## Core Requirements

- [ ] Request inventory from other locations
- [ ] Transfer excess inventory to other locations
- [ ] Route transfers for approval
- [ ] Track items in transit
- [ ] Update stock at source and destination locations
- [ ] Handle lot-level tracking for transfers
- [ ] Maintain complete transfer history
- [ ] Support urgent/emergency transfers
- [ ] Generate transfer documentation
- [ ] View inventory distribution across all locations

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/transfers` | `inventory:read` | List transfers |
| GET | `/api/resources/transfers/:id` | `inventory:read` | Get transfer details |
| POST | `/api/resources/transfers` | `inventory:transfer` | Request transfer |
| PUT | `/api/resources/transfers/:id` | `inventory:transfer` | Update transfer |
| POST | `/api/resources/transfers/:id/approve` | `inventory:approve` | Approve transfer |
| POST | `/api/resources/transfers/:id/reject` | `inventory:approve` | Reject transfer |
| POST | `/api/resources/transfers/:id/ship` | `inventory:transfer` | Mark as shipped |
| POST | `/api/resources/transfers/:id/receive` | `inventory:receive` | Mark as received |
| GET | `/api/resources/inventory/distribution` | `inventory:read` | Cross-location view |

---

## Data Model

```prisma
model InventoryTransfer {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  fromClinicId    String   @db.ObjectId
  toClinicId      String   @db.ObjectId

  // Transfer identification
  transferNumber  String   @unique

  // Status
  status          TransferStatus @default(REQUESTED)

  // Dates
  requestedDate   DateTime @default(now())
  approvedDate    DateTime?
  shippedDate     DateTime?
  receivedDate    DateTime?

  // People
  requestedBy     String   @db.ObjectId
  approvedBy      String?  @db.ObjectId
  shippedBy       String?  @db.ObjectId
  receivedBy      String?  @db.ObjectId
  rejectedBy      String?  @db.ObjectId

  // Rejection
  rejectionReason String?

  // Items
  items           TransferItem[]

  // Shipping
  shippingMethod  String?
  trackingNumber  String?
  carrierName     String?

  // Notes
  reason          String?
  notes           String?

  // Priority
  isUrgent        Boolean  @default(false)
  urgentReason    String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  fromClinic    Clinic @relation("TransferFrom", fields: [fromClinicId], references: [id])
  toClinic      Clinic @relation("TransferTo", fields: [toClinicId], references: [id])

  @@index([fromClinicId])
  @@index([toClinicId])
  @@index([status])
  @@index([requestedDate])
}

enum TransferStatus {
  REQUESTED       // Request submitted
  APPROVED        // Approved by source location
  REJECTED        // Request rejected
  PREPARING       // Being picked/packed
  IN_TRANSIT      // Shipped
  RECEIVED        // Received at destination
  CANCELLED       // Cancelled before completion
}

model TransferItem {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  transferId      String   @db.ObjectId
  itemId          String   @db.ObjectId
  lotId           String?  @db.ObjectId

  // Quantities
  requestedQuantity Int
  approvedQuantity  Int?
  shippedQuantity   Int?
  receivedQuantity  Int?

  // Status
  status          TransferItemStatus @default(REQUESTED)

  // Variance
  varianceReason  String?

  // Relations
  transfer  InventoryTransfer @relation(fields: [transferId], references: [id])
  item      InventoryItem     @relation(fields: [itemId], references: [id])

  @@index([transferId])
  @@index([itemId])
}

enum TransferItemStatus {
  REQUESTED
  APPROVED
  PARTIALLY_APPROVED
  REJECTED
  SHIPPED
  RECEIVED
  VARIANCE
}
```

---

## Business Rules

- Transfers require approval from source location admin
- Stock deducted from source upon shipment (not request)
- Stock added to destination upon receipt confirmation
- Urgent transfers can bypass normal approval with super admin
- Lot tracking maintained through transfer for traceability
- Variance between shipped and received documented
- Transfer costs may be tracked for cost allocation
- Cancelled transfers before shipment have no stock impact

---

## Dependencies

**Depends On:**
- Supplies Catalog (items being transferred)
- Stock Tracking (stock level updates)
- Multi-clinic Setup (requires multiple locations)
- Auth & Authorization (cross-location permissions)

**Required By:**
- Stock Tracking (updates from transfers)
- Expiration Monitoring (lot movement tracking)
- Inventory Analytics (cross-location visibility)

---

## Notes

- Transfer requests can be initiated by either location
- Dashboard shows pending requests for both source and destination
- Super admin can view and manage all transfers across locations
- Consider integration with internal courier/shipping
- Transfer history useful for analyzing inter-location flow
- Automatic transfer suggestions based on stock imbalances

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
