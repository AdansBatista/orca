# Depreciation Tracking

> **Sub-Area**: [Equipment Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Depreciation Tracking calculates and reports equipment depreciation for financial reporting and asset management. The system tracks purchase information, applies appropriate depreciation methods (straight-line, declining balance), generates depreciation schedules, and exports data for financial system integration. This supports accurate financial reporting and helps plan equipment replacement based on remaining book value.

---

## Core Requirements

- [ ] Track purchase price and acquisition date
- [ ] Set useful life and salvage value per equipment
- [ ] Support multiple depreciation methods (straight-line, declining balance, none)
- [ ] Calculate monthly/annual depreciation automatically
- [ ] Track accumulated depreciation and current book value
- [ ] Generate depreciation schedules by equipment
- [ ] Produce asset summary reports (current value, depreciation)
- [ ] Support book and tax depreciation (different methods)
- [ ] Export depreciation data for financial system integration
- [ ] Alert on fully depreciated equipment

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/equipment/depreciation` | `equipment:read` | Get depreciation report |
| GET | `/api/resources/equipment/:id/depreciation` | `equipment:read` | Get item depreciation details |
| POST | `/api/resources/equipment/depreciation/calculate` | `equipment:update` | Calculate/recalculate depreciation |
| GET | `/api/resources/equipment/depreciation/schedule` | `equipment:read` | Get depreciation schedule |
| GET | `/api/resources/equipment/depreciation/export` | `equipment:read` | Export depreciation data |

---

## Data Model

```prisma
// Fields added to Equipment model
model Equipment {
  // ... existing fields ...

  // Purchase info
  purchaseDate      DateTime?
  purchasePrice     Decimal?
  vendorId          String?  @db.ObjectId
  purchaseOrderNumber String?

  // Depreciation settings
  usefulLifeMonths  Int?
  salvageValue      Decimal?
  depreciationMethod DepreciationMethod @default(STRAIGHT_LINE)

  // Calculated values (cached)
  accumulatedDepreciation Decimal @default(0)
  currentBookValue  Decimal?
  monthlyDepreciation Decimal?

  // Fully depreciated flag
  isFullyDepreciated Boolean @default(false)
  fullyDepreciatedDate DateTime?
}

enum DepreciationMethod {
  STRAIGHT_LINE      // (Cost - Salvage) / Useful Life
  DECLINING_BALANCE  // Double declining balance method
  NONE               // No depreciation (e.g., land, minor items)
}

model DepreciationEntry {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  equipmentId     String   @db.ObjectId

  // Period
  period          String   // YYYY-MM format
  year            Int
  month           Int

  // Amounts
  depreciationAmount Decimal
  accumulatedDepreciation Decimal
  bookValue       Decimal

  // Method used
  method          DepreciationMethod

  // Type
  entryType       DepreciationType @default(BOOK)

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic    Clinic    @relation(fields: [clinicId], references: [id])
  equipment Equipment @relation(fields: [equipmentId], references: [id])

  @@unique([equipmentId, period, entryType])
  @@index([clinicId])
  @@index([equipmentId])
  @@index([period])
}

enum DepreciationType {
  BOOK  // Book/GAAP depreciation
  TAX   // Tax depreciation (if different)
}
```

---

## Business Rules

- Depreciation calculated monthly, typically run at month-end
- Equipment must have purchase price and date to calculate depreciation
- Straight-line: Monthly = (Purchase Price - Salvage Value) / Useful Life Months
- Declining balance: Uses 200% of straight-line rate applied to remaining book value
- Depreciation stops when book value reaches salvage value
- Disposed equipment depreciation stops at disposal date
- Retroactive depreciation calculations supported for late-entered equipment
- Currency stored with 4 decimal precision

---

## Dependencies

**Depends On:**
- Equipment Catalog (requires equipment with purchase information)
- Auth & Authorization (user authentication, permissions)

**Required By:**
- Financial Management (asset reporting, depreciation expense)
- Equipment Replacement Planning (book value analysis)

---

## Notes

- Consider batch processing for month-end depreciation calculations
- Depreciation method changes should be prospective, not retroactive
- Export formats: CSV, Excel, or direct API for accounting system integration
- Asset categories may have default useful life values
- Impairment write-downs may need manual adjustment capability
- Consider prorating first/last month depreciation (half-month convention)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
