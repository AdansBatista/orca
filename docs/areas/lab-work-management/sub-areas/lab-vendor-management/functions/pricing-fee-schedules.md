# Pricing & Fee Schedules

> **Sub-Area**: [Lab Vendor Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Pricing & Fee Schedules maintains product pricing for each lab vendor with support for effective dates, rush upcharges, and volume discounts. This enables accurate cost calculation during order creation and supports price comparison across vendors.

---

## Core Requirements

- [ ] Maintain fee schedules by lab and product
- [ ] Support effective date ranges for pricing changes
- [ ] Configure rush/expedite upcharge rates
- [ ] Define volume discount tiers
- [ ] Track pricing history for historical orders
- [ ] Compare prices across labs for same product
- [ ] Import/export pricing in bulk
- [ ] Alert on upcoming price changes

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/vendors/:vendorId/pricing` | `lab:view_pricing` | Get vendor pricing |
| PUT | `/api/lab/vendors/:vendorId/pricing` | `lab:manage_vendors` | Update pricing |
| POST | `/api/lab/vendors/:vendorId/pricing/import` | `lab:manage_vendors` | Bulk import prices |
| GET | `/api/lab/pricing/compare/:productId` | `lab:view_pricing` | Compare across vendors |
| GET | `/api/lab/pricing/history/:productId` | `lab:view_pricing` | Price history |

---

## Data Model

```prisma
model LabFeeSchedule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId
  productId     String   @db.ObjectId

  basePrice     Decimal
  rushUpchargePercent Decimal?
  rushUpchargeFlat Decimal?

  effectiveDate DateTime
  endDate       DateTime?

  volumeDiscounts Json?  // [{minQty, discountPercent}]

  notes         String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([clinicId])
  @@index([vendorId])
  @@index([productId])
  @@index([effectiveDate])
}
```

---

## Business Rules

- Only one active price per product/vendor at any time
- Effective date determines which price applies to orders
- Historical prices preserved for order cost verification
- Rush upcharge can be percentage or flat fee (not both)
- Volume discounts applied automatically during order creation

---

## Dependencies

**Depends On:**
- Lab Directory Management (vendor context)
- Lab Product Catalog (products to price)

**Required By:**
- Lab Order Creation (cost calculation)
- Rush Order Management (upcharge calculation)
- Financial Management (expense tracking)

---

## Notes

- Consider contract-based pricing overrides
- Support effective date scheduling for future prices
- Price import from lab fee schedule PDFs

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
