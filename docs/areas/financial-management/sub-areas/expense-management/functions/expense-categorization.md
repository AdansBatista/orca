# Expense Categorization

> **Sub-Area**: [Expense Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Expense Categorization manages the chart of accounts and categorizes expenses for reporting and tax purposes. This function provides a hierarchical category structure, supports AI-assisted automatic categorization, maps categories to tax classifications, and enables category-level budget management and reporting.

---

## Core Requirements

- [ ] Manage hierarchical chart of accounts for expense categories
- [ ] Implement AI-assisted automatic expense categorization from descriptions
- [ ] Generate category-level reporting with drill-down capability
- [ ] Map expense categories to tax categories for year-end filing
- [ ] Support budget allocation by category with variance tracking
- [ ] Implement approval workflows for expenses above thresholds
- [ ] Store receipt/documentation with appropriate retention

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/expense-categories` | `finance:view_expenses` | List all categories |
| GET | `/api/finance/expense-categories/:id` | `finance:view_expenses` | Get category details |
| POST | `/api/finance/expense-categories` | `finance:manage_expenses` | Create category |
| PUT | `/api/finance/expense-categories/:id` | `finance:manage_expenses` | Update category |
| DELETE | `/api/finance/expense-categories/:id` | `finance:manage_expenses` | Delete category |
| POST | `/api/finance/expenses/categorize` | `finance:manage_expenses` | Auto-categorize expense |
| GET | `/api/finance/expenses/by-category` | `finance:view_expenses` | Expenses by category report |
| GET | `/api/finance/expense-budgets` | `finance:view_expenses` | Category budgets |

---

## Data Model

```prisma
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
  taxCategory   TaxCategory?
  is1099Eligible Boolean @default(false)

  // Approval
  approvalThreshold Decimal?

  // Display
  displayOrder  Int      @default(0)
  isActive      Boolean  @default(true)
  isSystem      Boolean  @default(false)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  expenses      Expense[]
  children      ExpenseCategory[] @relation("CategoryHierarchy")
  parent        ExpenseCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@unique([clinicId, code])
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
  DEPRECIATION
  INTEREST
  TAXES
  OTHER
}

enum TaxCategory {
  WAGES
  RENT
  UTILITIES
  SUPPLIES
  PROFESSIONAL_FEES
  INSURANCE
  DEPRECIATION
  INTEREST
  TAXES_LICENSES
  REPAIRS
  TRAVEL
  MEALS
  OTHER_DEDUCTIONS
  NON_DEDUCTIBLE
}

model ExpenseBudget {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  categoryId    String   @db.ObjectId

  // Budget period
  fiscalYear    Int
  periodType    BudgetPeriodType @default(ANNUAL)

  // Amounts
  annualBudget  Decimal
  monthlyBudget Decimal?

  // Monthly allocations (if not evenly distributed)
  janBudget     Decimal?
  febBudget     Decimal?
  marBudget     Decimal?
  aprBudget     Decimal?
  mayBudget     Decimal?
  junBudget     Decimal?
  julBudget     Decimal?
  augBudget     Decimal?
  sepBudget     Decimal?
  octBudget     Decimal?
  novBudget     Decimal?
  decBudget     Decimal?

  // Tracking
  ytdActual     Decimal  @default(0)
  ytdVariance   Decimal  @default(0)

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  category      ExpenseCategory @relation(fields: [categoryId], references: [id])

  @@unique([clinicId, categoryId, fiscalYear])
  @@index([clinicId])
  @@index([fiscalYear])
}

enum BudgetPeriodType {
  ANNUAL
  QUARTERLY
  MONTHLY
}
```

---

## Business Rules

- All expenses must be categorized before period close
- System categories cannot be deleted or modified by users
- Child categories must have same expense type as parent
- Expenses above approval threshold require workflow approval
- AI categorization confidence below 80% requires manual review
- Tax categories must be mapped for all active expense categories
- Budget variances calculated monthly with alerts for significant deviations

---

## Dependencies

**Depends On:**
- AI Integration (for auto-categorization)

**Required By:**
- All expense tracking functions
- Financial Reports (P&L by category)
- Tax Preparation
- Budget Management

---

## Notes

**Standard Expense Category Hierarchy:**
```
Operating Expenses
├── Payroll & Benefits
│   ├── Staff Wages
│   ├── Provider Compensation
│   ├── Payroll Taxes
│   └── Benefits
├── Facility
│   ├── Rent/Mortgage
│   ├── Utilities
│   └── Maintenance
├── Clinical
│   ├── Supplies
│   └── Lab Fees
├── Marketing
│   ├── Digital Marketing
│   ├── Print/Local
│   └── Events
├── Technology
│   ├── Software/SaaS
│   ├── Hardware
│   └── IT Services
├── Professional Services
│   ├── Accounting
│   ├── Legal
│   └── Consulting
└── Administrative
    ├── Office Supplies
    ├── Insurance
    └── Miscellaneous
```

AI-assisted categorization learns from clinic's historical categorization patterns.

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
