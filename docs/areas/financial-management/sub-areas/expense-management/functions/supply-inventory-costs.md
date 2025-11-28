# Supply & Inventory Costs

> **Sub-Area**: [Expense Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Supply & Inventory Costs tracks supply expenses and analyzes cost per patient for orthodontic practices. This function integrates with inventory management to track supply usage, calculates supply costs by category, monitors waste and efficiency, and provides vendor price comparisons for cost optimization.

---

## Core Requirements

- [ ] Track supply costs by category (brackets, wires, elastics, etc.)
- [ ] Calculate supply cost per patient and per case
- [ ] Integrate with inventory management for usage correlation
- [ ] Monitor supply waste and expiration losses
- [ ] Provide vendor price comparison for purchasing decisions
- [ ] Track purchase order costs from request to invoice
- [ ] Manage supply budgets with variance reporting

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/supply-costs` | `finance:view_expenses` | Supply cost summary |
| GET | `/api/finance/supply-costs/by-category` | `finance:view_expenses` | Costs by supply category |
| GET | `/api/finance/supply-costs/per-patient` | `finance:view_expenses` | Cost per patient analysis |
| GET | `/api/finance/supply-costs/by-vendor` | `finance:view_expenses` | Vendor cost comparison |
| GET | `/api/finance/supply-costs/waste` | `finance:view_expenses` | Waste and loss tracking |
| GET | `/api/finance/supply-costs/budget` | `finance:view_expenses` | Budget vs actual |
| GET | `/api/finance/supply-costs/trend` | `finance:view_expenses` | Supply cost trends |

---

## Data Model

```prisma
model SupplyCostSummary {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodType    PeriodType
  periodStart   DateTime
  periodEnd     DateTime

  // Cost by category
  bracketCosts      Decimal @default(0)
  wireCosts         Decimal @default(0)
  elasticCosts      Decimal @default(0)
  alignerCosts      Decimal @default(0)
  impressionCosts   Decimal @default(0)
  sterilizationCosts Decimal @default(0)
  officeSuppyCosts  Decimal @default(0)
  patientComfortCosts Decimal @default(0)
  otherCosts        Decimal @default(0)

  // Totals
  totalSupplyCost   Decimal
  budgetAmount      Decimal?
  budgetVariance    Decimal?

  // Waste tracking
  wasteAmount       Decimal @default(0)
  expirationLoss    Decimal @default(0)

  // Per patient/case metrics
  activePatients    Int?
  newStarts         Int?
  costPerPatient    Decimal?
  costPerStart      Decimal?

  // As percentage of production
  productionAmount  Decimal?
  supplyPercentage  Decimal?

  // Timestamps
  generatedAt   DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, periodType, periodStart])
  @@index([clinicId])
  @@index([periodStart])
}

model SupplyPurchase {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Purchase details
  purchaseOrderId String? @db.ObjectId
  invoiceId     String?  @db.ObjectId
  vendorId      String   @db.ObjectId
  vendorName    String

  // Item details
  categoryId    String   @db.ObjectId
  itemName      String
  quantity      Int
  unitCost      Decimal
  totalCost     Decimal

  // Dates
  orderDate     DateTime
  receiveDate   DateTime?

  // Status
  status        PurchaseStatus @default(ORDERED)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([categoryId])
  @@index([orderDate])
}

enum PurchaseStatus {
  ORDERED
  SHIPPED
  RECEIVED
  PARTIAL
  RETURNED
}
```

---

## Business Rules

- Supply cost benchmark: 3-5% of production
- Inventory usage automatically creates supply cost entries
- Waste tracking requires reason code (expiration, damage, defect)
- Budget variances >10% trigger alerts
- Vendor price comparison updated on each purchase
- Per-patient costs calculated based on active patient count
- Per-start costs use new treatment starts for the period

---

## Dependencies

**Depends On:**
- Resources Management - Inventory (inventory data)
- Vendor Payment Tracking (purchase orders, invoices)

**Required By:**
- Overhead Cost Management
- Case Profitability Analysis
- Financial Reports

---

## Notes

**Orthodontic Supply Categories:**
- **Brackets and wires**: Core treatment supplies
- **Elastics and ligatures**: Adjustment supplies
- **Aligners** (if in-house): Clear aligner materials
- **Impression materials**: Diagnostic/treatment planning
- **Sterilization supplies**: Infection control
- **Office supplies**: Administrative supplies
- **Patient comfort items**: Wax, elastics for patients

Aligner cases have significantly different supply cost profiles than traditional braces - track separately.

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
