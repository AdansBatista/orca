# Inventory Management

> **Area**: [Resources Management](../../)
>
> **Sub-Area**: 3.3 Inventory Management
>
> **Purpose**: Track orthodontic supplies and consumables with automated reorder and expiration management

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Implemented |
| **Priority** | High |
| **Complexity** | Large |
| **Parent Area** | [Resources Management](../../) |
| **Dependencies** | Auth, Supplier Management |
| **Last Updated** | 2024-12-02 |

---

## Overview

Inventory Management provides comprehensive tracking of all consumable supplies used in orthodontic treatment. This includes brackets, wires, elastics, bands, bonding materials, impression supplies, and general clinical consumables. The system tracks stock levels, automates reorder processes, monitors expiration dates, and provides usage analytics.

Orthodontic inventory has unique characteristics including multiple bracket systems, various wire sizes and materials, color-coded elastics, and materials with specific shelf lives. This sub-area is designed to handle these complexities while minimizing waste and preventing stockouts.

### Key Capabilities

- Comprehensive supplies catalog with orthodontic-specific categories
- Real-time stock level tracking across locations
- Automated low-stock alerts and reorder suggestions
- Expiration date monitoring with FIFO management
- Lot/batch tracking for traceability and recalls
- Purchase order management and receiving
- Usage analytics by provider, procedure, and patient
- Multi-location inventory with transfer support

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.3.1 | [Supplies Catalog](./functions/supplies-catalog.md) | Maintain product catalog | ✅ Implemented | Critical |
| 3.3.2 | [Stock Tracking](./functions/stock-tracking.md) | Track inventory levels | ✅ Implemented | Critical |
| 3.3.3 | [Reorder Automation](./functions/reorder-automation.md) | Automated reorder alerts/POs | ✅ Implemented | High |
| 3.3.4 | [Expiration Monitoring](./functions/expiration-monitoring.md) | Track expiring items | ✅ Implemented | High |
| 3.3.5 | [Purchase Orders](./functions/purchase-orders.md) | Manage purchasing workflow | ✅ Implemented | High |
| 3.3.6 | [Usage Analytics](./functions/usage-analytics.md) | Analyze consumption patterns | ✅ Implemented | Medium |
| 3.3.7 | [Inventory Transfers](./functions/inventory-transfers.md) | Multi-location transfers | ✅ Implemented | Low |

---

## Function Details

### 3.3.1 Supplies Catalog

**Purpose**: Maintain a comprehensive catalog of all orthodontic supplies and consumables.

**Key Capabilities**:
- Categorize items by type (brackets, wires, elastics, etc.)
- Store product specifications and details
- Link to preferred suppliers
- Track multiple SKUs per product
- Manage product variants (sizes, colors, types)
- Store MSDS (Material Safety Data Sheets)
- Support product photos and documentation

**Orthodontic Supply Categories**:
| Category | Examples | Tracking Needs |
|----------|----------|----------------|
| Brackets | Metal, ceramic, self-ligating, lingual | By system, prescription, size |
| Wires | NiTi, stainless steel, TMA, copper NiTi | By size, material, shape |
| Elastics | Power chains, ligatures, separators | By size, color, strength |
| Bands | Molar bands, pre-welded | By size, type |
| Bonding | Adhesives, primers, etchants | By lot, expiration |
| Impression | Alginate, PVS, bite registration | By lot, expiration |
| Retainers | Clear retainer material, Hawley | By type, size |
| Instruments | Disposable mirrors, probes | By type |
| Clinical Supplies | Gloves, masks, gauze, cotton rolls | By size, type |

**User Stories**:
- As a **clinic admin**, I want to add new products to our catalog with full specifications
- As a **clinical staff**, I want to find the right bracket by system and prescription quickly
- As a **clinic admin**, I want to see all products from a specific supplier

---

### 3.3.2 Stock Tracking

**Purpose**: Maintain accurate real-time inventory levels across all locations.

**Key Capabilities**:
- Track current stock by item and location
- Record all stock movements (received, used, adjusted)
- Support lot/batch tracking for traceability
- Track stock by specific locations within clinic (storage, operatory)
- Provide stock level snapshots and history
- Support barcode/QR scanning for inventory counts
- Calculate average usage rates

**Stock Movement Types**:
- **Received**: Items received from purchase orders
- **Used**: Items consumed in patient treatment
- **Adjustment**: Manual corrections (damaged, count variance)
- **Transfer In/Out**: Movement between locations
- **Returned**: Items returned to supplier
- **Expired**: Items removed due to expiration
- **Damaged**: Items removed due to damage
- **Lost**: Items unaccounted for

**User Stories**:
- As a **clinical staff**, I want to record supply usage after a procedure
- As a **clinic admin**, I want to see current stock levels for all items
- As a **clinical staff**, I want to scan items to quickly update inventory

---

### 3.3.3 Reorder Automation

**Purpose**: Automate the reorder process to prevent stockouts while minimizing excess inventory.

**Key Capabilities**:
- Set reorder points per item
- Configure minimum and maximum stock levels
- Generate automatic low-stock alerts
- Calculate suggested reorder quantities
- Support economic order quantity (EOQ) calculations
- Create draft purchase orders from alerts
- Track lead times by supplier
- Handle seasonal usage variations

**Reorder Configuration**:
- **Reorder Point**: Stock level that triggers alert
- **Reorder Quantity**: Standard order amount
- **Safety Stock**: Buffer for unexpected demand
- **Lead Time**: Expected delivery time
- **Max Stock**: Upper limit to prevent overordering

**User Stories**:
- As a **clinic admin**, I want to be alerted when supplies are running low
- As a **clinic admin**, I want the system to suggest how much to order
- As a **clinic admin**, I want to review and approve auto-generated purchase orders

---

### 3.3.4 Expiration Monitoring

**Purpose**: Track expiration dates to prevent use of expired materials and minimize waste.

**Key Capabilities**:
- Record expiration dates by lot/batch
- Generate expiration alerts (30/60/90 days)
- Enforce FIFO (First In, First Out) usage
- Track items approaching expiration
- Report on expired inventory and waste
- Support expiration extension documentation
- Generate reports for audits

**Alert Timeline**:
| Alert | Timing | Action |
|-------|--------|--------|
| Warning | 90 days before | Plan to use or return |
| Caution | 60 days before | Prioritize usage |
| Urgent | 30 days before | Use immediately or discard |
| Expired | Past date | Remove from inventory |

**User Stories**:
- As a **clinic admin**, I want to see all items expiring in the next 30 days
- As a **clinical staff**, I want to know which lot to use first (oldest)
- As a **clinic admin**, I want reports on expired inventory for waste reduction

---

### 3.3.5 Purchase Orders

**Purpose**: Manage the complete purchasing workflow from order creation to receiving.

**Key Capabilities**:
- Create purchase orders manually or from reorder alerts
- Route orders for approval based on amount
- Submit orders to suppliers electronically (where supported)
- Track order status and expected delivery
- Receive items against purchase orders
- Handle partial shipments and backorders
- Process returns and credits
- Reconcile invoices against receipts

**Purchase Order Workflow**:
1. **Draft**: Order created, items added
2. **Pending Approval**: Awaiting manager approval (if over threshold)
3. **Approved**: Ready to submit to supplier
4. **Submitted**: Sent to supplier
5. **Acknowledged**: Supplier confirmed receipt
6. **Partially Received**: Some items delivered
7. **Received**: All items delivered
8. **Closed**: Order complete, invoiced

**User Stories**:
- As a **clinic admin**, I want to create a purchase order for low-stock items
- As a **clinic admin**, I want to approve orders over a certain amount
- As a **clinical staff**, I want to receive items and update inventory automatically

---

### 3.3.6 Usage Analytics

**Purpose**: Analyze consumption patterns to optimize inventory and identify trends.

**Key Capabilities**:
- Track usage by provider, procedure type, patient
- Calculate average daily/weekly/monthly consumption
- Identify usage trends and seasonality
- Compare usage across locations
- Detect unusual usage patterns (waste, theft)
- Project future inventory needs
- Generate cost analysis reports

**Analytics Reports**:
| Report | Purpose |
|--------|---------|
| Usage by Provider | Compare consumption across providers |
| Usage by Procedure | Cost analysis by treatment type |
| Usage Trends | Historical consumption patterns |
| Waste Analysis | Expired/damaged item tracking |
| Cost per Patient | Average supply cost per case |
| Location Comparison | Cross-location efficiency |

**User Stories**:
- As a **clinic admin**, I want to see which supplies we use most
- As a **clinic admin**, I want to compare supply usage between doctors
- As a **clinic admin**, I want to project supply needs for next quarter

---

### 3.3.7 Inventory Transfers

**Purpose**: Manage inventory movement between clinic locations.

**Key Capabilities**:
- Request inventory from other locations
- Transfer excess inventory to other locations
- Track items in transit
- Update stock at both locations upon completion
- Maintain transfer history and audit trail
- Handle emergency transfers
- Balance inventory across locations

**User Stories**:
- As a **clinic admin**, I want to transfer excess brackets to another location
- As a **clinical staff**, I want to request urgent supplies from another location
- As a **super admin**, I want to see inventory distribution across all locations

---

## Data Model

```prisma
model InventoryItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Identification
  name          String
  sku           String
  barcode       String?
  upc           String?

  // Classification
  category      InventoryCategory
  subcategory   String?
  brand         String?
  manufacturer  String?

  // Specifications
  description   String?
  specifications Json?
  size          String?
  color         String?
  material      String?

  // Supplier info
  supplierId    String?  @db.ObjectId
  supplierSku   String?
  alternateSuppliers String[]  @db.ObjectId

  // Pricing
  unitCost      Decimal
  lastCost      Decimal?
  averageCost   Decimal?
  unitOfMeasure String   // e.g., "EACH", "BOX", "PACK"
  unitsPerPackage Int    @default(1)
  packageDescription String?

  // Stock levels
  currentStock  Int      @default(0)
  reservedStock Int      @default(0)
  availableStock Int     @default(0)  // currentStock - reservedStock

  // Reorder settings
  reorderPoint  Int
  reorderQuantity Int
  safetyStock   Int      @default(0)
  maxStock      Int?
  leadTimeDays  Int      @default(7)

  // Tracking options
  trackLots     Boolean  @default(false)
  trackExpiry   Boolean  @default(true)
  trackSerial   Boolean  @default(false)

  // Storage
  storageLocation String?
  storageRequirements String?  // e.g., "Refrigerate", "Keep dry"

  // Status
  status        InventoryStatus @default(ACTIVE)
  isOrderable   Boolean  @default(true)

  // Documents
  msdsUrl       String?  // Material Safety Data Sheet
  imageUrl      String?
  documents     String[]

  // Usage stats (cached)
  averageDailyUsage Decimal?
  lastUsedAt    DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Audit
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  supplier      Supplier? @relation(fields: [supplierId], references: [id])
  stockMovements StockMovement[]
  lots          InventoryLot[]
  purchaseOrderItems PurchaseOrderItem[]

  @@unique([clinicId, sku])
  @@index([clinicId])
  @@index([category])
  @@index([supplierId])
  @@index([currentStock])
  @@index([barcode])
}

enum InventoryCategory {
  BRACKETS
  WIRES
  ELASTICS
  BANDS
  BONDING
  IMPRESSION
  RETAINERS
  INSTRUMENTS
  DISPOSABLES
  PPE
  OFFICE_SUPPLIES
  CLEANING
  OTHER
}

enum InventoryStatus {
  ACTIVE
  DISCONTINUED
  BACKORDERED
  INACTIVE
  PENDING_APPROVAL
}

model InventoryLot {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  itemId        String   @db.ObjectId

  // Lot identification
  lotNumber     String
  serialNumbers String[]  // If serial tracking enabled

  // Quantities
  initialQuantity Int
  currentQuantity Int
  reservedQuantity Int   @default(0)

  // Dates
  receivedDate  DateTime
  manufacturingDate DateTime?
  expirationDate DateTime?

  // Source
  purchaseOrderId String? @db.ObjectId
  supplierId    String?  @db.ObjectId

  // Cost
  unitCost      Decimal?

  // Location
  storageLocation String?

  // Status
  status        LotStatus @default(AVAILABLE)
  quarantineReason String?

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  item          InventoryItem @relation(fields: [itemId], references: [id])
  purchaseOrder PurchaseOrder? @relation(fields: [purchaseOrderId], references: [id])
  stockMovements StockMovement[]

  @@unique([clinicId, itemId, lotNumber])
  @@index([clinicId])
  @@index([itemId])
  @@index([expirationDate])
  @@index([lotNumber])
  @@index([status])
}

enum LotStatus {
  AVAILABLE
  RESERVED
  DEPLETED
  EXPIRED
  RECALLED
  QUARANTINE
  DAMAGED
}

model StockMovement {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  itemId        String   @db.ObjectId
  lotId         String?  @db.ObjectId

  // Movement details
  movementType  StockMovementType
  quantity      Int      // Positive for additions, negative for removals
  unitCost      Decimal?

  // Reference
  referenceType ReferenceType?
  referenceId   String?  @db.ObjectId

  // For usage tracking
  patientId     String?  @db.ObjectId
  appointmentId String?  @db.ObjectId
  procedureId   String?  @db.ObjectId
  providerId    String?  @db.ObjectId

  // For transfers
  fromLocationId String? @db.ObjectId
  toLocationId  String?  @db.ObjectId
  transferId    String?  @db.ObjectId

  // Stock snapshot
  previousStock Int
  newStock      Int

  // Notes
  reason        String?
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  createdBy String   @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  item          InventoryItem @relation(fields: [itemId], references: [id])
  lot           InventoryLot? @relation(fields: [lotId], references: [id])

  @@index([clinicId])
  @@index([itemId])
  @@index([lotId])
  @@index([movementType])
  @@index([createdAt])
  @@index([patientId])
  @@index([providerId])
}

enum StockMovementType {
  RECEIVED
  USED
  ADJUSTMENT_ADD
  ADJUSTMENT_REMOVE
  TRANSFER_IN
  TRANSFER_OUT
  RETURNED_TO_SUPPLIER
  RETURNED_FROM_PATIENT
  EXPIRED
  DAMAGED
  LOST
  RECALLED
  OPENING_BALANCE
  COUNT_VARIANCE
}

enum ReferenceType {
  PURCHASE_ORDER
  TRANSFER
  ADJUSTMENT
  PATIENT_TREATMENT
  RETURN
  RECALL
  COUNT
}

model Supplier {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Identification
  name          String
  code          String
  accountNumber String?

  // Contact
  contactName   String?
  email         String?
  phone         String?
  fax           String?
  website       String?

  // Address
  address       Json?

  // Order settings
  minimumOrder  Decimal?
  freeShippingThreshold Decimal?
  defaultLeadTimeDays Int @default(7)
  orderMethod   OrderMethod @default(EMAIL)

  // Payment
  paymentTerms  String?
  taxExempt     Boolean  @default(false)

  // Performance
  rating        Int?     // 1-5 stars
  onTimeDeliveryRate Decimal?

  // Status
  status        SupplierStatus @default(ACTIVE)
  isPreferred   Boolean  @default(false)

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  items         InventoryItem[]
  purchaseOrders PurchaseOrder[]
  equipment     Equipment[]
  maintenanceRecords MaintenanceRecord[]
  repairRecords RepairRecord[]

  @@unique([clinicId, code])
  @@index([clinicId])
  @@index([status])
}

enum SupplierStatus {
  ACTIVE
  INACTIVE
  ON_HOLD
  BLOCKED
}

enum OrderMethod {
  EMAIL
  PORTAL
  PHONE
  FAX
  EDI
}

model PurchaseOrder {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  supplierId    String   @db.ObjectId

  // Order identification
  poNumber      String   @unique
  externalPoNumber String?  // Supplier's order number

  // Status
  status        PurchaseOrderStatus @default(DRAFT)

  // Dates
  orderDate     DateTime?
  expectedDate  DateTime?
  receivedDate  DateTime?

  // Amounts
  subtotal      Decimal
  taxAmount     Decimal  @default(0)
  shippingAmount Decimal @default(0)
  discountAmount Decimal @default(0)
  totalAmount   Decimal

  // Shipping
  shipTo        Json?
  shippingMethod String?
  trackingNumber String?

  // Payment
  paymentTerms  String?
  invoiceNumber String?
  invoiceDate   DateTime?

  // Approval
  approvalRequired Boolean @default(false)
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?
  rejectedBy    String?  @db.ObjectId
  rejectedAt    DateTime?
  rejectionReason String?

  // Notes
  notes         String?
  internalNotes String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy String   @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  supplier      Supplier  @relation(fields: [supplierId], references: [id])
  items         PurchaseOrderItem[]
  lots          InventoryLot[]
  receipts      PurchaseOrderReceipt[]

  @@index([clinicId])
  @@index([supplierId])
  @@index([status])
  @@index([orderDate])
  @@index([poNumber])
}

enum PurchaseOrderStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
  SUBMITTED
  ACKNOWLEDGED
  PARTIALLY_RECEIVED
  RECEIVED
  CLOSED
  CANCELLED
}

model PurchaseOrderItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  purchaseOrderId String @db.ObjectId
  itemId        String   @db.ObjectId

  // Item details
  lineNumber    Int
  description   String
  sku           String
  supplierSku   String?

  // Quantities
  orderedQuantity Int
  receivedQuantity Int   @default(0)
  backorderedQuantity Int @default(0)

  // Pricing
  unitPrice     Decimal
  discountPercent Decimal @default(0)
  lineTotal     Decimal

  // Status
  status        POItemStatus @default(ORDERED)

  // Notes
  notes         String?

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
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  purchaseOrderId String @db.ObjectId

  // Receipt details
  receiptNumber String
  receiptDate   DateTime @default(now())

  // Shipping
  packingSlipNumber String?
  carrierName   String?
  trackingNumber String?

  // Items received
  items         Json     // Array of received items with quantities and lot info

  // Notes
  notes         String?
  damageNotes   String?

  // Timestamps
  createdAt DateTime @default(now())
  createdBy String   @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])

  @@index([clinicId])
  @@index([purchaseOrderId])
  @@index([receiptDate])
}

model InventoryTransfer {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  fromClinicId  String   @db.ObjectId
  toClinicId    String   @db.ObjectId

  // Transfer identification
  transferNumber String  @unique

  // Status
  status        TransferStatus @default(REQUESTED)

  // Dates
  requestedDate DateTime @default(now())
  approvedDate  DateTime?
  shippedDate   DateTime?
  receivedDate  DateTime?

  // People
  requestedBy   String   @db.ObjectId
  approvedBy    String?  @db.ObjectId
  shippedBy     String?  @db.ObjectId
  receivedBy    String?  @db.ObjectId

  // Items
  items         Json     // Array of items with quantities

  // Shipping
  shippingMethod String?
  trackingNumber String?

  // Notes
  reason        String?
  notes         String?

  // Priority
  isUrgent      Boolean  @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  fromClinic    Clinic    @relation("TransferFrom", fields: [fromClinicId], references: [id])
  toClinic      Clinic    @relation("TransferTo", fields: [toClinicId], references: [id])

  @@index([fromClinicId])
  @@index([toClinicId])
  @@index([status])
  @@index([requestedDate])
}

enum TransferStatus {
  REQUESTED
  APPROVED
  REJECTED
  PREPARING
  IN_TRANSIT
  RECEIVED
  CANCELLED
}
```

---

## API Endpoints

### Inventory Items

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/inventory` | List inventory items | `inventory:read` |
| GET | `/api/resources/inventory/:id` | Get item details | `inventory:read` |
| POST | `/api/resources/inventory` | Add item | `inventory:create` |
| PUT | `/api/resources/inventory/:id` | Update item | `inventory:update` |
| DELETE | `/api/resources/inventory/:id` | Delete item (soft) | `inventory:delete` |
| GET | `/api/resources/inventory/low-stock` | Get low stock items | `inventory:read` |
| GET | `/api/resources/inventory/expiring` | Get expiring items | `inventory:read` |

### Stock Management

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| POST | `/api/resources/inventory/:id/adjust` | Adjust stock | `inventory:adjust` |
| POST | `/api/resources/inventory/:id/use` | Record usage | `inventory:use` |
| GET | `/api/resources/inventory/:id/movements` | Get stock history | `inventory:read` |
| GET | `/api/resources/inventory/:id/lots` | Get lot details | `inventory:read` |
| POST | `/api/resources/inventory/count` | Submit inventory count | `inventory:adjust` |

### Purchase Orders

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/purchase-orders` | List POs | `inventory:read` |
| GET | `/api/resources/purchase-orders/:id` | Get PO details | `inventory:read` |
| POST | `/api/resources/purchase-orders` | Create PO | `inventory:order` |
| PUT | `/api/resources/purchase-orders/:id` | Update PO | `inventory:order` |
| POST | `/api/resources/purchase-orders/:id/submit` | Submit PO | `inventory:order` |
| POST | `/api/resources/purchase-orders/:id/approve` | Approve PO | `inventory:approve` |
| POST | `/api/resources/purchase-orders/:id/receive` | Receive items | `inventory:receive` |

### Suppliers

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/suppliers` | List suppliers | `inventory:read` |
| GET | `/api/resources/suppliers/:id` | Get supplier details | `inventory:read` |
| POST | `/api/resources/suppliers` | Add supplier | `inventory:create` |
| PUT | `/api/resources/suppliers/:id` | Update supplier | `inventory:update` |

### Transfers

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/transfers` | List transfers | `inventory:read` |
| POST | `/api/resources/transfers` | Request transfer | `inventory:transfer` |
| PUT | `/api/resources/transfers/:id` | Update transfer | `inventory:transfer` |
| POST | `/api/resources/transfers/:id/approve` | Approve transfer | `inventory:approve` |
| POST | `/api/resources/transfers/:id/ship` | Mark shipped | `inventory:transfer` |
| POST | `/api/resources/transfers/:id/receive` | Mark received | `inventory:receive` |

### Analytics

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/inventory/analytics/usage` | Usage analytics | `inventory:read` |
| GET | `/api/resources/inventory/analytics/cost` | Cost analysis | `inventory:read` |
| GET | `/api/resources/inventory/analytics/waste` | Waste report | `inventory:read` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `InventoryList` | List/search/filter items | `components/resources/inventory/` |
| `InventoryDetail` | Item details with history | `components/resources/inventory/` |
| `InventoryForm` | Add/edit inventory item | `components/resources/inventory/` |
| `InventoryCard` | Summary card for item | `components/resources/inventory/` |
| `StockLevelIndicator` | Visual stock status | `components/resources/inventory/` |
| `StockAdjustmentForm` | Adjust stock levels | `components/resources/inventory/` |
| `UsageRecorder` | Record supply usage | `components/resources/inventory/` |
| `LowStockAlert` | Low stock notifications | `components/resources/inventory/` |
| `ExpirationTracker` | Track expiring items | `components/resources/inventory/` |
| `LotManager` | Manage lot/batch info | `components/resources/inventory/` |
| `PurchaseOrderList` | List purchase orders | `components/resources/inventory/` |
| `PurchaseOrderForm` | Create/edit PO | `components/resources/inventory/` |
| `PurchaseOrderDetail` | PO details view | `components/resources/inventory/` |
| `ReceivingForm` | Receive PO items | `components/resources/inventory/` |
| `SupplierList` | List/manage suppliers | `components/resources/inventory/` |
| `SupplierForm` | Add/edit supplier | `components/resources/inventory/` |
| `TransferRequestForm` | Request inventory transfer | `components/resources/inventory/` |
| `TransferTracker` | Track transfer status | `components/resources/inventory/` |
| `InventoryCountSheet` | Physical count entry | `components/resources/inventory/` |
| `UsageAnalytics` | Usage charts/reports | `components/resources/inventory/` |
| `CostAnalytics` | Cost analysis dashboard | `components/resources/inventory/` |
| `InventoryScanner` | Barcode scanning interface | `components/resources/inventory/` |

---

## Business Rules

1. **Unique SKUs**: SKUs must be unique within each clinic
2. **Stock Accuracy**: All stock changes must be documented with reason
3. **FIFO Enforcement**: Items with lot tracking use oldest (by expiration or receipt) first
4. **Reorder Alerts**: Generate alerts when available stock falls below reorder point
5. **Expiration Rules**: Items within 30 days of expiration generate urgent alerts
6. **PO Approval**: Purchase orders over threshold amount require manager approval
7. **Receiving Validation**: Received quantities cannot exceed ordered quantities without explanation
8. **Transfer Balance**: Transfer out reduces source stock immediately; transfer in increases upon receipt
9. **Usage Documentation**: Usage linked to patient/procedure requires valid references
10. **Negative Stock Prevention**: Stock cannot go negative without supervisor override

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Treatment Management | Optional | Procedure-based usage tracking |
| Patient Records | Optional | Patient-linked usage tracking |
| Financial Management | Optional | Cost reporting integration |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Barcode Scanner | Optional | Item identification |
| Supplier Portals | Optional | Electronic ordering |
| Email Service | Optional | Alert notifications |

---

## Related Documentation

- [Parent: Resources Management](../../)
- [Equipment Management](../equipment-management/)
- [Treatment Management](../../treatment-management/) - Procedure usage integration
- [Financial Management](../../financial-management/) - Cost reporting

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
