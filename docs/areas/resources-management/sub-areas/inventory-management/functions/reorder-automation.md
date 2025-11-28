# Reorder Automation

> **Sub-Area**: [Inventory Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Reorder Automation prevents stockouts by automatically monitoring stock levels and generating reorder alerts when items fall below defined thresholds. The system calculates suggested order quantities based on usage patterns, supports economic order quantity (EOQ) calculations, and can create draft purchase orders for approval. This reduces manual monitoring effort and ensures critical supplies are always available.

---

## Core Requirements

- [ ] Set reorder points per item
- [ ] Configure minimum and maximum stock levels
- [ ] Generate automatic low-stock alerts (in-app, email)
- [ ] Calculate suggested reorder quantities based on usage
- [ ] Support economic order quantity (EOQ) calculations
- [ ] Create draft purchase orders from alerts
- [ ] Track lead times by supplier
- [ ] Handle seasonal usage variations
- [ ] Consider minimum order quantities from suppliers
- [ ] Group items by supplier for efficient ordering

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/inventory/low-stock` | `inventory:read` | Get low stock items |
| GET | `/api/resources/inventory/reorder-suggestions` | `inventory:read` | Get reorder suggestions |
| PUT | `/api/resources/inventory/:id/reorder-settings` | `inventory:update` | Update reorder settings |
| POST | `/api/resources/inventory/generate-po` | `inventory:order` | Generate draft PO |
| GET | `/api/resources/inventory/alerts` | `inventory:read` | Get reorder alerts |
| PUT | `/api/resources/inventory/alerts/:id/dismiss` | `inventory:update` | Dismiss alert |

---

## Data Model

```prisma
// Reorder settings on InventoryItem
model InventoryItem {
  // ... existing fields ...

  // Reorder settings
  reorderPoint      Int        // Stock level triggering reorder
  reorderQuantity   Int        // Standard order quantity
  safetyStock       Int        @default(0)  // Buffer stock
  maxStock          Int?       // Upper limit
  leadTimeDays      Int        @default(7)  // Expected delivery time

  // Supplier order constraints
  minimumOrderQty   Int?       // Supplier minimum
  orderMultiple     Int?       // Must order in multiples

  // Auto-reorder settings
  autoReorderEnabled Boolean   @default(false)
  autoReorderThreshold Decimal? // Percentage below reorder point
}

model ReorderAlert {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  itemId          String   @db.ObjectId

  // Alert details
  alertType       ReorderAlertType
  alertDate       DateTime @default(now())

  // Stock info at alert time
  currentStock    Int
  reorderPoint    Int
  suggestedQuantity Int

  // Status
  status          AlertStatus @default(ACTIVE)
  dismissedAt     DateTime?
  dismissedBy     String?  @db.ObjectId
  dismissReason   String?

  // Resolution
  purchaseOrderId String?  @db.ObjectId
  resolvedAt      DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic        @relation(fields: [clinicId], references: [id])
  item      InventoryItem @relation(fields: [itemId], references: [id])

  @@index([clinicId])
  @@index([itemId])
  @@index([status])
  @@index([alertDate])
}

enum ReorderAlertType {
  LOW_STOCK         // Below reorder point
  CRITICAL_STOCK    // Below safety stock
  OUT_OF_STOCK      // Zero stock
  APPROACHING_LOW   // Projected to be low soon
}

enum AlertStatus {
  ACTIVE            // Needs attention
  DISMISSED         // Manually dismissed
  ORDERED           // Purchase order created
  RESOLVED          // Stock replenished
}
```

---

## Business Rules

- Alert generated when availableStock falls below reorderPoint
- Critical alert when stock falls below safetyStock
- Suggested quantity = reorderQuantity or to bring stock to maxStock
- EOQ calculation considers: annual usage, order cost, holding cost
- Lead time factored into reorder point: reorderPoint >= (dailyUsage × leadTimeDays) + safetyStock
- Only one active alert per item (don't duplicate)
- Receiving stock automatically resolves related alerts
- Dismissed alerts can be reactivated if stock drops further

---

## Dependencies

**Depends On:**
- Supplies Catalog (item definitions and settings)
- Stock Tracking (current stock levels)
- Supplier Management (supplier lead times)
- Auth & Authorization (user authentication, permissions)

**Required By:**
- Purchase Orders (draft POs from alerts)
- Inventory Dashboard (alert displays)

---

## Notes

- Consider notification preferences per user/role
- Dashboard should highlight critical items prominently
- Historical accuracy of lead times improves over time
- Seasonal adjustments may need manual configuration initially
- AI/ML could predict optimal reorder points based on patterns
- Bulk dismiss function for known situations (e.g., vendor holiday)
- Integration with supplier EDI could enable automatic ordering

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
