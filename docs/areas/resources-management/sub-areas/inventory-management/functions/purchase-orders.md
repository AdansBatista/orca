# Purchase Orders

> **Sub-Area**: [Inventory Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Purchase Orders manages the complete purchasing workflow from order creation through receiving. The system supports manual order creation and auto-generated orders from reorder alerts, routes orders for approval based on amount thresholds, tracks order status, handles receiving with lot creation, and manages partial shipments and backorders. This streamlines the procurement process and maintains accurate inventory upon receipt.

---

## Core Requirements

- [ ] Create purchase orders manually or from reorder alerts
- [ ] Route orders for approval based on amount thresholds
- [ ] Track PO status through complete workflow
- [ ] Submit orders to suppliers (email, portal integration)
- [ ] Receive items against purchase orders
- [ ] Handle partial shipments and backorders
- [ ] Create inventory lots upon receipt
- [ ] Process returns and credits
- [ ] Reconcile invoices against receipts
- [ ] Generate PO history and spending reports

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/purchase-orders` | `inventory:read` | List purchase orders |
| GET | `/api/resources/purchase-orders/:id` | `inventory:read` | Get PO details |
| POST | `/api/resources/purchase-orders` | `inventory:order` | Create PO |
| PUT | `/api/resources/purchase-orders/:id` | `inventory:order` | Update PO |
| DELETE | `/api/resources/purchase-orders/:id` | `inventory:order` | Cancel PO |
| POST | `/api/resources/purchase-orders/:id/submit` | `inventory:order` | Submit to supplier |
| POST | `/api/resources/purchase-orders/:id/approve` | `inventory:approve` | Approve PO |
| POST | `/api/resources/purchase-orders/:id/reject` | `inventory:approve` | Reject PO |
| POST | `/api/resources/purchase-orders/:id/receive` | `inventory:receive` | Receive items |
| GET | `/api/resources/purchase-orders/:id/receipts` | `inventory:read` | Get receipts |

---

## Data Model

```prisma
model PurchaseOrder {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  supplierId      String   @db.ObjectId

  // Order identification
  poNumber        String   @unique
  externalPoNumber String?  // Supplier's order number

  // Status
  status          PurchaseOrderStatus @default(DRAFT)

  // Dates
  orderDate       DateTime?
  expectedDate    DateTime?
  receivedDate    DateTime?

  // Amounts
  subtotal        Decimal
  taxAmount       Decimal  @default(0)
  shippingAmount  Decimal  @default(0)
  discountAmount  Decimal  @default(0)
  totalAmount     Decimal

  // Shipping
  shipTo          Json?    // Shipping address
  shippingMethod  String?
  trackingNumber  String?

  // Payment
  paymentTerms    String?
  invoiceNumber   String?
  invoiceDate     DateTime?

  // Approval
  approvalRequired Boolean @default(false)
  approvalThreshold Decimal?
  approvedBy      String?  @db.ObjectId
  approvedAt      DateTime?
  rejectedBy      String?  @db.ObjectId
  rejectedAt      DateTime?
  rejectionReason String?

  // Notes
  notes           String?
  internalNotes   String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String   @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  supplier  Supplier @relation(fields: [supplierId], references: [id])
  items     PurchaseOrderItem[]
  receipts  PurchaseOrderReceipt[]

  @@index([clinicId])
  @@index([supplierId])
  @@index([status])
  @@index([orderDate])
}

enum PurchaseOrderStatus {
  DRAFT             // Being created
  PENDING_APPROVAL  // Awaiting approval
  APPROVED          // Approved, ready to submit
  REJECTED          // Approval rejected
  SUBMITTED         // Sent to supplier
  ACKNOWLEDGED      // Supplier confirmed
  PARTIALLY_RECEIVED // Some items received
  RECEIVED          // All items received
  CLOSED            // Complete, invoiced
  CANCELLED         // Order cancelled
}

model PurchaseOrderItem {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  purchaseOrderId String   @db.ObjectId
  itemId          String   @db.ObjectId

  // Item details
  lineNumber      Int
  description     String
  sku             String
  supplierSku     String?

  // Quantities
  orderedQuantity Int
  receivedQuantity Int    @default(0)
  backorderedQuantity Int @default(0)

  // Pricing
  unitPrice       Decimal
  discountPercent Decimal  @default(0)
  lineTotal       Decimal

  // Status
  status          POItemStatus @default(ORDERED)

  // Notes
  notes           String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  item          InventoryItem @relation(fields: [itemId], references: [id])

  @@index([purchaseOrderId])
  @@index([itemId])
}

enum POItemStatus {
  ORDERED
  PARTIALLY_RECEIVED
  RECEIVED
  BACKORDERED
  CANCELLED
}

model PurchaseOrderReceipt {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  purchaseOrderId String   @db.ObjectId

  // Receipt details
  receiptNumber   String
  receiptDate     DateTime @default(now())

  // Shipping info
  packingSlipNumber String?
  carrierName     String?
  trackingNumber  String?

  // Items received (with lot info)
  items           Json     // Array of { itemId, quantity, lotNumber, expirationDate }

  // Notes
  notes           String?
  damageNotes     String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  createdBy String   @db.ObjectId

  // Relations
  clinic        Clinic        @relation(fields: [clinicId], references: [id])
  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])

  @@index([clinicId])
  @@index([purchaseOrderId])
  @@index([receiptDate])
}
```

---

## Business Rules

- PO numbers are auto-generated with configurable format (prefix, sequence)
- Orders over approval threshold require manager approval
- Draft orders can be modified; submitted orders are locked
- Received quantities cannot exceed ordered without documentation
- Partial receipts update item status and PO status
- Receiving creates inventory lots and stock movements
- Cancelled orders cannot be modified or received against
- Supplier lead times updated based on actual delivery performance

---

## Dependencies

**Depends On:**
- Supplies Catalog (items being ordered)
- Supplier Management (supplier information)
- Stock Tracking (receiving updates stock)
- Reorder Automation (generates draft orders)
- Auth & Authorization (user authentication, permissions)

**Required By:**
- Stock Tracking (receiving updates inventory)
- Expiration Monitoring (lot creation with dates)
- Financial Management (spending tracking)

---

## Notes

- Consider email template for sending POs to suppliers
- Integration with major distributors (Henry Schein, Patterson) valuable
- PDF generation for printable purchase orders
- Approval workflow could support multi-level approval
- Budget tracking could limit orders per period
- Vendor performance tracking: on-time delivery, accuracy

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
