# Expense Management

> **Area**: [Financial Management](../../)
>
> **Sub-Area**: 10.2 Expense Management
>
> **Purpose**: Comprehensive expense tracking including vendor payments, overhead costs, payroll integration, and expense analysis

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Medium |
| **Parent Area** | [Financial Management](../../) |
| **Dependencies** | Vendors Management, Staff Management |
| **Last Updated** | 2024-11-26 |

---

## Overview

Expense Management provides comprehensive tracking and analysis of all practice expenses. This sub-area helps orthodontic practices understand their cost structure, manage overhead, and make informed financial decisions.

### Key Goals

- **Complete visibility**: Track all expense categories
- **Overhead management**: Monitor and benchmark overhead ratios
- **Cost analysis**: Understand cost drivers and trends
- **Budget control**: Compare actual spending to budget
- **Tax preparation**: Proper categorization for tax purposes

### Orthodontic-Specific Considerations

| Expense Category | Typical % of Revenue | Considerations |
|------------------|---------------------|----------------|
| Staff/Payroll | 20-30% | Provider compensation models vary |
| Lab Fees | 5-8% | Varies by treatment type (aligners vs braces) |
| Supplies | 3-5% | Orthodontic-specific materials |
| Facility | 8-12% | Chair/operatory equipment |
| Marketing | 3-5% | New patient acquisition |
| Other | 5-10% | Technology, insurance, admin |

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 10.2.1 | [Vendor Payment Tracking](./functions/vendor-payment-tracking.md) | Track and manage vendor payments | 📋 Planned | High |
| 10.2.2 | [Overhead Cost Management](./functions/overhead-cost-management.md) | Calculate and benchmark overhead | 📋 Planned | High |
| 10.2.3 | [Payroll Integration](./functions/payroll-integration.md) | Import and track payroll expenses | 📋 Planned | High |
| 10.2.4 | [Supply & Inventory Costs](./functions/supply-inventory-costs.md) | Track supply expenses | 📋 Planned | Medium |
| 10.2.5 | [Lab Fee Tracking](./functions/lab-fee-tracking.md) | Track lab costs by case type | 📋 Planned | Medium |
| 10.2.6 | [Expense Categorization](./functions/expense-categorization.md) | Chart of accounts and categorization | 📋 Planned | Medium |

---

## Function Details

### 10.2.1 Vendor Payment Tracking

**Purpose**: Track and manage all payments to vendors and suppliers.

**Key Capabilities**:
- Vendor invoice entry and tracking
- Payment scheduling and due date reminders
- Check/ACH payment recording
- Recurring expense management
- Vendor payment history
- 1099 tracking for year-end
- Accounts payable aging

**User Stories**:
- As an **office manager**, I want to track pending vendor invoices so I can manage cash flow
- As a **clinic admin**, I want to see vendor payment history so I can negotiate terms
- As a **bookkeeper**, I want 1099 information tracked so year-end filing is easy

---

### 10.2.2 Overhead Cost Management

**Purpose**: Calculate, track, and benchmark overhead costs.

**Key Capabilities**:
- Overhead ratio calculation
- Fixed vs variable cost categorization
- Overhead trending and analysis
- Cost per patient/visit calculation
- Industry benchmarking
- Overhead allocation to locations
- Efficiency recommendations

**User Stories**:
- As a **clinic owner**, I want to see my overhead ratio so I can benchmark against industry
- As a **clinic admin**, I want to identify fixed vs variable costs so I can manage during slow periods
- As an **owner**, I want location-specific overhead so I can compare efficiency

**Overhead Calculation**:
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

Provider compensation typically excluded from overhead
```

**Industry Benchmarks**:
| Metric | Target | Warning |
|--------|--------|---------|
| Total Overhead | 55-65% | >70% |
| Staff Cost | 20-28% | >32% |
| Lab Cost | 5-8% | >10% |
| Facility Cost | 8-12% | >15% |
| Marketing | 3-5% | >7% |

---

### 10.2.3 Payroll Integration

**Purpose**: Import and track payroll expenses from external payroll systems.

**Key Capabilities**:
- ADP/Gusto API integration
- Payroll data import
- Expense categorization (wages, taxes, benefits)
- Staff cost as percentage of collections
- Provider compensation tracking
- Benefits cost tracking
- Payroll tax accrual

**User Stories**:
- As a **bookkeeper**, I want payroll automatically imported so I don't duplicate entry
- As a **clinic admin**, I want to see staff cost percentage so I can manage labor costs
- As an **owner**, I want provider compensation reports so I can analyze productivity

**Payroll Categories**:
- Staff wages (clinical)
- Staff wages (administrative)
- Provider compensation
- Payroll taxes (employer portion)
- Health benefits
- Retirement contributions
- Other benefits

---

### 10.2.4 Supply & Inventory Costs

**Purpose**: Track supply expenses and analyze cost per patient.

**Key Capabilities**:
- Supply cost tracking by category
- Cost per patient calculation
- Integration with inventory management
- Waste tracking
- Vendor price comparison
- Purchase order cost tracking
- Supply budget management

**User Stories**:
- As an **office manager**, I want to see supply costs by category so I can identify savings
- As a **clinic admin**, I want supply cost per patient so I can compare to benchmarks
- As a **purchaser**, I want vendor price comparison so I can negotiate better rates

**Supply Categories**:
- Orthodontic brackets and wires
- Elastics and ligatures
- Aligners and retainers (if in-house)
- Impression materials
- Sterilization supplies
- Office supplies
- Patient comfort items

---

### 10.2.5 Lab Fee Tracking

**Purpose**: Track lab costs and analyze impact on case profitability.

**Key Capabilities**:
- Lab cost by case type (braces, aligners, retainers)
- Lab cost as percentage of production
- Lab vendor comparison
- Rush fee tracking
- Case profitability impact
- Lab turnaround cost analysis

**User Stories**:
- As a **clinic admin**, I want lab costs by case type so I can understand profitability
- As an **owner**, I want to compare lab vendor pricing so I can optimize costs
- As a **billing staff**, I want rush fees tracked so they're included in case cost

**Lab Fee Analysis**:
| Treatment Type | Typical Lab Cost | % of Case Value |
|----------------|------------------|-----------------|
| Metal Braces | $50-100 | 1-2% |
| Ceramic Braces | $100-150 | 2-3% |
| Clear Aligners | $800-1500 | 15-25% |
| Retainers | $50-150 | N/A |

---

### 10.2.6 Expense Categorization

**Purpose**: Manage chart of accounts and categorize expenses for reporting and tax.

**Key Capabilities**:
- Chart of accounts management
- Automatic expense categorization (AI-assisted)
- Category-level reporting
- Tax category mapping
- Budget by category
- Approval workflows
- Receipt/documentation storage

**User Stories**:
- As a **bookkeeper**, I want expenses auto-categorized so I save time on data entry
- As a **clinic admin**, I want to see spending by category so I can manage budget
- As an **accountant**, I want proper tax categorization so year-end is smooth

---

## Data Model

```prisma
model Expense {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Vendor/Payee
  vendorId      String?  @db.ObjectId
  payeeName     String

  // Expense details
  expenseDate   DateTime
  dueDate       DateTime?
  description   String
  referenceNumber String?

  // Categorization
  categoryId    String   @db.ObjectId
  subcategoryId String?  @db.ObjectId
  taxCategoryId String?  @db.ObjectId

  // Amounts
  amount        Decimal
  taxAmount     Decimal  @default(0)
  totalAmount   Decimal

  // Allocation
  isRecurring   Boolean  @default(false)
  recurrenceId  String?  @db.ObjectId
  locationId    String?  @db.ObjectId

  // Payment
  paymentStatus ExpensePaymentStatus @default(PENDING)
  paidDate      DateTime?
  paymentMethod PaymentMethod?
  paymentReference String?

  // Documentation
  documentUrls  String[]
  notes         String?

  // Approval
  approvalStatus ApprovalStatus @default(NOT_REQUIRED)
  approvedBy    String?  @db.ObjectId
  approvedAt    DateTime?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Audit
  createdBy     String   @db.ObjectId
  updatedBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic          @relation(fields: [clinicId], references: [id])
  category      ExpenseCategory @relation(fields: [categoryId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([categoryId])
  @@index([expenseDate])
  @@index([paymentStatus])
}

enum ExpensePaymentStatus {
  PENDING
  SCHEDULED
  PAID
  CANCELLED
  VOID
}

enum ApprovalStatus {
  NOT_REQUIRED
  PENDING
  APPROVED
  REJECTED
}

model ExpenseCategory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String?  @db.ObjectId  // null for system categories

  // Category details
  code          String
  name          String
  description   String?
  parentId      String?  @db.ObjectId
  level         Int      @default(1)

  // Classification
  expenseType   ExpenseType
  isOverhead    Boolean  @default(true)
  isFixed       Boolean  @default(false)

  // Tax mapping
  taxCategory   String?
  is1099Eligible Boolean @default(false)

  // Display
  displayOrder  Int      @default(0)
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  expenses      Expense[]
  children      ExpenseCategory[] @relation("CategoryHierarchy")
  parent        ExpenseCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@index([clinicId])
  @@index([parentId])
  @@index([expenseType])
}

enum ExpenseType {
  PAYROLL
  FACILITY
  SUPPLIES
  LAB_FEES
  MARKETING
  TECHNOLOGY
  INSURANCE
  PROFESSIONAL_SERVICES
  ADMINISTRATIVE
  OTHER
}

model PayrollImport {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Import details
  source        PayrollSource
  payPeriodStart DateTime
  payPeriodEnd   DateTime
  payDate       DateTime

  // Totals
  grossPayroll     Decimal
  employerTaxes    Decimal
  benefits         Decimal
  netPayroll       Decimal

  // Status
  status        ImportStatus @default(PENDING)
  importedAt    DateTime?
  errorMessage  String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  items         PayrollItem[]

  @@index([clinicId])
  @@index([payDate])
}

enum PayrollSource {
  ADP
  GUSTO
  PAYCHEX
  MANUAL
}

enum ImportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model PayrollItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  payrollImportId String @db.ObjectId

  // Employee
  employeeId    String?  @db.ObjectId
  employeeName  String
  employeeType  EmployeeType

  // Amounts
  grossPay      Decimal
  regularPay    Decimal
  overtimePay   Decimal  @default(0)
  bonus         Decimal  @default(0)

  // Deductions
  federalTax    Decimal  @default(0)
  stateTax      Decimal  @default(0)
  socialSecurity Decimal @default(0)
  medicare      Decimal  @default(0)
  otherDeductions Decimal @default(0)

  // Employer costs
  employerSS    Decimal  @default(0)
  employerMedicare Decimal @default(0)
  employerFUTA  Decimal  @default(0)
  employerSUTA  Decimal  @default(0)

  // Benefits
  healthBenefit Decimal  @default(0)
  retirementBenefit Decimal @default(0)
  otherBenefits Decimal  @default(0)

  // Net
  netPay        Decimal

  // Relations
  payrollImport PayrollImport @relation(fields: [payrollImportId], references: [id])

  @@index([payrollImportId])
  @@index([employeeId])
}

enum EmployeeType {
  PROVIDER
  CLINICAL_STAFF
  ADMINISTRATIVE
  MANAGEMENT
}

model LabFee {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Case reference
  patientId     String   @db.ObjectId
  treatmentPlanId String @db.ObjectId
  caseType      LabCaseType

  // Vendor
  vendorId      String   @db.ObjectId
  vendorName    String

  // Order details
  orderDate     DateTime
  receiveDate   DateTime?
  invoiceNumber String?

  // Costs
  baseCost      Decimal
  rushFee       Decimal  @default(0)
  shippingCost  Decimal  @default(0)
  totalCost     Decimal

  // Status
  status        LabFeeStatus @default(PENDING)
  paidDate      DateTime?

  // Notes
  notes         String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([treatmentPlanId])
  @@index([vendorId])
  @@index([orderDate])
}

enum LabCaseType {
  BRACES_METAL
  BRACES_CERAMIC
  ALIGNERS
  RETAINER_HAWLEY
  RETAINER_ESSIX
  RETAINER_FIXED
  APPLIANCE
  STUDY_MODEL
  OTHER
}

enum LabFeeStatus {
  PENDING
  INVOICED
  PAID
  DISPUTED
}

model OverheadSummary {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodType    PeriodType
  periodStart   DateTime
  periodEnd     DateTime

  // Revenue
  collections   Decimal

  // Expenses by type
  payrollExpense    Decimal @default(0)
  facilityExpense   Decimal @default(0)
  supplyExpense     Decimal @default(0)
  labExpense        Decimal @default(0)
  marketingExpense  Decimal @default(0)
  technologyExpense Decimal @default(0)
  insuranceExpense  Decimal @default(0)
  otherExpense      Decimal @default(0)

  // Totals
  totalOverhead     Decimal
  fixedCosts        Decimal
  variableCosts     Decimal

  // Ratios
  overheadRatio     Decimal
  staffCostRatio    Decimal
  labCostRatio      Decimal

  // Per patient metrics
  expensePerPatient Decimal?
  expensePerVisit   Decimal?

  // Timestamps
  generatedAt   DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, periodType, periodStart])
  @@index([clinicId])
  @@index([periodStart])
}

model RecurringExpense {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Expense template
  vendorId      String?  @db.ObjectId
  payeeName     String
  description   String
  categoryId    String   @db.ObjectId

  // Amount
  amount        Decimal
  isVariable    Boolean  @default(false)

  // Schedule
  frequency     RecurrenceFrequency
  dayOfMonth    Int?
  dayOfWeek     Int?
  startDate     DateTime
  endDate       DateTime?

  // Status
  isActive      Boolean  @default(true)
  nextDueDate   DateTime

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  generatedExpenses Expense[]

  @@index([clinicId])
  @@index([isActive])
  @@index([nextDueDate])
}

enum RecurrenceFrequency {
  WEEKLY
  BIWEEKLY
  MONTHLY
  QUARTERLY
  ANNUAL
}
```

---

## API Endpoints

### Expenses

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/expenses` | List expenses | `finance:view_expenses` |
| GET | `/api/finance/expenses/:id` | Get expense details | `finance:view_expenses` |
| POST | `/api/finance/expenses` | Create expense | `finance:manage_expenses` |
| PUT | `/api/finance/expenses/:id` | Update expense | `finance:manage_expenses` |
| DELETE | `/api/finance/expenses/:id` | Delete expense | `finance:manage_expenses` |
| POST | `/api/finance/expenses/:id/pay` | Mark as paid | `finance:manage_expenses` |

### Categories

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/expense-categories` | List categories | `finance:view_expenses` |
| POST | `/api/finance/expense-categories` | Create category | `finance:manage_expenses` |
| PUT | `/api/finance/expense-categories/:id` | Update category | `finance:manage_expenses` |

### Payroll

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/payroll` | List payroll imports | `finance:view_expenses` |
| POST | `/api/finance/payroll/import` | Import from provider | `finance:manage_expenses` |
| GET | `/api/finance/payroll/summary` | Payroll summary | `finance:view_expenses` |

### Lab Fees

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/lab-fees` | List lab fees | `finance:view_expenses` |
| GET | `/api/finance/lab-fees/by-case-type` | Lab fees by case type | `finance:view_expenses` |
| GET | `/api/finance/lab-fees/by-vendor` | Lab fees by vendor | `finance:view_expenses` |

### Overhead

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/finance/overhead` | Get overhead summary | `finance:view_expenses` |
| GET | `/api/finance/overhead/trend` | Overhead trend | `finance:view_expenses` |
| GET | `/api/finance/overhead/benchmark` | Benchmark comparison | `finance:view_expenses` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `ExpenseList` | List and filter expenses | `components/finance/` |
| `ExpenseForm` | Create/edit expense | `components/finance/` |
| `ExpenseCategoryTree` | Category hierarchy | `components/finance/` |
| `VendorPaymentList` | Vendor AP list | `components/finance/` |
| `PayrollSummary` | Payroll overview | `components/finance/` |
| `PayrollImportWizard` | Import payroll | `components/finance/` |
| `LabFeeAnalysis` | Lab fee breakdown | `components/finance/` |
| `OverheadDashboard` | Overhead metrics | `components/finance/` |
| `OverheadChart` | Overhead breakdown | `components/finance/` |
| `RecurringExpenseManager` | Manage recurring | `components/finance/` |
| `BudgetVsActual` | Budget comparison | `components/finance/` |

---

## Business Rules

1. **Categorization Required**: All expenses must have a category before closing period
2. **Approval Thresholds**: Expenses over threshold require approval
3. **Recurring Generation**: Recurring expenses generated 7 days before due
4. **Payroll Import**: Payroll imports locked after period close
5. **Vendor 1099**: Track payments to 1099-eligible vendors automatically
6. **Overhead Calculation**: Run monthly after all expenses entered
7. **Lab Fee Matching**: Lab fees linked to treatment plans when possible
8. **Document Retention**: Expense documents retained per policy

---

## Related Documentation

- [Parent: Financial Management](../../)
- [Revenue Tracking](../revenue-tracking/)
- [Financial Reports](../financial-reports/)
- [Vendors Management](../../../vendors-management/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
