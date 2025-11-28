# Balance Sheet

> **Sub-Area**: [Financial Reports](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Balance Sheet generates balance sheet reports showing the practice's financial position at a specific point in time. This function produces standard balance sheet format with assets, liabilities, and equity sections, supports monthly snapshots for trending, provides multi-location consolidation, and tracks key orthodontic-specific items like deferred revenue and payment plan receivables.

---

## Core Requirements

- [ ] Generate standard balance sheet format following GAAP guidelines
- [ ] Support as-of date reporting for any historical point
- [ ] Create monthly snapshots for trend analysis
- [ ] Enable multi-location consolidation with inter-company eliminations
- [ ] Track key orthodontic accounts (deferred revenue, payment plan AR)
- [ ] Verify balance (Assets = Liabilities + Equity) before generation
- [ ] Provide account detail drill-down capability

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/reports/balance-sheet` | `finance:view_reports` | Generate balance sheet |
| GET | `/api/finance/reports/balance-sheet/as-of/:date` | `finance:view_reports` | As-of date balance sheet |
| GET | `/api/finance/reports/balance-sheet/comparison` | `finance:view_reports` | Compare two dates |
| GET | `/api/finance/reports/balance-sheet/by-location` | `finance:view_reports` | Location balance sheets |
| GET | `/api/finance/reports/balance-sheet/consolidated` | `finance:view_reports` | Consolidated balance sheet |
| GET | `/api/finance/reports/balance-sheet/trend` | `finance:view_reports` | Monthly balance trend |
| POST | `/api/finance/reports/balance-sheet/export` | `finance:export` | Export to PDF/Excel |

---

## Data Model

```prisma
model BalanceSheetSnapshot {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Report details
  asOfDate      DateTime
  locationId    String?  @db.ObjectId  // null for consolidated

  // ASSETS
  // Current Assets
  cashAndEquivalents    Decimal @default(0)
  arPatient             Decimal @default(0)
  arInsurance           Decimal @default(0)
  arPaymentPlans        Decimal @default(0)
  allowanceForDoubtful  Decimal @default(0)
  netReceivables        Decimal
  prepaidExpenses       Decimal @default(0)
  otherCurrentAssets    Decimal @default(0)
  totalCurrentAssets    Decimal

  // Fixed Assets
  equipment             Decimal @default(0)
  leaseholdImprovements Decimal @default(0)
  furniture             Decimal @default(0)
  accumulatedDepreciation Decimal @default(0)
  netFixedAssets        Decimal
  otherAssets           Decimal @default(0)

  totalAssets           Decimal

  // LIABILITIES
  // Current Liabilities
  accountsPayable       Decimal @default(0)
  deferredRevenue       Decimal @default(0)
  accruedExpenses       Decimal @default(0)
  payrollLiabilities    Decimal @default(0)
  currentPortionLTD     Decimal @default(0)
  otherCurrentLiabilities Decimal @default(0)
  totalCurrentLiabilities Decimal

  // Long-term Liabilities
  notesPayable          Decimal @default(0)
  equipmentLoans        Decimal @default(0)
  otherLTLiabilities    Decimal @default(0)
  totalLTLiabilities    Decimal

  totalLiabilities      Decimal

  // EQUITY
  ownerCapital          Decimal @default(0)
  retainedEarnings      Decimal @default(0)
  currentYearEarnings   Decimal @default(0)
  distributions         Decimal @default(0)
  totalEquity           Decimal

  totalLiabilitiesEquity Decimal

  // Validation
  isBalanced            Boolean @default(true)
  balanceVariance       Decimal @default(0)

  // Metadata
  reportData    Json     // Full account detail
  documentUrl   String?

  // Timestamps
  generatedAt   DateTime @default(now())
  createdBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, asOfDate, locationId])
  @@index([clinicId])
  @@index([asOfDate])
}
```

---

## Business Rules

- Balance sheet must balance (Assets = Liabilities + Equity)
- Deferred revenue is a liability representing unearned revenue from treatment contracts
- Payment plan receivables may extend beyond 12 months (split current/long-term)
- Allowance for doubtful accounts typically 1-3% of receivables
- Monthly snapshots captured on last day of month after close
- Inter-company balances eliminated in consolidated reports
- Current year earnings calculated from P&L through reporting date

---

## Dependencies

**Depends On:**
- Revenue Tracking (receivables, deferred revenue)
- Expense Management (payables, accruals)
- General Ledger (account balances)

**Required By:**
- Analytics Dashboard (financial position metrics)
- Tax Preparation
- Bank/Lender Reporting

---

## Notes

**Balance Sheet Structure:**
```
BALANCE SHEET
=============

ASSETS
  Current Assets
    - Cash and Cash Equivalents
    - Accounts Receivable - Patient
    - Accounts Receivable - Insurance
    - Payment Plan Receivables
    - Less: Allowance for Doubtful Accounts
    - Prepaid Expenses
  Fixed Assets
    - Equipment
    - Leasehold Improvements
    - Less: Accumulated Depreciation
  Other Assets
------------------------
  TOTAL ASSETS

LIABILITIES
  Current Liabilities
    - Accounts Payable
    - Deferred Revenue (key ortho item!)
    - Accrued Expenses
    - Payroll Liabilities
    - Current Portion of Long-term Debt
  Long-term Liabilities
    - Notes Payable
    - Equipment Loans
------------------------
  TOTAL LIABILITIES

EQUITY
  Owner's Equity/Capital
  Retained Earnings
  Current Year Earnings
------------------------
  TOTAL EQUITY

TOTAL LIABILITIES & EQUITY
```

**Key Orthodontic Consideration:** Deferred revenue is often a significant liability due to long treatment contracts with upfront payments.

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
