# Payroll Integration

> **Sub-Area**: [Expense Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Payroll Integration imports and tracks payroll expenses from external payroll systems (ADP, Gusto, Paychex). This function automates payroll data import, categorizes wages by employee type, tracks employer costs (taxes, benefits), and provides staff cost analysis as a percentage of collections for effective labor cost management.

---

## Core Requirements

- [ ] Integrate with ADP, Gusto, and Paychex via API
- [ ] Import payroll data automatically after each pay period
- [ ] Categorize expenses by type (wages, taxes, benefits)
- [ ] Track staff cost as percentage of collections
- [ ] Separate provider compensation from staff wages
- [ ] Track employer portion of taxes and benefits
- [ ] Support manual payroll entry for practices without integrated systems

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/payroll` | `finance:view_expenses` | List payroll imports |
| GET | `/api/finance/payroll/:id` | `finance:view_expenses` | Get payroll details |
| POST | `/api/finance/payroll/import` | `finance:manage_expenses` | Import from provider |
| POST | `/api/finance/payroll/manual` | `finance:manage_expenses` | Manual payroll entry |
| GET | `/api/finance/payroll/summary` | `finance:view_expenses` | Payroll summary by period |
| GET | `/api/finance/payroll/by-employee-type` | `finance:view_expenses` | Breakdown by employee type |
| GET | `/api/finance/payroll/trend` | `finance:view_expenses` | Payroll trend analysis |

---

## Data Model

```prisma
model PayrollImport {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Import details
  source        PayrollSource
  externalId    String?
  payPeriodStart DateTime
  payPeriodEnd   DateTime
  payDate       DateTime

  // Totals
  grossPayroll     Decimal
  employerTaxes    Decimal
  employerBenefits Decimal
  totalPayrollCost Decimal

  // Status
  status        ImportStatus @default(PENDING)
  importedAt    DateTime?
  errorMessage  String?

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  items         PayrollItem[]

  @@index([clinicId])
  @@index([payDate])
  @@index([status])
}

enum PayrollSource {
  ADP
  GUSTO
  PAYCHEX
  QUICKBOOKS
  MANUAL
}

model PayrollItem {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  payrollImportId String   @db.ObjectId

  // Employee
  employeeId      String?  @db.ObjectId
  externalEmployeeId String?
  employeeName    String
  employeeType    EmployeeType

  // Gross pay components
  grossPay        Decimal
  regularPay      Decimal
  overtimePay     Decimal  @default(0)
  bonus           Decimal  @default(0)
  commission      Decimal  @default(0)

  // Employee deductions
  federalTax      Decimal  @default(0)
  stateTax        Decimal  @default(0)
  localTax        Decimal  @default(0)
  socialSecurity  Decimal  @default(0)
  medicare        Decimal  @default(0)
  healthDeduction Decimal  @default(0)
  retirementDeduction Decimal @default(0)
  otherDeductions Decimal  @default(0)

  // Employer costs
  employerSS      Decimal  @default(0)
  employerMedicare Decimal @default(0)
  employerFUTA    Decimal  @default(0)
  employerSUTA    Decimal  @default(0)
  employerHealth  Decimal  @default(0)
  employerRetirement Decimal @default(0)
  otherEmployerCosts Decimal @default(0)

  // Net pay
  netPay          Decimal
  totalEmployerCost Decimal

  // Relations
  payrollImport   PayrollImport @relation(fields: [payrollImportId], references: [id])

  @@index([payrollImportId])
  @@index([employeeId])
  @@index([employeeType])
}

enum EmployeeType {
  PROVIDER          // Doctors/Orthodontists
  CLINICAL_STAFF    // Assistants, hygienists
  ADMINISTRATIVE    // Front desk, billing
  MANAGEMENT        // Office managers
  PART_TIME         // Part-time any role
}
```

---

## Business Rules

- Payroll imports locked after period close
- Provider compensation tracked separately for profitability analysis
- Staff cost ratio calculated against collections (cash basis)
- Employer portion of taxes and benefits included in total labor cost
- Manual entries require all tax calculations to be provided
- Duplicate imports prevented by external ID matching
- Payroll data reconciled monthly with GL entries

---

## Dependencies

**Depends On:**
- Staff Management (employee records)
- External payroll systems (ADP, Gusto, Paychex APIs)

**Required By:**
- Overhead Cost Management
- Financial Reports (P&L)
- Provider compensation reports

---

## Notes

**Payroll Cost Categories:**
- **Staff wages (clinical)**: Assistants, hygienists
- **Staff wages (administrative)**: Front desk, billing, management
- **Provider compensation**: Doctors (often separate from overhead)
- **Payroll taxes (employer)**: SS, Medicare, FUTA, SUTA
- **Health benefits**: Employer portion of premiums
- **Retirement contributions**: 401k match, pension contributions
- **Other benefits**: PTO accrual, workers comp, etc.

Staff cost as percentage of collections typically ranges 20-28% for healthy practices.

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
