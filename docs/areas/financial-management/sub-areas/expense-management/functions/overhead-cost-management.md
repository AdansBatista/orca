# Overhead Cost Management

> **Sub-Area**: [Expense Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Overhead Cost Management calculates, tracks, and benchmarks overhead costs for the orthodontic practice. This function provides overhead ratio analysis, categorizes costs as fixed vs variable, tracks overhead trends, computes cost per patient metrics, and compares performance against industry benchmarks to identify efficiency opportunities.

---

## Core Requirements

- [ ] Calculate overhead ratio (Operating Expenses ÷ Collections)
- [ ] Categorize expenses as fixed vs variable costs
- [ ] Track overhead trending over time with variance analysis
- [ ] Calculate cost per patient and cost per visit metrics
- [ ] Provide industry benchmarking comparisons by expense category
- [ ] Allocate overhead to multiple locations for multi-site practices
- [ ] Generate efficiency recommendations based on analysis

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/overhead` | `finance:view_expenses` | Get overhead summary |
| GET | `/api/finance/overhead/trend` | `finance:view_expenses` | Overhead trend analysis |
| GET | `/api/finance/overhead/by-category` | `finance:view_expenses` | Breakdown by category |
| GET | `/api/finance/overhead/benchmark` | `finance:view_expenses` | Industry benchmark comparison |
| GET | `/api/finance/overhead/by-location` | `finance:view_expenses` | Location overhead comparison |
| GET | `/api/finance/overhead/fixed-variable` | `finance:view_expenses` | Fixed vs variable analysis |
| GET | `/api/finance/overhead/per-patient` | `finance:view_expenses` | Cost per patient metrics |

---

## Data Model

```prisma
model OverheadSummary {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodType    PeriodType
  periodStart   DateTime
  periodEnd     DateTime

  // Location (null for consolidated)
  locationId    String?  @db.ObjectId

  // Revenue basis
  collections   Decimal

  // Expenses by type
  payrollExpense    Decimal @default(0)
  facilityExpense   Decimal @default(0)
  supplyExpense     Decimal @default(0)
  labExpense        Decimal @default(0)
  marketingExpense  Decimal @default(0)
  technologyExpense Decimal @default(0)
  insuranceExpense  Decimal @default(0)
  professionalExpense Decimal @default(0)
  otherExpense      Decimal @default(0)

  // Totals
  totalOverhead     Decimal
  fixedCosts        Decimal
  variableCosts     Decimal

  // Ratios
  overheadRatio     Decimal
  staffCostRatio    Decimal
  labCostRatio      Decimal
  facilityCostRatio Decimal
  marketingCostRatio Decimal

  // Per patient metrics
  activePatients    Int?
  expensePerPatient Decimal?
  totalVisits       Int?
  expensePerVisit   Decimal?

  // Benchmarking
  benchmarkVariance Decimal?

  // Timestamps
  generatedAt   DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, periodType, periodStart, locationId])
  @@index([clinicId])
  @@index([periodStart])
}
```

---

## Business Rules

- Overhead calculation excludes provider compensation (tracked separately)
- Fixed costs remain constant regardless of patient volume
- Variable costs scale with production/collections
- Overhead ratio calculated using collections (cash basis) not production
- Multi-location practices allocate shared costs by agreed method (headcount, sqft, revenue)
- Benchmarks updated annually from industry data
- Monthly overhead calculation runs after month-end close

---

## Dependencies

**Depends On:**
- Vendor Payment Tracking (expense data)
- Payroll Integration (staff costs)
- Collections Tracking (revenue for ratio)

**Required By:**
- Financial Reports (expense analysis)
- Analytics Dashboard (KPIs)
- Case Profitability (cost allocation)

---

## Notes

**Industry Benchmarks:**
| Expense Category | Target % | Warning Threshold |
|------------------|----------|-------------------|
| Total Overhead | 55-65% | >70% |
| Staff Cost | 20-28% | >32% |
| Lab Cost | 5-8% | >10% |
| Facility Cost | 8-12% | >15% |
| Marketing | 3-5% | >7% |
| Supplies | 3-5% | >6% |

**Overhead Ratio Formula:**
```
Overhead Ratio = Operating Expenses ÷ Collections

Operating Expenses include:
- Payroll (non-provider staff)
- Facility (rent, utilities, maintenance)
- Supplies
- Lab fees
- Marketing
- Insurance
- Technology
- Administrative

Provider compensation typically excluded from overhead calculation
```

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
