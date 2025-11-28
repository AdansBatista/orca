# Collections Tracking

> **Sub-Area**: [Revenue Tracking](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Collections Tracking monitors all payments received with detailed breakdowns by source, method, and timing. This function provides comprehensive visibility into cash flow, tracks collection rates against production, and forecasts expected collections from outstanding balances, payment plans, and pending insurance claims.

---

## Core Requirements

- [ ] Generate daily, weekly, and monthly collection reports with period comparisons
- [ ] Track insurance vs patient collection split with trend analysis
- [ ] Monitor payment plan collections including compliance and delinquency rates
- [ ] Categorize collections by payment method (card, cash, check, ACH)
- [ ] Calculate collection rate (Collections ÷ Net Production) with trending
- [ ] Forecast outstanding collections based on AR aging and payment patterns
- [ ] Analyze same-day vs delayed payment patterns for cash flow planning

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/collections` | `finance:view_revenue` | Get collections summary for period |
| GET | `/api/finance/collections/by-source` | `finance:view_revenue` | Collections by source (insurance/patient) |
| GET | `/api/finance/collections/by-method` | `finance:view_revenue` | Collections by payment method |
| GET | `/api/finance/collections/by-payer` | `finance:view_revenue` | Collections by payer type |
| GET | `/api/finance/collections/payment-plans` | `finance:view_revenue` | Payment plan collection tracking |
| GET | `/api/finance/collections/forecast` | `finance:view_revenue` | Collections forecast |
| GET | `/api/finance/collections/rate` | `finance:view_revenue` | Collection rate analysis |

---

## Data Model

```prisma
model CollectionSummary {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodType    PeriodType
  periodStart   DateTime
  periodEnd     DateTime

  // Location (null for clinic-wide)
  locationId    String?  @db.ObjectId

  // Collections by source
  totalCollections      Decimal
  insuranceCollections  Decimal @default(0)
  patientCollections    Decimal @default(0)
  paymentPlanCollections Decimal @default(0)
  otherCollections      Decimal @default(0)

  // Collections by method
  cashCollections       Decimal @default(0)
  cardCollections       Decimal @default(0)
  checkCollections      Decimal @default(0)
  achCollections        Decimal @default(0)
  wireCollections       Decimal @default(0)

  // Production comparison
  netProduction         Decimal
  collectionRate        Decimal

  // Timing analysis
  sameDayCollections    Decimal @default(0)
  delayedCollections    Decimal @default(0)
  avgDaysToCollect      Decimal?

  // Timestamps
  generatedAt   DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, periodType, periodStart, locationId])
  @@index([clinicId])
  @@index([periodStart])
}

model CollectionForecast {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Forecast period
  forecastDate  DateTime
  periodStart   DateTime
  periodEnd     DateTime

  // Expected collections
  expectedInsurance     Decimal @default(0)
  expectedPatient       Decimal @default(0)
  expectedPaymentPlans  Decimal @default(0)
  totalExpected         Decimal

  // Confidence
  confidenceLevel       Decimal?

  // Actual (filled in when known)
  actualCollections     Decimal?
  variance              Decimal?

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

- Collection rate benchmark is 98%+ of net production
- Payment plan payments dominate orthodontic collections (recurring monthly)
- Insurance payments arrive in bulk with 30-90 day delays
- Patient responsibility is typically higher in orthodontics than general dental
- Courtesy discounts and adjustments impact collection rate calculations
- Same-day collections primarily from patient copays and down payments
- Forecast accuracy reviewed monthly for continuous improvement

---

## Dependencies

**Depends On:**
- Billing & Insurance (payment transactions)
- Payment Processing (payment gateway data)
- Treatment Management (treatment contract values)

**Required By:**
- Day Sheet & Reconciliation
- Production vs Collection Analysis
- Financial Reports (cash flow, collections reports)
- Analytics Dashboard (collection rate KPIs)

---

## Notes

- Orthodontic practices typically have higher collection rates than general practices due to structured payment plans
- Track payment plan compliance separately from general patient balances
- Insurance collection timing is more predictable once claim is approved

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
