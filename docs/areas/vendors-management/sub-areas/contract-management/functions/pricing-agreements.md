# Pricing Agreements

> **Sub-Area**: [Contract Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Pricing Agreements tracks contracted pricing, discounts, rebates, and special terms negotiated with vendors. This function enables practices to ensure they receive contracted rates on orders, track volume discounts and rebate programs, monitor price protection periods, and compare pricing across vendors. Integrates with Order Management to apply correct pricing automatically.

---

## Core Requirements

- [ ] Track base pricing for products/services by contract
- [ ] Define volume discount tiers with thresholds
- [ ] Manage rebate programs with tracking periods
- [ ] Record price protection periods and increase caps
- [ ] Track promotional pricing with effective dates
- [ ] Compare pricing across multiple vendor contracts
- [ ] Alert when pricing terms are expiring
- [ ] Validate order pricing against contracted rates
- [ ] Calculate rebate earnings and credits due
- [ ] Historical price tracking for trend analysis

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/contracts/:id/pricing` | `contract:view_terms` | Get pricing terms |
| POST | `/api/vendors/contracts/:id/pricing` | `contract:update` | Add pricing term |
| PUT | `/api/vendors/contracts/pricing/:id` | `contract:update` | Update pricing |
| GET | `/api/vendors/pricing/compare` | `contract:read` | Compare vendor pricing |
| GET | `/api/vendors/pricing/rebates` | `contract:read` | Rebate tracking |
| POST | `/api/vendors/pricing/validate` | `order:create` | Validate order pricing |

---

## Data Model

```prisma
// Pricing terms stored as ContractTerm with specific types
model ContractTerm {
  // ... base fields

  termType      ContractTermType // PRICING, DISCOUNT, VOLUME_DISCOUNT, REBATE
  description   String
  value         Decimal?  // Price or percentage
  unit          String?   // %, USD, per unit, etc.
  effectiveDate DateTime?
  expirationDate DateTime?
}

// Extended pricing detail (optional separate model)
model PricingTier {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  contractId    String   @db.ObjectId
  termId        String?  @db.ObjectId

  // Product/Category
  productCode   String?
  category      String?

  // Tier Details
  tierName      String
  minQuantity   Decimal
  maxQuantity   Decimal?
  unitPrice     Decimal
  discountPercent Decimal?

  // Validity
  effectiveDate DateTime
  expirationDate DateTime?

  @@index([contractId])
  @@index([productCode])
}

model RebateProgram {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  contractId    String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Program Details
  programName   String
  rebateType    RebateType
  rebatePercent Decimal?
  rebateAmount  Decimal?

  // Thresholds
  minSpend      Decimal?
  minQuantity   Decimal?

  // Period
  periodType    String   // Monthly, Quarterly, Annual
  periodStart   DateTime
  periodEnd     DateTime

  // Status
  status        String   @default("ACTIVE")

  @@index([contractId])
  @@index([vendorId])
}

enum RebateType {
  PERCENT_OF_SPEND
  FIXED_AMOUNT
  TIERED_PERCENT
  VOLUME_BASED
}
```

---

## Business Rules

- Base pricing applies when no volume discount threshold met
- Volume tiers apply based on order quantity or period spend
- Rebates calculated at period end based on actual purchases
- Price protection locks pricing for specified period
- Increase caps limit annual price increases (e.g., max 5%)
- Promotional pricing has strict effective/expiration dates
- Order pricing validated against contract before submission
- Price variance alerts when invoice differs from contracted price
- Rebate credits tracked until received and reconciled

---

## Dependencies

**Depends On:**
- Contract Creation (parent contract)
- Terms Tracking (pricing as contract terms)

**Required By:**
- Order Management (apply contracted pricing)
- Financial Management (rebate tracking)
- Vendor Performance (price competitiveness)

---

## Notes

- Pricing catalog integration for product-level pricing
- Support for category-level pricing agreements
- Bundle pricing for product kits
- Currency handling for international vendors
- Price comparison reports for negotiations
- Historical pricing trends for cost analysis

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
