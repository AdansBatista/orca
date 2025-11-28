# Profit & Loss Statements

> **Sub-Area**: [Financial Reports](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Profit & Loss Statements generates comprehensive income statements following GAAP standards for orthodontic practices. This function produces P&L reports across multiple periods, supports both cash and accrual basis accounting, enables multi-location consolidation, and provides drill-down capability to transaction details for thorough financial analysis.

---

## Core Requirements

- [ ] Generate standard P&L format following GAAP guidelines
- [ ] Support monthly, quarterly, and annual period reporting
- [ ] Enable multi-period comparison (current vs prior year)
- [ ] Provide location-level and consolidated views for multi-site practices
- [ ] Support both cash basis and accrual basis reporting options
- [ ] Allow custom date range reporting for ad-hoc analysis
- [ ] Enable drill-down from summary lines to transaction details
- [ ] Calculate percentage of revenue for each line item

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/reports/profit-loss` | `finance:view_reports` | Generate P&L report |
| GET | `/api/finance/reports/profit-loss/comparison` | `finance:view_reports` | Multi-period comparison |
| GET | `/api/finance/reports/profit-loss/by-location` | `finance:view_reports` | Location-level P&L |
| GET | `/api/finance/reports/profit-loss/consolidated` | `finance:view_reports` | Consolidated P&L |
| GET | `/api/finance/reports/profit-loss/drill-down` | `finance:view_reports` | Transaction details |
| POST | `/api/finance/reports/profit-loss/export` | `finance:export` | Export to PDF/Excel |

---

## Data Model

```prisma
model ProfitLossReport {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Report details
  reportName    String
  periodType    PeriodType
  periodStart   DateTime
  periodEnd     DateTime

  // Scope
  locationId    String?  @db.ObjectId  // null for consolidated
  accountingBasis AccountingBasis @default(ACCRUAL)

  // Comparison
  comparePeriodStart DateTime?
  comparePeriodEnd   DateTime?

  // Revenue section
  patientRevenue        Decimal @default(0)
  insuranceRevenue      Decimal @default(0)
  otherRevenue          Decimal @default(0)
  grossRevenue          Decimal

  // Adjustments
  insuranceWriteOffs    Decimal @default(0)
  courtesyDiscounts     Decimal @default(0)
  badDebtWriteOffs      Decimal @default(0)
  totalAdjustments      Decimal

  netRevenue            Decimal

  // Operating expenses
  payrollExpenses       Decimal @default(0)
  facilityExpenses      Decimal @default(0)
  supplyExpenses        Decimal @default(0)
  labExpenses           Decimal @default(0)
  marketingExpenses     Decimal @default(0)
  technologyExpenses    Decimal @default(0)
  professionalExpenses  Decimal @default(0)
  administrativeExpenses Decimal @default(0)
  depreciationExpenses  Decimal @default(0)
  totalOperatingExpenses Decimal

  netOperatingIncome    Decimal

  // Other income/expenses
  interestIncome        Decimal @default(0)
  interestExpense       Decimal @default(0)
  otherIncomeExpense    Decimal @default(0)

  netIncome             Decimal

  // Metadata
  reportData    Json     // Full breakdown detail
  documentUrl   String?

  // Timestamps
  generatedAt   DateTime @default(now())
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([periodStart])
  @@index([generatedAt])
}

enum AccountingBasis {
  ACCRUAL
  CASH
  MODIFIED_CASH
}
```

---

## Business Rules

- Accrual basis recognizes revenue when earned (uses deferred revenue schedules)
- Cash basis recognizes revenue when collected
- Net revenue = Gross revenue - Adjustments
- Operating expenses exclude provider compensation for overhead analysis
- Multi-location reports require consistent accounting periods
- Comparison reports show dollar and percentage changes
- Report generation logged for audit trail
- Closed period reports are final and archived

---

## Dependencies

**Depends On:**
- Revenue Tracking (revenue data)
- Expense Management (expense data)
- Deferred Revenue Management (accrual calculations)

**Required By:**
- Analytics Dashboard (profitability metrics)
- Tax Preparation
- Month/Year-End Close

---

## Notes

**P&L Report Structure:**
```
PROFIT & LOSS STATEMENT
========================

REVENUE
  Patient Revenue
    - Patient Payments
    - Payment Plan Collections
  Insurance Revenue
    - Insurance Payments
  Other Revenue
    - Interest Income
    - Miscellaneous
  Less: Adjustments
    - Insurance Write-offs
    - Courtesy Discounts
    - Bad Debt Write-offs
------------------------
  NET REVENUE

OPERATING EXPENSES
  Payroll & Benefits
  Facility
  Clinical (Supplies + Lab)
  Marketing
  Technology
  Professional Services
  Administrative
  Depreciation
------------------------
  TOTAL OPERATING EXPENSES

NET OPERATING INCOME

  Other Income/Expenses
------------------------
NET INCOME
```

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
