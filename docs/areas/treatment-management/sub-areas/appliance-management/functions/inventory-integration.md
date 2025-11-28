# Inventory Integration

> **Sub-Area**: [Appliance Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Inventory Integration connects appliance usage to the inventory management system, automatically tracking supply consumption when appliances are placed or used. This enables accurate supply cost tracking per case, automated reorder alerts, lot number tracking for recalls, and usage analytics. The function bridges clinical appliance records with operational inventory management.

---

## Core Requirements

- [ ] Link appliance usage to inventory items
- [ ] Deduct supplies upon placement/use
- [ ] Track supply consumption by appliance type
- [ ] Monitor inventory levels with low-stock alerts
- [ ] Track lot numbers for recall management
- [ ] Calculate supply costs per patient/case
- [ ] Generate usage reports and analytics
- [ ] Support multiple vendors per supply type

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/appliances/:id/deduct-inventory` | `appliance:update` | Deduct inventory for appliance |
| GET | `/api/inventory/appliance-usage` | `inventory:read` | Appliance usage report |
| GET | `/api/patients/:patientId/supply-costs` | `appliance:read` | Patient supply costs |
| GET | `/api/inventory/low-stock/appliances` | `inventory:read` | Low-stock appliance supplies |
| GET | `/api/inventory/lot-tracking/:lotNumber` | `inventory:read` | Lot tracking report |
| POST | `/api/appliances/bulk-deduct` | `appliance:update` | Bulk inventory deduction |

---

## Data Model

```prisma
model ApplianceInventoryLink {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId

  // Appliance Reference
  applianceRecordId   String?  @db.ObjectId
  applianceType       ApplianceRecordType
  patientId           String   @db.ObjectId

  // Inventory Reference
  inventoryItemId     String   @db.ObjectId
  lotNumber           String?
  expirationDate      DateTime?

  // Usage Details
  usageDate           DateTime @default(now())
  quantity            Int      @default(1)
  unitCost            Decimal?

  // Provider
  usedBy              String   @db.ObjectId

  // Notes
  notes               String?

  // Timestamps
  createdAt           DateTime @default(now())

  @@index([clinicId])
  @@index([applianceRecordId])
  @@index([inventoryItemId])
  @@index([patientId])
  @@index([lotNumber])
}

model SupplyCostSummary {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId            String   @db.ObjectId
  patientId           String   @db.ObjectId
  treatmentPlanId     String?  @db.ObjectId

  // Cost Breakdown
  bracketCost         Decimal  @default(0)
  wireCost            Decimal  @default(0)
  bondingCost         Decimal  @default(0)
  elasticCost         Decimal  @default(0)
  accessoryCost       Decimal  @default(0)
  retainerCost        Decimal  @default(0)
  totalCost           Decimal  @default(0)

  // Period
  periodStart         DateTime
  periodEnd           DateTime?

  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([clinicId])
  @@index([patientId])
  @@index([treatmentPlanId])
}
```

---

## Business Rules

- Inventory deducted when appliance placed (not ordered)
- Low-stock alerts based on reorder points
- Lot tracking enables targeted recall notifications
- Cost calculations use current inventory unit costs
- Bulk deductions supported for multi-item procedures
- Manual adjustment available for corrections

---

## Dependencies

**Depends On:**
- Bracket Tracking (appliance records)
- Wire Sequences (wire usage)
- Aligner Tracking (aligner inventory)
- Retainer Management (retainer orders)
- Resources Management / Inventory (inventory system)

**Required By:**
- Financial Management (cost tracking)
- Reporting & Analytics (usage reports)

---

## Notes

- Consider barcode/scanner integration for efficient tracking
- Lot tracking critical for medical device recalls
- Usage analytics inform purchasing decisions

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
