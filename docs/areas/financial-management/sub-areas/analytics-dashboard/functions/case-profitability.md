# Case Profitability

> **Sub-Area**: [Analytics Dashboard](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Case Profitability analyzes profitability at the treatment case level for orthodontic practices. This function calculates case-level profit margins, analyzes profitability by treatment type and insurance plan, allocates chair time costs, tracks supply and lab expenses per case, and provides insights for treatment mix optimization.

---

## Core Requirements

- [ ] Calculate case-level profitability (revenue - costs = profit)
- [ ] Analyze profitability by treatment type (braces, aligners, etc.)
- [ ] Track profitability by insurance plan/payer
- [ ] Allocate chair time costs to individual cases
- [ ] Track supply and lab costs per case
- [ ] Perform break-even analysis for different treatment types
- [ ] Generate margin optimization recommendations

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/analytics/profitability` | `finance:view_analytics` | Profitability summary |
| GET | `/api/analytics/profitability/by-type` | `finance:view_analytics` | By treatment type |
| GET | `/api/analytics/profitability/by-insurance` | `finance:view_analytics` | By insurance plan |
| GET | `/api/analytics/profitability/by-provider` | `finance:view_analytics` | By provider |
| GET | `/api/analytics/profitability/case/:id` | `finance:view_analytics` | Individual case profitability |
| GET | `/api/analytics/profitability/break-even` | `finance:view_analytics` | Break-even analysis |
| GET | `/api/analytics/profitability/optimization` | `finance:view_analytics` | Optimization recommendations |

---

## Data Model

```prisma
model CaseProfitability {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  treatmentPlanId String @db.ObjectId

  // Treatment info
  treatmentType TreatmentType
  startDate     DateTime
  completionDate DateTime?
  status        CaseStatus

  // Revenue
  contractValue Decimal
  collectedAmount Decimal
  recognizedRevenue Decimal
  adjustments   Decimal  @default(0)
  netRevenue    Decimal

  // Direct costs
  labCosts      Decimal  @default(0)
  supplyCosts   Decimal  @default(0)
  chairTimeCost Decimal  @default(0)
  totalDirectCosts Decimal

  // Chair time detail
  plannedVisits Int
  actualVisits  Int
  totalChairMinutes Int @default(0)
  avgMinutesPerVisit Decimal?
  costPerChairMinute Decimal?

  // Margins
  contributionMargin Decimal
  contributionMarginPercent Decimal

  // Overhead allocation
  allocatedOverhead Decimal @default(0)

  // Net profit
  netProfit     Decimal
  netProfitPercent Decimal

  // Insurance context
  insuranceId   String?  @db.ObjectId
  insuranceType InsuranceType?
  insuranceContribution Decimal @default(0)
  patientContribution Decimal @default(0)

  // Provider
  primaryProviderId String @db.ObjectId

  // Timestamps
  calculatedAt  DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, treatmentPlanId])
  @@index([clinicId])
  @@index([treatmentType])
  @@index([status])
  @@index([insuranceType])
}

enum TreatmentType {
  BRACES_METAL
  BRACES_CERAMIC
  BRACES_LINGUAL
  ALIGNERS
  LIMITED_TREATMENT
  PHASE_1
  RETAINER_ONLY
  SURGICAL_ORTHO
  OTHER
}

enum CaseStatus {
  ACTIVE
  COMPLETED
  TRANSFERRED
  DISCONTINUED
}

enum InsuranceType {
  PPO
  HMO
  INDEMNITY
  DISCOUNT_PLAN
  MEDICAID
  SELF_PAY
}

model ProfitabilitySummary {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodStart   DateTime
  periodEnd     DateTime

  // Grouping (null values = all)
  treatmentType TreatmentType?
  insuranceType InsuranceType?
  providerId    String?  @db.ObjectId

  // Case counts
  totalCases    Int
  activeCases   Int
  completedCases Int

  // Revenue
  totalContractValue Decimal
  totalCollected Decimal
  totalAdjustments Decimal
  totalNetRevenue Decimal
  avgCaseValue  Decimal

  // Costs
  totalLabCosts Decimal
  totalSupplyCosts Decimal
  totalChairCosts Decimal
  totalDirectCosts Decimal
  avgDirectCostPerCase Decimal

  // Chair time
  totalChairMinutes Int
  avgChairMinutesPerCase Decimal
  avgVisitsPerCase Decimal

  // Margins
  avgContributionMargin Decimal
  avgContributionMarginPercent Decimal
  avgNetProfit  Decimal
  avgNetProfitPercent Decimal

  // Timestamps
  generatedAt   DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([periodStart])
  @@index([treatmentType])
}
```

---

## Business Rules

- Chair time cost = Chair minutes × Cost per chair minute
- Cost per chair minute includes staff, facility, overhead allocation
- Lab costs linked to treatment plan from Lab Work Management
- Supply costs estimated or tracked per case from Inventory
- Contribution margin = Net Revenue - Direct Costs
- Net profit includes allocated overhead
- Insurance profitability considers fee schedule negotiation impact
- Completed cases provide most accurate profitability; active cases estimated

---

## Dependencies

**Depends On:**
- Treatment Management (treatment plans, visits)
- Lab Work Management (lab costs)
- Supply & Inventory Costs (supply costs)
- Revenue Tracking (collections)
- Expense Management (overhead allocation)

**Required By:**
- Pricing Strategy
- Insurance Contract Negotiations
- Practice Planning

---

## Notes

**Case Profitability Model:**
```
Case Revenue: $5,500

Direct Costs:
  - Lab Fees: $800 (aligners)
  - Supplies: $150
  - Chair Time Cost: $600 (12 visits × $50/visit)
  ────────────────────
  Total Direct: $1,550

Contribution Margin: $3,950 (72%)

Allocated Overhead:
  - Based on chair time share of total
  Total Overhead: $1,200
  ────────────────────
Net Profit: $2,750 (50% margin)
```

**Profitability by Treatment Type (Typical):**
| Treatment | Avg Revenue | Avg Cost | Margin | Visits |
|-----------|-------------|----------|--------|--------|
| Metal Braces | $5,200 | $1,800 | 65% | 24 |
| Ceramic Braces | $5,800 | $2,100 | 64% | 24 |
| Clear Aligners | $5,500 | $2,400 | 56% | 18 |
| Limited Treatment | $2,500 | $800 | 68% | 8 |
| Retainer Only | $500 | $150 | 70% | 2 |

**Key Insight:** Clear aligners have higher lab costs but fewer visits, resulting in different margin profile than braces.

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
