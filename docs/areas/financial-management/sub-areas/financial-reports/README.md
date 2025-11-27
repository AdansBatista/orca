# Financial Reports

> **Area**: [Financial Management](../../)
>
> **Sub-Area**: 10.3 Financial Reports
>
> **Purpose**: Generate comprehensive financial statements including P&L, balance sheet, cash flow, and custom reports

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Financial Management](../../) |
| **Dependencies** | Revenue Tracking, Expense Management, Billing & Insurance |
| **Last Updated** | 2024-11-26 |

---

## Overview

Financial Reports provides comprehensive financial statement generation for orthodontic practices. This sub-area delivers standard accounting reports (P&L, balance sheet, cash flow) along with orthodontic-specific reports such as specialized AR aging, write-off tracking, and custom report building.

### Key Goals

- **Accuracy**: GAAP-compliant financial statements
- **Timeliness**: Real-time and period-end reporting
- **Flexibility**: Multiple views (accrual/cash, location/consolidated)
- **Compliance**: Audit-ready documentation
- **Customization**: Build reports for specific needs

### Report Categories

| Category | Reports | Frequency |
|----------|---------|-----------|
| **Core Statements** | P&L, Balance Sheet, Cash Flow | Monthly, Quarterly, Annual |
| **Receivables** | AR Aging, Collections, Payment Plans | Daily, Weekly, Monthly |
| **Adjustments** | Write-offs, Adjustments, Discounts | Monthly |
| **Period Close** | Month-end, Year-end Packages | As needed |
| **Tax** | Tax prep, 1099s, Depreciation | Annual |
| **Custom** | User-defined reports | As needed |

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 10.3.1 | [Profit & Loss Statements](./functions/profit-loss-statements.md) | Generate P&L statements | 📋 Planned | Critical |
| 10.3.2 | [Balance Sheet](./functions/balance-sheet.md) | Generate balance sheets | 📋 Planned | Critical |
| 10.3.3 | [Cash Flow Statements](./functions/cash-flow-statements.md) | Cash flow analysis | 📋 Planned | High |
| 10.3.4 | [AR Aging Reports](./functions/ar-aging-reports.md) | Orthodontic-specific AR aging | 📋 Planned | Critical |
| 10.3.5 | [Write-off & Adjustment Reports](./functions/writeoff-adjustment-reports.md) | Track adjustments and write-offs | 📋 Planned | High |
| 10.3.6 | [Custom Report Builder](./functions/custom-report-builder.md) | Build custom reports | 📋 Planned | Medium |

---

## Function Details

### 10.3.1 Profit & Loss Statements

**Purpose**: Generate comprehensive profit and loss statements.

**Key Capabilities**:
- Standard P&L format following GAAP
- Monthly, quarterly, annual periods
- Multi-period comparison (this year vs last year)
- Location-level and consolidated views
- Cash basis and accrual basis options
- Custom date range reporting
- Drill-down to transaction detail
- Percentage of revenue calculations

**Report Structure**:
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
    - Staff Wages
    - Provider Compensation
    - Payroll Taxes
    - Benefits
  Facility
    - Rent/Mortgage
    - Utilities
    - Maintenance
  Clinical
    - Supplies
    - Lab Fees
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

**User Stories**:
- As an **owner**, I want to see my P&L compared to last year so I can track growth
- As a **clinic admin**, I want location-specific P&L so I can compare performance
- As an **accountant**, I want accrual basis P&L so I can prepare accurate financials

---

### 10.3.2 Balance Sheet

**Purpose**: Generate balance sheets showing practice financial position.

**Key Capabilities**:
- Standard balance sheet format
- As-of date reporting
- Monthly snapshots
- Multi-location consolidation
- Key account trend analysis
- Inter-company elimination (if applicable)

**Report Structure**:
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
    - Deferred Revenue
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

**User Stories**:
- As an **owner**, I want to see my balance sheet so I understand my financial position
- As an **accountant**, I want monthly balance sheet snapshots for trending
- As a **lender**, I want consolidated balance sheet for loan review

---

### 10.3.3 Cash Flow Statements

**Purpose**: Track and forecast cash position and movement.

**Key Capabilities**:
- Statement of cash flows (indirect method)
- Operating, investing, financing sections
- Cash position forecasting
- AR aging impact on future cash
- Payment plan cash projections
- Seasonal pattern analysis

**Report Structure**:
```
CASH FLOW STATEMENT
===================

OPERATING ACTIVITIES
  Net Income
  Adjustments:
    + Depreciation
    + Bad Debt Expense
  Changes in:
    - Accounts Receivable
    - Prepaid Expenses
    + Accounts Payable
    + Deferred Revenue
    + Accrued Expenses
------------------------
  Net Cash from Operations

INVESTING ACTIVITIES
  - Equipment Purchases
  - Leasehold Improvements
------------------------
  Net Cash from Investing

FINANCING ACTIVITIES
  + Loan Proceeds
  - Loan Payments
  - Owner Distributions
------------------------
  Net Cash from Financing

NET CHANGE IN CASH

Beginning Cash Balance
Ending Cash Balance
```

**Cash Forecasting**:
| Source | Timing | Reliability |
|--------|--------|-------------|
| Payment Plans | Scheduled dates | High |
| Insurance Claims | 30-45 days from submission | Medium |
| Patient Balances | Variable | Low |
| Deferred Revenue | Not cash | N/A |

---

### 10.3.4 AR Aging Reports

**Purpose**: Specialized accounts receivable aging for orthodontic practices.

**Key Capabilities**:
- Standard aging buckets (Current, 30, 60, 90, 120+)
- Patient AR vs Insurance AR separation
- Payment plan AR tracking (current vs delinquent)
- AR by responsible party (patient, insurance, guarantor)
- AR by treatment status (active, completed, transferred)
- Expected collections forecast
- AR days calculation
- Aging trend analysis

**Orthodontic AR Considerations**:
| AR Type | Characteristics | Collection Approach |
|---------|-----------------|---------------------|
| Insurance | Predictable timing, high collection rate | Claim follow-up |
| Patient - Payment Plan | Monthly payments, moderate risk | Auto-pay, reminders |
| Patient - Balance Due | Variable timing, higher risk | Collection workflow |
| Transferred Cases | May have remaining AR | Special handling |

**Report Views**:
- Summary by aging bucket
- Detail by patient/guarantor
- By treatment status
- By insurance vs patient
- By provider
- By location

**User Stories**:
- As a **billing staff**, I want AR aging by category so I can prioritize collections
- As a **clinic admin**, I want to see payment plan AR separately so I can monitor compliance
- As a **billing manager**, I want AR by treatment status so I can handle completed cases

---

### 10.3.5 Write-off & Adjustment Reports

**Purpose**: Track and analyze all adjustments and write-offs.

**Key Capabilities**:
- Write-off summary by reason
- Adjustment categorization
- Adjustment trending over time
- Impact on production analysis
- Recovery of previously written-off amounts
- Approval audit trail
- Comparison to benchmarks

**Adjustment Categories**:
| Category | Description | Benchmark |
|----------|-------------|-----------|
| Insurance Write-off | Contractual adjustments | Per contract |
| Courtesy Discount | Family, staff, professional | <2% |
| Bad Debt | Uncollectible accounts | <1% |
| Small Balance | Balances below threshold | Minimal |
| Promotional | Marketing discounts | Controlled |
| Error Correction | Billing corrections | Minimal |

**User Stories**:
- As a **clinic admin**, I want write-off trending so I can identify issues
- As a **billing manager**, I want adjustment breakdown so I can control discounting
- As an **auditor**, I want approval history so I can verify controls

---

### 10.3.6 Custom Report Builder

**Purpose**: Create custom financial reports with flexible dimensions and filters.

**Key Capabilities**:
- Drag-and-drop report designer
- Filter by any dimension (date, provider, location, etc.)
- Multiple aggregation options (sum, average, count)
- Calculated fields
- Multiple output formats (PDF, Excel, CSV)
- Scheduled report delivery
- Report templates for common needs
- Report sharing and permissions

**Available Dimensions**:
- Time (day, week, month, quarter, year)
- Provider
- Location/Clinic
- Procedure type
- Patient demographics
- Insurance carrier
- Treatment type
- Account status

**Available Measures**:
- Production (gross, net)
- Collections (by source, method)
- Adjustments (by type)
- Patient counts
- Case counts
- AR balances

**User Stories**:
- As a **clinic admin**, I want to build custom reports for my specific needs
- As an **owner**, I want scheduled reports delivered weekly
- As a **manager**, I want to share report templates with my team

---

## Data Model

```prisma
model FinancialReport {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Report details
  reportType    FinancialReportType
  reportName    String
  description   String?

  // Period
  periodType    PeriodType
  periodStart   DateTime
  periodEnd     DateTime
  asOfDate      DateTime?

  // Scope
  locationId    String?  @db.ObjectId  // null for consolidated
  providerId    String?  @db.ObjectId

  // Options
  accountingBasis AccountingBasis @default(ACCRUAL)
  includeDetails  Boolean @default(false)
  compareToDate   DateTime?

  // Generated content
  reportData    Json
  documentUrl   String?

  // Status
  status        ReportStatus @default(GENERATED)
  generatedAt   DateTime @default(now())

  // Delivery
  deliveredTo   String[]
  deliveredAt   DateTime?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Audit
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([reportType])
  @@index([periodStart])
  @@index([generatedAt])
}

enum FinancialReportType {
  PROFIT_LOSS
  BALANCE_SHEET
  CASH_FLOW
  AR_AGING
  AR_DETAIL
  WRITE_OFF_SUMMARY
  ADJUSTMENT_DETAIL
  PRODUCTION_SUMMARY
  COLLECTION_SUMMARY
  CUSTOM
}

enum AccountingBasis {
  ACCRUAL
  CASH
  MODIFIED_CASH
}

enum ReportStatus {
  GENERATING
  GENERATED
  FAILED
  DELIVERED
}

model ReportTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String?  @db.ObjectId  // null for system templates

  // Template details
  name          String
  description   String?
  reportType    FinancialReportType
  isSystem      Boolean  @default(false)

  // Configuration
  configuration Json     // Report builder configuration

  // Scheduling
  isScheduled   Boolean  @default(false)
  schedule      ReportSchedule?

  // Sharing
  sharedWith    String[] @db.ObjectId  // User IDs

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Audit
  createdBy     String   @db.ObjectId

  @@index([clinicId])
  @@index([reportType])
  @@index([isActive])
}

type ReportSchedule {
  frequency     ScheduleFrequency
  dayOfWeek     Int?
  dayOfMonth    Int?
  time          String
  recipients    String[]
  format        ReportFormat
}

enum ScheduleFrequency {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
}

enum ReportFormat {
  PDF
  EXCEL
  CSV
}

model FinancialPeriod {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period definition
  periodType    PeriodType
  periodStart   DateTime
  periodEnd     DateTime
  fiscalYear    Int

  // Status
  status        PeriodStatus @default(OPEN)

  // Close process
  closeStartedAt DateTime?
  closeStartedBy String?  @db.ObjectId
  closedAt       DateTime?
  closedBy       String?  @db.ObjectId

  // Balances at close
  closingBalances Json?

  // Adjustments
  postCloseAdjustments Boolean @default(false)
  adjustmentReason String?
  reopenedAt     DateTime?
  reopenedBy     String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, periodType, periodStart])
  @@index([clinicId])
  @@index([status])
}

enum PeriodStatus {
  OPEN
  CLOSING
  CLOSED
  LOCKED
}

model CloseChecklist {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  periodId      String   @db.ObjectId

  // Checklist items
  items         CloseChecklistItem[]

  // Progress
  completedItems Int     @default(0)
  totalItems    Int

  // Status
  status        ChecklistStatus @default(IN_PROGRESS)
  completedAt   DateTime?
  completedBy   String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([periodId])
}

type CloseChecklistItem {
  itemId        String
  description   String
  category      String
  isRequired    Boolean
  status        ChecklistItemStatus
  completedAt   DateTime?
  completedBy   String?
  notes         String?
}

enum ChecklistStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  BLOCKED
}

enum ChecklistItemStatus {
  PENDING
  COMPLETED
  SKIPPED
  BLOCKED
}

model ARSnapshot {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Snapshot date
  snapshotDate  DateTime

  // Totals
  totalAR       Decimal
  patientAR     Decimal
  insuranceAR   Decimal
  paymentPlanAR Decimal

  // Aging buckets - Patient
  patientCurrent  Decimal @default(0)
  patient30       Decimal @default(0)
  patient60       Decimal @default(0)
  patient90       Decimal @default(0)
  patient120Plus  Decimal @default(0)

  // Aging buckets - Insurance
  insuranceCurrent Decimal @default(0)
  insurance30     Decimal @default(0)
  insurance60     Decimal @default(0)
  insurance90     Decimal @default(0)
  insurance120Plus Decimal @default(0)

  // Metrics
  arDays        Decimal?
  allowanceForDoubtful Decimal @default(0)
  netAR         Decimal

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, snapshotDate])
  @@index([clinicId])
  @@index([snapshotDate])
}

model WriteOffSummary {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodStart   DateTime
  periodEnd     DateTime

  // By category
  insuranceWriteOffs  Decimal @default(0)
  courtesyDiscounts   Decimal @default(0)
  badDebtWriteOffs    Decimal @default(0)
  smallBalanceWriteOffs Decimal @default(0)
  promotionalDiscounts Decimal @default(0)
  otherAdjustments    Decimal @default(0)

  // Totals
  totalWriteOffs      Decimal
  totalAdjustments    Decimal
  grossProduction     Decimal

  // Rates
  writeOffRate        Decimal
  adjustmentRate      Decimal

  // Recoveries
  badDebtRecoveries   Decimal @default(0)

  // Timestamps
  generatedAt   DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, periodStart])
  @@index([clinicId])
  @@index([periodStart])
}
```

---

## API Endpoints

### Core Reports

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/reports/profit-loss` | Generate P&L | `finance:view_reports` |
| GET | `/api/finance/reports/balance-sheet` | Generate balance sheet | `finance:view_reports` |
| GET | `/api/finance/reports/cash-flow` | Generate cash flow | `finance:view_reports` |

### AR Reports

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/reports/ar-aging` | AR aging summary | `finance:view_reports` |
| GET | `/api/finance/reports/ar-aging/detail` | AR aging detail | `finance:view_reports` |
| GET | `/api/finance/reports/ar-snapshot` | AR historical snapshot | `finance:view_reports` |

### Adjustment Reports

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/reports/write-offs` | Write-off summary | `finance:view_reports` |
| GET | `/api/finance/reports/adjustments` | Adjustment detail | `finance:view_reports` |

### Custom Reports

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/reports/custom` | List saved reports | `finance:view_reports` |
| POST | `/api/finance/reports/custom` | Create custom report | `finance:generate_reports` |
| GET | `/api/finance/reports/custom/:id` | Get report results | `finance:view_reports` |
| PUT | `/api/finance/reports/custom/:id` | Update report | `finance:generate_reports` |

### Templates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/report-templates` | List templates | `finance:view_reports` |
| POST | `/api/finance/report-templates` | Create template | `finance:generate_reports` |
| PUT | `/api/finance/report-templates/:id` | Update template | `finance:generate_reports` |
| POST | `/api/finance/report-templates/:id/run` | Run template | `finance:view_reports` |

### Period Management

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/periods` | List periods | `finance:view_reports` |
| POST | `/api/finance/periods/:id/close` | Start period close | `finance:close_period` |
| POST | `/api/finance/periods/:id/finalize` | Finalize close | `finance:close_period` |
| GET | `/api/finance/periods/:id/checklist` | Get close checklist | `finance:close_period` |
| PUT | `/api/finance/periods/:id/checklist` | Update checklist | `finance:close_period` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `ProfitLossReport` | Display P&L | `components/finance/reports/` |
| `BalanceSheetReport` | Display balance sheet | `components/finance/reports/` |
| `CashFlowReport` | Display cash flow | `components/finance/reports/` |
| `ARAgingSummary` | AR aging overview | `components/finance/reports/` |
| `ARAgingDetail` | Detailed AR listing | `components/finance/reports/` |
| `WriteOffDashboard` | Write-off analysis | `components/finance/reports/` |
| `ReportBuilder` | Custom report designer | `components/finance/reports/` |
| `ReportScheduler` | Schedule reports | `components/finance/reports/` |
| `PeriodCloseWizard` | Period close workflow | `components/finance/reports/` |
| `CloseChecklistManager` | Manage close tasks | `components/finance/reports/` |
| `ReportExporter` | Export reports | `components/finance/reports/` |

---

## Business Rules

1. **Period Lock**: Closed periods cannot be modified without reopening
2. **Checklist Completion**: All required checklist items must complete before close
3. **Report Retention**: Generated reports retained for 7 years
4. **Balance Verification**: Balance sheet must balance before close
5. **Deferred Revenue**: Must reconcile deferred revenue before year-end
6. **AR Snapshots**: Daily AR snapshots for historical trending
7. **Audit Trail**: All report generation logged with parameters
8. **Access Control**: Financial reports restricted by role

---

## Month-End Close Checklist

| # | Item | Description | Required |
|---|------|-------------|----------|
| 1 | Reconcile bank accounts | Match deposits to bank statement | Yes |
| 2 | Review AR aging | Investigate aging > 90 days | Yes |
| 3 | Post adjustments | Enter any pending adjustments | Yes |
| 4 | Review deferred revenue | Verify recognition is current | Yes |
| 5 | Reconcile payroll | Match to payroll provider | Yes |
| 6 | Review write-offs | Approve pending write-offs | Yes |
| 7 | Generate statements | Send patient statements | Yes |
| 8 | Run depreciation | Post monthly depreciation | Yes |
| 9 | Review expense accruals | Enter accrued expenses | Yes |
| 10 | Generate reports | Run standard report package | Yes |

---

## Related Documentation

- [Parent: Financial Management](../../)
- [Revenue Tracking](../revenue-tracking/)
- [Expense Management](../expense-management/)
- [Analytics Dashboard](../analytics-dashboard/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
