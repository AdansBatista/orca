# Purchase Orders

> **Sub-Area**: [Order Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Purchase Orders enables practices to create, manage, and process purchase orders to vendors. This function provides complete PO lifecycle management including order creation with line items, approval workflows based on order value, document generation, vendor transmission, and status tracking. Supports various order types including standard, blanket, planned, emergency, and recurring orders.

---

## Core Requirements

- [ ] Create purchase orders with header and line items
- [ ] Select vendors with validation (approved, active status)
- [ ] Apply contracted pricing automatically when available
- [ ] Auto-generate unique PO numbers with location prefix
- [ ] Support multiple order types (Standard, Blanket, Emergency, etc.)
- [ ] Implement approval workflow based on order amount thresholds
- [ ] Generate PO documents (PDF) for vendor transmission
- [ ] Send orders to vendors via email or EDI
- [ ] Track PO revisions with version history
- [ ] Support multi-location ordering with ship-to addresses

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/orders` | `order:read` | List purchase orders |
| GET | `/api/vendors/:id/orders` | `order:read` | Get vendor orders |
| GET | `/api/vendors/orders/:id` | `order:read` | Get order details |
| POST | `/api/vendors/:vendorId/orders` | `order:create` | Create order |
| PUT | `/api/vendors/orders/:id` | `order:update` | Update order |
| DELETE | `/api/vendors/orders/:id` | `order:delete` | Delete draft order |
| POST | `/api/vendors/orders/:id/submit` | `order:create` | Submit for approval |
| POST | `/api/vendors/orders/:id/approve` | `order:approve` | Approve order |
| POST | `/api/vendors/orders/:id/reject` | `order:approve` | Reject order |
| POST | `/api/vendors/orders/:id/send` | `order:create` | Send to vendor |
| GET | `/api/vendors/orders/:id/pdf` | `order:read` | Generate PDF |

---

## Data Model

```prisma
model PurchaseOrder {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Order Details
  orderNumber   String   @unique
  orderType     PurchaseOrderType @default(STANDARD)

  // Dates
  orderDate     DateTime @default(now())
  expectedDate  DateTime?
  requiredDate  DateTime?

  // Shipping
  shipToAddress Address?
  shippingMethod String?
  shippingCost  Decimal?

  // Totals
  subtotal      Decimal
  taxAmount     Decimal  @default(0)
  discount      Decimal  @default(0)
  totalAmount   Decimal

  // Status
  status        PurchaseOrderStatus @default(DRAFT)

  // References
  requisitionId String?  @db.ObjectId
  contractId    String?  @db.ObjectId

  // Notes
  notes         String?
  vendorNotes   String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy     String?  @db.ObjectId
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?
  submittedBy   String?  @db.ObjectId
  submittedAt   DateTime?

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  vendor        Vendor   @relation(fields: [vendorId], references: [id])
  items         PurchaseOrderItem[]

  @@index([clinicId])
  @@index([vendorId])
  @@index([orderNumber])
  @@index([status])
  @@index([orderDate])
}

model PurchaseOrderItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  purchaseOrderId String @db.ObjectId

  // Item Details
  itemCode      String?
  description   String
  quantity      Decimal
  unit          String   @default("EA")
  unitPrice     Decimal
  discount      Decimal  @default(0)
  taxRate       Decimal  @default(0)
  lineTotal     Decimal

  // Inventory Reference
  inventoryItemId String? @db.ObjectId

  // Received Quantities
  quantityReceived Decimal @default(0)
  quantityReturned Decimal @default(0)

  // Status
  status        OrderItemStatus @default(PENDING)

  @@index([purchaseOrderId])
  @@index([itemCode])
}

enum PurchaseOrderType {
  STANDARD
  BLANKET
  PLANNED
  EMERGENCY
  RECURRING
}

enum PurchaseOrderStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  SENT
  ACKNOWLEDGED
  PARTIALLY_RECEIVED
  RECEIVED
  COMPLETED
  CANCELLED
  ON_HOLD
}
```

---

## Business Rules

- PO numbers: {LOCATION}-PO-{YEAR}-{SEQUENCE} (e.g., LOC1-PO-2024-0001)
- Orders only to approved vendors with ACTIVE status
- Approval thresholds: <$500 Office Manager, $500-$2500 Clinic Admin, >$2500 Owner
- Draft orders editable until submitted
- Submitted orders cannot be modified (must cancel and recreate)
- Apply contracted pricing when contract linked
- Blanket orders release against master agreement
- Emergency orders bypass normal approval (flagged for review)
- Three-way match: PO + Receipt + Invoice before payment

---

## Dependencies

**Depends On:**
- Vendor Profile Management (vendor selection)
- Vendor Status (approved vendors only)
- Contract Management (contracted pricing)
- Authentication & Authorization (approval workflow)

**Required By:**
- Requisitions (conversion to PO)
- Order Tracking (status tracking)
- Receiving (receipt against PO)
- Returns (return against PO)
- Financial Management (invoice matching)

---

## Notes

- PDF generation with practice branding
- Email delivery with PDF attachment
- EDI integration for major vendors (future)
- Catalog integration for item selection
- Budget validation before approval (future)
- Duplicate order detection

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
