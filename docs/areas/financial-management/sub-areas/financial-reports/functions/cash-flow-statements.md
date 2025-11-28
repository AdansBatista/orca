# Cash Flow Statements

> **Sub-Area**: [Financial Reports](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Cash Flow Statements tracks and forecasts cash position and movement using the indirect method. This function generates statements showing operating, investing, and financing activities, projects future cash based on accounts receivable and scheduled payments, and helps orthodontic practices manage the timing differences between production and collections inherent in long treatment cycles.

---

## Core Requirements

- [ ] Generate statement of cash flows using indirect method
- [ ] Organize into operating, investing, and financing sections
- [ ] Provide cash position forecasting based on AR and payment schedules
- [ ] Analyze AR aging impact on future cash inflows
- [ ] Project payment plan cash collections
- [ ] Identify seasonal cash flow patterns
- [ ] Support period comparison for trend analysis

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/reports/cash-flow` | `finance:view_reports` | Generate cash flow statement |
| GET | `/api/finance/reports/cash-flow/comparison` | `finance:view_reports` | Period comparison |
| GET | `/api/finance/reports/cash-flow/forecast` | `finance:view_reports` | Cash forecast |
| GET | `/api/finance/reports/cash-flow/by-location` | `finance:view_reports` | Location cash flows |
| GET | `/api/finance/reports/cash-flow/seasonal` | `finance:view_reports` | Seasonal analysis |
| POST | `/api/finance/reports/cash-flow/export` | `finance:export` | Export to PDF/Excel |

---

## Data Model

```prisma
model CashFlowReport {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Report details
  periodType    PeriodType
  periodStart   DateTime
  periodEnd     DateTime
  locationId    String?  @db.ObjectId

  // Operating Activities
  netIncome             Decimal
  // Adjustments to reconcile
  depreciation          Decimal @default(0)
  badDebtExpense        Decimal @default(0)
  // Changes in operating assets/liabilities
  changeInAR            Decimal @default(0)
  changeInPrepaid       Decimal @default(0)
  changeInAP            Decimal @default(0)
  changeInDeferredRevenue Decimal @default(0)
  changeInAccrued       Decimal @default(0)
  netCashFromOperating  Decimal

  // Investing Activities
  equipmentPurchases    Decimal @default(0)
  leaseholdImprovements Decimal @default(0)
  assetDisposals        Decimal @default(0)
  netCashFromInvesting  Decimal

  // Financing Activities
  loanProceeds          Decimal @default(0)
  loanPayments          Decimal @default(0)
  ownerContributions    Decimal @default(0)
  ownerDistributions    Decimal @default(0)
  netCashFromFinancing  Decimal

  // Summary
  netChangeInCash       Decimal
  beginningCash         Decimal
  endingCash            Decimal

  // Metadata
  reportData    Json     // Full detail breakdown
  documentUrl   String?

  // Timestamps
  generatedAt   DateTime @default(now())
  createdBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([periodStart])
}

model CashForecast {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Forecast details
  forecastDate  DateTime
  forecastDays  Int      // 30, 60, 90 days

  // Opening position
  currentCash   Decimal

  // Expected inflows
  expectedPatientCollections  Decimal @default(0)
  expectedInsuranceCollections Decimal @default(0)
  expectedPaymentPlanCollections Decimal @default(0)
  otherInflows  Decimal  @default(0)
  totalInflows  Decimal

  // Expected outflows
  expectedPayroll       Decimal @default(0)
  expectedVendorPayments Decimal @default(0)
  expectedLoanPayments  Decimal @default(0)
  expectedDistributions Decimal @default(0)
  otherOutflows         Decimal @default(0)
  totalOutflows         Decimal

  // Projected position
  projectedCash Decimal
  minimumCash   Decimal? // Low scenario
  maximumCash   Decimal? // High scenario

  // Confidence
  confidenceLevel Decimal?

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([forecastDate])
}
```

---

## Business Rules

- Indirect method starts with net income and adjusts for non-cash items
- Change in deferred revenue impacts operating cash flow (key for orthodontics)
- AR increase reduces cash from operations; decrease adds to cash
- Payment plan collections more predictable than general patient AR
- Insurance collections have 30-45 day typical lag from submission
- Seasonal adjustments account for back-to-school and summer peaks
- Forecasts updated weekly for rolling projections

---

## Dependencies

**Depends On:**
- Profit & Loss Statements (net income)
- Balance Sheet (change in accounts)
- Collections Tracking (AR data)
- Payment Processing (payment schedules)

**Required By:**
- Analytics Dashboard (cash position KPIs)
- Budgeting and Planning
- Financing Decisions

---

## Notes

**Cash Flow Statement Structure:**
```
CASH FLOW STATEMENT (Indirect Method)
=====================================

OPERATING ACTIVITIES
  Net Income
  Adjustments:
    + Depreciation
    + Bad Debt Expense
  Changes in:
    - Accounts Receivable (increase)
    - Prepaid Expenses
    + Accounts Payable (increase)
    + Deferred Revenue (increase)  ← Key ortho item!
    + Accrued Expenses
------------------------
  Net Cash from Operations

INVESTING ACTIVITIES
  - Equipment Purchases
  - Leasehold Improvements
  + Asset Disposals
------------------------
  Net Cash from Investing

FINANCING ACTIVITIES
  + Loan Proceeds
  - Loan Payments
  + Owner Contributions
  - Owner Distributions
------------------------
  Net Cash from Financing

NET CHANGE IN CASH

Beginning Cash Balance
Ending Cash Balance
```

**Cash Forecasting Reliability:**
| Source | Timing | Reliability |
|--------|--------|-------------|
| Payment Plans | Scheduled dates | High (85%+) |
| Insurance Claims | 30-45 days | Medium (70%) |
| Patient Balances | Variable | Low (50%) |
| Deferred Revenue | N/A (not cash) | N/A |

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
