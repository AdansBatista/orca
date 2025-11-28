# Stock Tracking

> **Sub-Area**: [Inventory Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Stock Tracking maintains accurate real-time inventory levels for all supplies across clinic locations. The system records all stock movements (received, used, adjusted, transferred), supports lot/batch tracking for traceability, and provides complete stock history. This enables staff to know what's available, supports usage documentation for patient records, and provides data for reorder decisions.

---

## Core Requirements

- [ ] Track current stock by item and location
- [ ] Record all stock movements with reason and documentation
- [ ] Support lot/batch tracking for traceability
- [ ] Calculate available stock (current minus reserved)
- [ ] Provide stock level snapshots and history
- [ ] Support barcode/QR scanning for stock operations
- [ ] Track stock by storage location within clinic
- [ ] Calculate average usage rates
- [ ] Support physical inventory counts with variance tracking
- [ ] Link usage to patient and procedure when applicable

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/inventory/:id/stock` | `inventory:read` | Get current stock |
| POST | `/api/resources/inventory/:id/adjust` | `inventory:adjust` | Adjust stock |
| POST | `/api/resources/inventory/:id/use` | `inventory:use` | Record usage |
| GET | `/api/resources/inventory/:id/movements` | `inventory:read` | Get stock history |
| GET | `/api/resources/inventory/:id/lots` | `inventory:read` | Get lot details |
| POST | `/api/resources/inventory/count` | `inventory:adjust` | Submit inventory count |
| GET | `/api/resources/inventory/stock-levels` | `inventory:read` | Get all stock levels |

---

## Data Model

```prisma
// Stock tracking fields on InventoryItem
model InventoryItem {
  // ... existing fields ...

  // Stock levels
  currentStock    Int      @default(0)
  reservedStock   Int      @default(0)
  availableStock  Int      @default(0)  // Computed: currentStock - reservedStock

  // Reorder settings (see reorder-automation.md)
  reorderPoint    Int
  reorderQuantity Int
  safetyStock     Int      @default(0)
  maxStock        Int?
  leadTimeDays    Int      @default(7)

  // Tracking options
  trackLots       Boolean  @default(false)
  trackExpiry     Boolean  @default(true)
  trackSerial     Boolean  @default(false)

  // Usage stats (cached)
  averageDailyUsage Decimal?
  lastUsedAt      DateTime?
}

model StockMovement {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  itemId          String   @db.ObjectId
  lotId           String?  @db.ObjectId

  // Movement details
  movementType    StockMovementType
  quantity        Int      // Positive for additions, negative for removals
  unitCost        Decimal?

  // Reference
  referenceType   ReferenceType?
  referenceId     String?  @db.ObjectId

  // Usage context (when applicable)
  patientId       String?  @db.ObjectId
  appointmentId   String?  @db.ObjectId
  procedureId     String?  @db.ObjectId
  providerId      String?  @db.ObjectId

  // Stock snapshot
  previousStock   Int
  newStock        Int

  // Notes
  reason          String?
  notes           String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  createdBy String   @db.ObjectId

  // Relations
  clinic    Clinic        @relation(fields: [clinicId], references: [id])
  item      InventoryItem @relation(fields: [itemId], references: [id])

  @@index([clinicId])
  @@index([itemId])
  @@index([movementType])
  @@index([createdAt])
  @@index([patientId])
}

enum StockMovementType {
  RECEIVED            // From purchase order
  USED                // Used in treatment
  ADJUSTMENT_ADD      // Manual increase
  ADJUSTMENT_REMOVE   // Manual decrease
  TRANSFER_IN         // From another location
  TRANSFER_OUT        // To another location
  RETURNED_TO_SUPPLIER
  RETURNED_FROM_PATIENT
  EXPIRED             // Removed due to expiration
  DAMAGED             // Removed due to damage
  LOST                // Unaccounted for
  RECALLED            // Manufacturer recall
  OPENING_BALANCE     // Initial stock setup
  COUNT_VARIANCE      // Physical count adjustment
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

model InventoryLot {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  itemId          String   @db.ObjectId

  // Lot identification
  lotNumber       String
  serialNumbers   String[] // If serial tracking enabled

  // Quantities
  initialQuantity Int
  currentQuantity Int
  reservedQuantity Int    @default(0)

  // Dates
  receivedDate    DateTime
  manufacturingDate DateTime?
  expirationDate  DateTime?

  // Source
  purchaseOrderId String?  @db.ObjectId
  supplierId      String?  @db.ObjectId

  // Cost
  unitCost        Decimal?

  // Location
  storageLocation String?

  // Status
  status          LotStatus @default(AVAILABLE)
  quarantineReason String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic        @relation(fields: [clinicId], references: [id])
  item      InventoryItem @relation(fields: [itemId], references: [id])

  @@unique([clinicId, itemId, lotNumber])
  @@index([clinicId])
  @@index([itemId])
  @@index([expirationDate])
  @@index([status])
}

enum LotStatus {
  AVAILABLE   // Ready for use
  RESERVED    // Reserved for specific use
  DEPLETED    // Fully consumed
  EXPIRED     // Past expiration date
  RECALLED    // Under manufacturer recall
  QUARANTINE  // Held for investigation
  DAMAGED     // Cannot be used
}
```

---

## Business Rules

- All stock changes must be documented with reason
- Stock cannot go negative without supervisor override
- FIFO enforcement: oldest lot (by expiration or receipt) used first
- Usage linked to patient/procedure requires valid reference
- Average daily usage calculated from last 30/60/90 days
- Reserved stock subtracted from available for reorder calculations
- Physical counts create variance adjustments automatically
- Lot tracking required for certain categories (bonding, impression)

---

## Dependencies

**Depends On:**
- Supplies Catalog (items must exist in catalog)
- Auth & Authorization (user authentication, permissions)
- Patient Records (optional - for usage linking)

**Required By:**
- Reorder Automation (triggers based on stock levels)
- Expiration Monitoring (monitors lot expiration dates)
- Usage Analytics (analyzes consumption patterns)
- Purchase Orders (receiving updates stock)

---

## Notes

- Mobile-friendly interface for recording usage at chairside
- Barcode scanning streamlines usage recording
- Reserved stock supports future appointment preparation
- Consider integration with practice management for procedure-based usage
- Stock snapshots at month-end for reporting
- Variance reports help identify shrinkage or process issues

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
