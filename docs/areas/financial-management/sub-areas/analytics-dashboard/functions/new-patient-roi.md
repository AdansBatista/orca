# New Patient ROI

> **Sub-Area**: [Analytics Dashboard](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

New Patient ROI tracks return on investment for new patient acquisition and marketing efforts. This function calculates marketing source ROI, tracks cost per lead and cost per start, computes patient lifetime value, visualizes conversion funnels, and provides actionable insights for marketing budget allocation.

---

## Core Requirements

- [ ] Track marketing spend and results by source/campaign
- [ ] Calculate cost per lead by marketing source
- [ ] Calculate cost per start (acquisition cost)
- [ ] Compute new patient lifetime value (LTV)
- [ ] Analyze referral source value contribution
- [ ] Visualize conversion funnel metrics (lead → exam → start)
- [ ] Provide marketing budget allocation recommendations

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/analytics/roi` | `finance:view_analytics` | Marketing ROI summary |
| GET | `/api/analytics/roi/by-source` | `finance:view_analytics` | ROI by marketing source |
| GET | `/api/analytics/roi/by-campaign` | `finance:view_analytics` | ROI by campaign |
| GET | `/api/analytics/roi/funnel` | `finance:view_analytics` | Conversion funnel |
| GET | `/api/analytics/roi/ltv` | `finance:view_analytics` | Patient lifetime value |
| GET | `/api/analytics/roi/cost-per-lead` | `finance:view_analytics` | Cost per lead analysis |
| GET | `/api/analytics/roi/cost-per-start` | `finance:view_analytics` | Cost per acquisition |
| GET | `/api/analytics/roi/recommendations` | `finance:view_analytics` | Budget recommendations |

---

## Data Model

```prisma
model MarketingROI {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodStart   DateTime
  periodEnd     DateTime

  // Source
  sourceId      String   @db.ObjectId
  sourceName    String
  sourceType    MarketingSourceType
  campaignId    String?  @db.ObjectId
  campaignName  String?

  // Spend
  spend         Decimal

  // Funnel metrics
  impressions   Int?
  clicks        Int?
  leads         Int
  exams         Int
  starts        Int

  // Revenue
  contractValue Decimal  // Total contract value of starts
  collectedValue Decimal? // Already collected
  projectedLTV  Decimal  // Lifetime value projection

  // Calculated metrics
  costPerImpression Decimal?
  costPerClick  Decimal?
  costPerLead   Decimal
  costPerExam   Decimal
  costPerStart  Decimal  // CPA
  leadToExamRate Decimal
  examToStartRate Decimal
  overallConversionRate Decimal
  roi           Decimal  // (Revenue - Spend) / Spend

  // Timestamps
  generatedAt   DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, periodStart, sourceId, campaignId])
  @@index([clinicId])
  @@index([periodStart])
  @@index([sourceId])
}

enum MarketingSourceType {
  GOOGLE_ADS
  FACEBOOK_ADS
  INSTAGRAM_ADS
  OTHER_DIGITAL
  SOCIAL_ORGANIC
  SEO_ORGANIC
  REFERRAL_PATIENT
  REFERRAL_PROVIDER
  DIRECT_MAIL
  LOCAL_EVENT
  WALK_IN
  PHONE_DIRECTORY
  OTHER
}

model PatientLTV {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Acquisition
  acquisitionDate DateTime
  acquisitionSource MarketingSourceType
  acquisitionCost Decimal?

  // Treatment value
  initialContractValue Decimal
  additionalTreatmentValue Decimal @default(0)
  totalContractValue Decimal

  // Collection tracking
  totalCollected Decimal @default(0)
  remainingValue Decimal

  // Family impact
  familyReferrals Int     @default(0)
  familyReferralValue Decimal @default(0)

  // External referrals
  externalReferrals Int   @default(0)
  externalReferralValue Decimal @default(0)

  // Calculated LTV
  directLTV     Decimal  // Just this patient
  referralLTV   Decimal  // Value from referrals
  totalLTV      Decimal  // Direct + referral

  // Timestamps
  calculatedAt  DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, patientId])
  @@index([clinicId])
  @@index([acquisitionSource])
}

model ConversionFunnel {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodStart   DateTime
  periodEnd     DateTime

  // Source (null for overall)
  sourceType    MarketingSourceType?

  // Funnel stages
  totalLeads    Int
  scheduledExams Int
  completedExams Int
  proposedTreatment Int
  acceptedTreatment Int
  startedTreatment Int

  // Conversion rates
  leadToScheduled Decimal
  scheduledToCompleted Decimal
  completedToProposed Decimal
  proposedToAccepted Decimal
  acceptedToStarted Decimal
  overallConversion Decimal

  // Drop-off analysis
  leadDropOff   Int
  examDropOff   Int
  proposalDropOff Int
  acceptanceDropOff Int

  // Timestamps
  generatedAt   DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, periodStart, sourceType])
  @@index([clinicId])
  @@index([periodStart])
}
```

---

## Business Rules

- Marketing spend tracked by source and campaign
- Lead attribution uses first-touch or last-touch model (configurable)
- LTV includes value of referrals generated by patient
- ROI calculation: (Total Revenue - Marketing Spend) / Marketing Spend
- Conversion funnel tracks from lead to treatment start
- Cost per start (CPA) is primary acquisition metric
- Budget recommendations based on ROI and capacity constraints

---

## Dependencies

**Depends On:**
- CRM & Onboarding (leads, sources)
- Treatment Management (starts, contract values)
- Revenue Tracking (collections)

**Required By:**
- Marketing Budget Planning
- Executive Reporting
- Strategic Planning

---

## Notes

**Conversion Funnel Example:**
```
Marketing Spend → Leads → Exams → Starts → Revenue

Example Monthly Analysis:
Marketing: $5,000/month
├── Google Ads: $2,000 → 20 leads → 10 exams → 8 starts
├── Facebook: $1,500 → 15 leads → 6 exams → 4 starts
├── Referrals: $500 → 30 leads → 25 exams → 20 starts
└── Walk-ins: $0 → 10 leads → 8 exams → 6 starts

Total: 75 leads → 49 exams → 38 starts
Avg Case Value: $5,500
Total Revenue: $209,000
ROI: ($209,000 - $5,000) / $5,000 = 4,080%
```

**Source Comparison:**
| Source | Leads | Cost | CPL | Starts | CPA | LTV |
|--------|-------|------|-----|--------|-----|-----|
| Google Ads | 20 | $2,000 | $100 | 8 | $250 | $5,500 |
| Facebook | 15 | $1,500 | $100 | 4 | $375 | $5,200 |
| Referrals | 30 | $500 | $17 | 20 | $25 | $6,500 |
| Walk-ins | 10 | $0 | $0 | 6 | $0 | $5,000 |

Referrals have lowest CPA and highest LTV - worth investment in referral programs.

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
