# Production vs Collection Analysis

> **Sub-Area**: [Revenue Tracking](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Production vs Collection Analysis provides comprehensive gap analysis between services rendered (production) and payments received (collections). This function helps identify collection effectiveness, track adjustment patterns, analyze lag times, and benchmark performance against industry standards to optimize revenue cycle management.

---

## Core Requirements

- [ ] Display production to collection ratio dashboard with drill-down capability
- [ ] Analyze lag time between production date and collection date
- [ ] Compare gaps by payer type (insurance, patient, guarantor)
- [ ] Track and categorize adjustments by type (discounts, write-offs, insurance)
- [ ] Generate write-off analysis reports with trending
- [ ] Calculate collection effectiveness metrics (collection rate, AR days)
- [ ] Provide historical trend analysis with period comparisons

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/analysis/production-vs-collection` | `finance:view_revenue` | Gap analysis summary |
| GET | `/api/finance/analysis/collection-rate` | `finance:view_revenue` | Collection rate trend |
| GET | `/api/finance/analysis/adjustment-rate` | `finance:view_revenue` | Adjustment rate analysis |
| GET | `/api/finance/analysis/lag-time` | `finance:view_revenue` | Days to collect analysis |
| GET | `/api/finance/analysis/by-payer` | `finance:view_revenue` | Analysis by payer type |
| GET | `/api/finance/analysis/by-provider` | `finance:view_revenue` | Analysis by provider |
| GET | `/api/finance/analysis/write-offs` | `finance:view_revenue` | Write-off breakdown |

---

## Data Model

```prisma
model ProductionCollectionAnalysis {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodType    PeriodType
  periodStart   DateTime
  periodEnd     DateTime

  // Segmentation
  providerId    String?  @db.ObjectId
  locationId    String?  @db.ObjectId
  payerType     PayerType?

  // Production
  grossProduction       Decimal
  adjustments           Decimal @default(0)
  netProduction         Decimal

  // Adjustments breakdown
  insuranceWriteOffs    Decimal @default(0)
  courtesyDiscounts     Decimal @default(0)
  badDebtWriteOffs      Decimal @default(0)
  otherAdjustments      Decimal @default(0)

  // Collections
  totalCollections      Decimal

  // Gap analysis
  productionCollectionGap Decimal

  // Rates
  collectionRate        Decimal
  adjustmentRate        Decimal
  writeOffRate          Decimal

  // Timing
  avgDaysToCollect      Decimal?
  insuranceAvgDays      Decimal?
  patientAvgDays        Decimal?

  // Timestamps
  generatedAt   DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, periodType, periodStart, providerId, locationId, payerType])
  @@index([clinicId])
  @@index([periodStart])
}

enum PayerType {
  INSURANCE
  PATIENT
  GUARANTOR
  PAYMENT_PLAN
  OTHER
}
```

---

## Business Rules

- Collection Rate benchmark: 98%+ of net production
- Adjustment Rate benchmark: <5% of gross production
- Average days to collect benchmark: <45 days overall
- Insurance lag benchmark: <30 days from submission
- Write-offs require approval and categorization
- Analysis excludes production still within normal collection window
- Trending analysis requires minimum 3 months of data

---

## Dependencies

**Depends On:**
- Production Tracking (production data)
- Collections Tracking (collection data)
- Billing & Insurance (adjustment transactions)

**Required By:**
- Financial Reports (management reports)
- Analytics Dashboard (KPIs)
- Collections Management (prioritization)

---

## Notes

**Key Metrics Explained:**
| Metric | Calculation | Benchmark |
|--------|-------------|-----------|
| Collection Rate | Collections ÷ Net Production | 98%+ |
| Adjustment Rate | Adjustments ÷ Gross Production | <5% |
| Days to Collect | Avg days from service to payment | <45 |
| Insurance Lag | Avg days for insurance payment | <30 |

- Orthodontic practices typically have better collection rates due to structured payment plans
- Insurance write-offs are contractual and expected; track separately from bad debt
- Monitor courtesy discounts to prevent excessive discounting

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
