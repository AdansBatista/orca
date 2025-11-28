# Order Management

> **Area**: [Vendors Management](../../)
>
> **Sub-Area**: 3. Order Management
>
> **Purpose**: Manage purchase orders, requisitions, order tracking, receiving, and returns

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Large |
| **Parent Area** | [Vendors Management](../../) |
| **Dependencies** | Vendor Profiles, Financial Management |
| **Last Updated** | 2024-11-27 |

---

## Overview

Order Management provides comprehensive procurement capabilities for orthodontic practices. This includes purchase order creation and approval workflows, requisition processing, real-time order tracking, receiving and fulfillment, and returns management. The system integrates with inventory to automate reordering and with accounts payable for invoice matching.

The sub-area supports the unique ordering needs of orthodontic practices including orthodontic supplies (brackets, wires, elastics), lab cases, equipment, and general office supplies. Multi-location practices can manage orders centrally or by location with appropriate approval workflows.

### Key Capabilities

- Purchase order creation with approval workflow
- Staff requisition requests
- Real-time order status tracking
- Partial delivery handling
- Back-order management
- Receiving and quality inspection
- Return merchandise authorization (RMA)
- Automatic reorder point alerts
- Three-way invoice matching
- Integration with inventory management
- Multi-location ordering

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.1 | [Purchase Orders](./functions/purchase-orders.md) | Create and manage purchase orders | 📋 Planned | Critical |
| 3.2 | [Requisitions](./functions/requisitions.md) | Staff requisition requests | 📋 Planned | Medium |
| 3.3 | [Order Tracking](./functions/order-tracking.md) | Track order status and delivery | 📋 Planned | High |
| 3.4 | [Receiving](./functions/receiving.md) | Receive and inspect deliveries | 📋 Planned | High |
| 3.5 | [Returns](./functions/returns.md) | Process returns and exchanges | 📋 Planned | Medium |

---

## Function Details

### 3.1 Purchase Orders

**Purpose**: Create, manage, and process purchase orders to vendors.

**Key Capabilities**:
- PO creation with line items
- Vendor selection and validation
- Contracted pricing application
- Approval workflow by amount
- PO numbering system
- Document generation (PDF)
- Email transmission to vendors
- PO revision tracking
- Multi-location ordering
- Blanket/standing orders

**Purchase Order Types**:
| Type | Description | Use Case |
|------|-------------|----------|
| Standard | One-time purchase | Regular supply orders |
| Blanket | Standing order with releases | Recurring supply needs |
| Planned | Future dated order | Scheduled deliveries |
| Emergency | Rush/urgent order | Urgent supply needs |
| Recurring | Auto-generated orders | Regular subscriptions |

**Approval Thresholds**:
| Amount | Approval Required |
|--------|-------------------|
| < $500 | Office Manager |
| $500 - $2,500 | Clinic Admin |
| $2,500 - $10,000 | Clinic Admin + Finance |
| > $10,000 | Owner/Executive |

**User Stories**:
- As a **clinical staff**, I want to create orders for supplies we need
- As an **office manager**, I want to approve orders within my authority
- As a **billing specialist**, I want to track POs against invoices

---

### 3.2 Requisitions

**Purpose**: Allow staff to request supplies and materials through formal requisition process.

**Key Capabilities**:
- Requisition creation by any staff
- Item selection from catalog or free-form
- Urgency level indication
- Manager routing and approval
- Conversion to purchase order
- Requisition history tracking
- Consolidated requisitions
- Budget checking

**Requisition Flow**:
1. Staff creates requisition
2. System routes to appropriate approver
3. Manager reviews and approves/denies
4. Approved requisitions convert to POs
5. PO follows standard approval flow
6. Staff notified of status changes

**Urgency Levels**:
| Level | Description | Expected Processing |
|-------|-------------|---------------------|
| Low | Standard need | Next regular order |
| Normal | Routine need | Within 2-3 days |
| High | Urgent need | Same day if possible |
| Critical | Emergency | Immediate attention |

**User Stories**:
- As a **clinical assistant**, I want to request supplies when stock is low
- As an **office manager**, I want to see and approve staff requisitions
- As a **staff member**, I want to track my requisition status

---

### 3.3 Order Tracking

**Purpose**: Track purchase order status from submission through delivery.

**Key Capabilities**:
- Order status visibility
- Vendor acknowledgment tracking
- Shipping and tracking integration
- Expected delivery dates
- Delivery notifications
- Status update alerts
- Order history
- Vendor response tracking

**Order Statuses**:
| Status | Description | Actions Available |
|--------|-------------|-------------------|
| Draft | Order being prepared | Edit, Submit, Cancel |
| Pending Approval | Awaiting approval | Approve, Reject |
| Approved | Ready to send | Send to Vendor |
| Sent | Transmitted to vendor | - |
| Acknowledged | Vendor confirmed | - |
| In Progress | Being fulfilled | - |
| Shipped | In transit | Track Shipment |
| Partially Received | Some items received | Receive More |
| Received | All items received | Close |
| Completed | Closed and matched | - |
| Cancelled | Order cancelled | - |
| On Hold | Temporarily paused | Resume, Cancel |

**Tracking Integration**:
- Carrier tracking number capture
- Real-time tracking updates (where available)
- Delivery confirmation
- Proof of delivery documents

**User Stories**:
- As an **office manager**, I want to track order status to plan for deliveries
- As a **clinical staff**, I want to know when my supplies will arrive
- As a **front desk**, I want alerts when packages are expected

---

### 3.4 Receiving

**Purpose**: Receive deliveries, verify quantities, inspect quality, and update inventory.

**Key Capabilities**:
- Match deliveries to POs
- Quantity verification
- Quality inspection
- Partial receiving
- Lot/serial number capture
- Expiration date tracking
- Discrepancy documentation
- Auto-inventory updates
- Packing slip capture
- Receiving reports

**Receiving Process**:
1. Package arrives at location
2. Staff initiates receiving against PO
3. Verify items against packing slip
4. Count quantities received
5. Inspect for quality/damage
6. Record lot numbers and expiration dates
7. Document any discrepancies
8. Complete receiving
9. Inventory auto-updated
10. Generate receiving report

**Quality Inspection**:
| Status | Description | Action |
|--------|-------------|--------|
| Passed | Items acceptable | Accept into inventory |
| Failed | Items defective | Reject, initiate return |
| Partial Pass | Some issues | Accept good, reject bad |
| Pending | Needs inspection | Hold pending review |

**User Stories**:
- As a **clinical staff**, I want to receive deliveries and verify contents
- As an **inventory manager**, I want receiving to auto-update stock levels
- As an **office manager**, I want to document receiving discrepancies

---

### 3.5 Returns

**Purpose**: Process returns, exchanges, and credits for vendor shipments.

**Key Capabilities**:
- Return merchandise authorization (RMA)
- Return reason documentation
- Vendor return process
- Credit tracking
- Exchange processing
- Restocking fee tracking
- Return shipping coordination
- Vendor credit reconciliation

**Return Reasons**:
| Reason | Description | Typical Resolution |
|--------|-------------|-------------------|
| Wrong Item | Incorrect item shipped | Exchange for correct item |
| Damaged | Item damaged in transit | Replacement or credit |
| Defective | Quality defect | Replacement or credit |
| Quantity Error | Wrong quantity shipped | Adjust or return excess |
| Not Ordered | Item not on PO | Return for credit |
| Quality Issue | Below quality standards | Return for credit |
| Expired | Product expired | Credit |
| Recall | Manufacturer recall | Credit |

**Return Process**:
1. Identify return items
2. Request RMA from vendor
3. Document return reason
4. Package items for return
5. Ship to vendor
6. Track return shipment
7. Receive vendor credit
8. Reconcile credit to invoice

**User Stories**:
- As an **office manager**, I want to return damaged items for credit
- As a **billing specialist**, I want to track vendor credits for returns
- As a **clinical staff**, I want to exchange wrong items for correct ones

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

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy     String?  @db.ObjectId
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?
  submittedBy   String?  @db.ObjectId
  submittedAt   DateTime?

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  vendor        Vendor    @relation(fields: [vendorId], references: [id])
  items         PurchaseOrderItem[]
  receipts      OrderReceipt[]
  returns       OrderReturn[]

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

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])

  @@index([purchaseOrderId])
  @@index([itemCode])
  @@index([status])
}

model Requisition {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Requisition Details
  requisitionNumber String @unique
  requestedBy   String   @db.ObjectId
  department    String?

  // Dates
  requestDate   DateTime @default(now())
  neededByDate  DateTime?

  // Priority
  urgency       UrgencyLevel @default(NORMAL)

  // Status
  status        RequisitionStatus @default(PENDING)

  // Approval
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?
  rejectionReason String?

  // Conversion
  purchaseOrderId String? @db.ObjectId

  // Notes
  notes         String?
  justification String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  items         RequisitionItem[]

  @@index([clinicId])
  @@index([requisitionNumber])
  @@index([requestedBy])
  @@index([status])
}

model RequisitionItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  requisitionId String   @db.ObjectId

  // Item Details
  itemCode      String?
  description   String
  quantity      Decimal
  unit          String   @default("EA")
  estimatedCost Decimal?

  // Suggested Vendor
  suggestedVendorId String? @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  requisition   Requisition @relation(fields: [requisitionId], references: [id])

  @@index([requisitionId])
}

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
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  items         OrderReceiptItem[]

  @@index([clinicId])
  @@index([purchaseOrderId])
  @@index([receiptNumber])
  @@index([receiptDate])
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

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  orderReceipt  OrderReceipt @relation(fields: [orderReceiptId], references: [id])

  @@index([orderReceiptId])
  @@index([purchaseOrderItemId])
}

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

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
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

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  orderReturn   OrderReturn @relation(fields: [orderReturnId], references: [id])

  @@index([orderReturnId])
  @@index([purchaseOrderItemId])
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

enum OrderItemStatus {
  PENDING
  PARTIALLY_RECEIVED
  RECEIVED
  BACK_ORDERED
  CANCELLED
}

enum UrgencyLevel {
  LOW
  NORMAL
  HIGH
  CRITICAL
}

enum RequisitionStatus {
  PENDING
  APPROVED
  REJECTED
  CONVERTED
  CANCELLED
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

type Address {
  street1   String
  street2   String?
  city      String
  state     String
  zipCode   String
  country   String @default("US")
}
```

---

## API Endpoints

### Purchase Orders

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/orders` | List purchase orders | `order:read` |
| GET | `/api/vendors/:id/orders` | Get vendor orders | `order:read` |
| GET | `/api/vendors/orders/:id` | Get order details | `order:read` |
| POST | `/api/vendors/:vendorId/orders` | Create order | `order:create` |
| PUT | `/api/vendors/orders/:id` | Update order | `order:update` |
| DELETE | `/api/vendors/orders/:id` | Delete order | `order:delete` |
| POST | `/api/vendors/orders/:id/submit` | Submit for approval | `order:create` |
| POST | `/api/vendors/orders/:id/approve` | Approve order | `order:approve` |
| POST | `/api/vendors/orders/:id/reject` | Reject order | `order:approve` |
| POST | `/api/vendors/orders/:id/send` | Send to vendor | `order:create` |
| PUT | `/api/vendors/orders/:id/status` | Update status | `order:update` |
| GET | `/api/vendors/orders/:id/pdf` | Generate PDF | `order:read` |
| GET | `/api/vendors/orders/pending` | List pending orders | `order:read` |

### Requisitions

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/requisitions` | List requisitions | `order:read` |
| GET | `/api/vendors/requisitions/:id` | Get requisition | `order:read` |
| POST | `/api/vendors/requisitions` | Create requisition | `order:request` |
| PUT | `/api/vendors/requisitions/:id` | Update requisition | `order:request` |
| DELETE | `/api/vendors/requisitions/:id` | Delete requisition | `order:request` |
| POST | `/api/vendors/requisitions/:id/approve` | Approve | `order:approve` |
| POST | `/api/vendors/requisitions/:id/reject` | Reject | `order:approve` |
| POST | `/api/vendors/requisitions/:id/convert` | Convert to PO | `order:create` |

### Receiving

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/orders/:id/receipts` | Get order receipts | `order:read` |
| POST | `/api/vendors/orders/:id/receive` | Create receipt | `order:receive` |
| GET | `/api/vendors/receipts/:id` | Get receipt details | `order:read` |
| PUT | `/api/vendors/receipts/:id` | Update receipt | `order:receive` |
| POST | `/api/vendors/receipts/:id/complete` | Complete receiving | `order:receive` |
| GET | `/api/vendors/orders/pending-receipt` | Orders awaiting receipt | `order:read` |

### Returns

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/vendors/orders/:id/returns` | Get order returns | `order:read` |
| POST | `/api/vendors/orders/:id/returns` | Create return | `order:return` |
| GET | `/api/vendors/returns/:id` | Get return details | `order:read` |
| PUT | `/api/vendors/returns/:id` | Update return | `order:return` |
| PUT | `/api/vendors/returns/:id/status` | Update return status | `order:return` |
| POST | `/api/vendors/returns/:id/ship` | Mark as shipped | `order:return` |
| POST | `/api/vendors/returns/:id/credit` | Record credit | `order:return` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `PurchaseOrderList` | List/search orders | `components/vendors/orders/` |
| `PurchaseOrderDetail` | Full PO view | `components/vendors/orders/` |
| `PurchaseOrderForm` | Create/edit PO | `components/vendors/orders/` |
| `PurchaseOrderCard` | Summary PO card | `components/vendors/orders/` |
| `OrderItemTable` | Line items editor | `components/vendors/orders/` |
| `ItemSelector` | Add items to order | `components/vendors/orders/` |
| `OrderStatusBadge` | Status indicator | `components/vendors/orders/` |
| `OrderStatusTracker` | Status timeline | `components/vendors/orders/` |
| `OrderApprovalQueue` | Pending approvals | `components/vendors/orders/` |
| `POPdfViewer` | View/print PO | `components/vendors/orders/` |
| `RequisitionList` | List requisitions | `components/vendors/requisitions/` |
| `RequisitionForm` | Create requisition | `components/vendors/requisitions/` |
| `RequisitionApproval` | Approve/reject UI | `components/vendors/requisitions/` |
| `RequisitionConverter` | Convert to PO | `components/vendors/requisitions/` |
| `ReceivingForm` | Receive delivery | `components/vendors/receiving/` |
| `ReceivingItemList` | Items to receive | `components/vendors/receiving/` |
| `QualityInspectionForm` | Quality check | `components/vendors/receiving/` |
| `LotNumberEntry` | Lot/expiry capture | `components/vendors/receiving/` |
| `ReceiptHistory` | Receipt records | `components/vendors/receiving/` |
| `ReturnForm` | Create return | `components/vendors/returns/` |
| `ReturnItemSelector` | Select return items | `components/vendors/returns/` |
| `ReturnStatusTracker` | Track return status | `components/vendors/returns/` |
| `CreditReconciliation` | Match credits | `components/vendors/returns/` |
| `OrderDashboard` | Order overview | `components/vendors/orders/` |
| `PendingDeliveries` | Expected deliveries | `components/vendors/orders/` |

---

## Business Rules

1. **Order Numbers**: Auto-generated with location prefix (e.g., LOC1-PO-2024-0001)
2. **Approved Vendors Only**: Orders only to approved vendors with valid status
3. **Approval Thresholds**: Orders above configured amounts require approval
4. **Budget Validation**: Orders checked against budgets if configured
5. **Contract Pricing**: Apply contracted pricing when available
6. **Partial Receiving**: Support receiving partial shipments
7. **Three-Way Match**: Match PO, receipt, and invoice before payment
8. **Back-Order Tracking**: Track back-ordered items until fulfilled
9. **Lot Tracking**: Capture lot numbers for medical supplies
10. **Expiration Tracking**: Record expiration dates for dated products
11. **RMA Required**: Returns require vendor RMA before shipping
12. **Credit Reconciliation**: Track credits until reconciled with payments

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Vendor Profiles | Required | Vendor records for ordering |
| Contract Management | Optional | Contracted pricing |
| Financial Management | Required | Invoice matching, payments |
| Resources Management | Optional | Inventory updates |
| Email Service | Required | Order notifications |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Vendor Portals | Optional | Electronic order submission |
| Shipping Carriers | Optional | Tracking integration |
| PDF Generation | Required | PO document generation |

---

## Related Documentation

- [Parent: Vendors Management](../../)
- [Vendor Profiles](../vendor-profiles/)
- [Contract Management](../contract-management/)
- [Vendor Performance](../vendor-performance/)
- [Financial Management](../../../financial-management/) - Accounts payable
- [Resources Management](../../../resources-management/) - Inventory

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
