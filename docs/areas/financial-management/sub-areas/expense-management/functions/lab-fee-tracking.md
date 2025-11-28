# Lab Fee Tracking

> **Sub-Area**: [Expense Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Lab Fee Tracking monitors laboratory costs and analyzes their impact on case profitability for orthodontic practices. This function tracks lab costs by case type, compares vendor pricing, monitors rush fees, and provides insights into lab expense patterns critical for treatment profitability analysis.

---

## Core Requirements

- [ ] Track lab costs by case type (braces, aligners, retainers, appliances)
- [ ] Calculate lab cost as percentage of production
- [ ] Compare pricing across lab vendors
- [ ] Monitor rush fee usage and costs
- [ ] Link lab fees to treatment plans for case profitability
- [ ] Analyze lab turnaround time vs cost trade-offs
- [ ] Track remake and warranty costs separately

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/lab-fees` | `finance:view_expenses` | Lab fee summary |
| GET | `/api/finance/lab-fees/by-case-type` | `finance:view_expenses` | Fees by treatment type |
| GET | `/api/finance/lab-fees/by-vendor` | `finance:view_expenses` | Vendor comparison |
| GET | `/api/finance/lab-fees/:patientId` | `finance:view_expenses` | Patient lab costs |
| GET | `/api/finance/lab-fees/rush-analysis` | `finance:view_expenses` | Rush fee analysis |
| GET | `/api/finance/lab-fees/remake-costs` | `finance:view_expenses` | Remake cost tracking |
| GET | `/api/finance/lab-fees/trend` | `finance:view_expenses` | Lab cost trends |

---

## Data Model

```prisma
model LabFee {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Case reference
  patientId     String   @db.ObjectId
  treatmentPlanId String @db.ObjectId
  labOrderId    String?  @db.ObjectId
  caseType      LabCaseType

  // Vendor
  vendorId      String   @db.ObjectId
  vendorName    String

  // Order details
  orderDate     DateTime
  receiveDate   DateTime?
  invoiceNumber String?
  description   String?

  // Costs
  baseCost      Decimal
  rushFee       Decimal  @default(0)
  shippingCost  Decimal  @default(0)
  totalCost     Decimal

  // Type flags
  isRush        Boolean  @default(false)
  isRemake      Boolean  @default(false)
  remakeReason  String?

  // Status
  status        LabFeeStatus @default(PENDING)
  paidDate      DateTime?
  invoiceId     String?  @db.ObjectId

  // Notes
  notes         String?

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([treatmentPlanId])
  @@index([vendorId])
  @@index([caseType])
  @@index([orderDate])
}

enum LabCaseType {
  BRACES_METAL
  BRACES_CERAMIC
  ALIGNERS
  RETAINER_HAWLEY
  RETAINER_ESSIX
  RETAINER_FIXED
  APPLIANCE_EXPANDER
  APPLIANCE_HERBST
  APPLIANCE_OTHER
  STUDY_MODEL
  DIGITAL_SETUP
  OTHER
}

enum LabFeeStatus {
  PENDING
  INVOICED
  PAID
  DISPUTED
  WARRANTY
}

model LabFeeSummary {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodType    PeriodType
  periodStart   DateTime
  periodEnd     DateTime

  // Vendor (null for all)
  vendorId      String?  @db.ObjectId

  // Costs by case type
  metalBracesCost   Decimal @default(0)
  ceramicBracesCost Decimal @default(0)
  alignerCost       Decimal @default(0)
  retainerCost      Decimal @default(0)
  applianceCost     Decimal @default(0)
  otherCost         Decimal @default(0)

  // Totals
  totalLabCost      Decimal
  rushFeesTotal     Decimal @default(0)
  remakeCostTotal   Decimal @default(0)
  shippingTotal     Decimal @default(0)

  // Case counts
  totalCases        Int
  rushCases         Int     @default(0)
  remakeCases       Int     @default(0)

  // Percentages
  productionAmount  Decimal?
  labCostPercentage Decimal?

  // Timestamps
  generatedAt   DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, periodType, periodStart, vendorId])
  @@index([clinicId])
  @@index([periodStart])
}
```

---

## Business Rules

- Lab cost benchmark: 5-8% of production (varies by aligner vs braces mix)
- Clear aligners have significantly higher lab costs (15-25% of case value)
- Rush fees tracked separately for operational improvement analysis
- Remakes covered by warranty don't count as new lab costs
- Lab fees linked to treatment plans for accurate case profitability
- Vendor comparison based on same case types for fair analysis
- Monthly lab cost summary generated after all invoices received

---

## Dependencies

**Depends On:**
- Lab Work Management (lab orders)
- Treatment Management (treatment plans)
- Vendor Payment Tracking (invoices)

**Required By:**
- Overhead Cost Management
- Case Profitability Analysis
- Financial Reports

---

## Notes

**Lab Fee Benchmarks by Treatment Type:**
| Treatment Type | Typical Lab Cost | % of Case Value |
|----------------|------------------|-----------------|
| Metal Braces | $50-100 | 1-2% |
| Ceramic Braces | $100-150 | 2-3% |
| Clear Aligners | $800-1500 | 15-25% |
| Retainers (Hawley) | $75-150 | N/A |
| Retainers (Essix) | $50-100 | N/A |
| Appliances | $200-500 | Varies |

Practices with high aligner percentage will have higher overall lab costs as percentage of production.

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
