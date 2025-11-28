# Quality Analytics

> **Sub-Area**: [Quality & Remakes](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Quality Analytics provides comprehensive analysis of lab quality trends, remake rates, and cost of quality. The system generates vendor scorecards, identifies problem areas, and supports data-driven vendor selection and performance improvement discussions.

---

## Core Requirements

- [ ] Calculate quality metrics by vendor
- [ ] Track quality metrics by product type
- [ ] Analyze trends over time periods
- [ ] Compare quality across vendors
- [ ] Compute remake rates and costs
- [ ] Generate vendor quality scorecards
- [ ] Export reports for vendor reviews
- [ ] Alert on quality threshold breaches

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/quality/analytics` | `lab:manage_vendors` | Overall analytics |
| GET | `/api/lab/quality/analytics/vendor/:vendorId` | `lab:manage_vendors` | Vendor quality |
| GET | `/api/lab/quality/analytics/product/:productId` | `lab:manage_vendors` | Product quality |
| GET | `/api/lab/quality/analytics/trends` | `lab:manage_vendors` | Quality trends |
| GET | `/api/lab/quality/report` | `lab:manage_vendors` | Generate report |
| GET | `/api/lab/quality/scorecard/:vendorId` | `lab:manage_vendors` | Vendor scorecard |

---

## Data Model

```prisma
// Quality metrics aggregated from quality issues and remakes

model QualityMetrics {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String?  @db.ObjectId
  productId     String?  @db.ObjectId

  periodType    MetricPeriod  // MONTHLY, QUARTERLY, ANNUAL
  periodStart   DateTime
  periodEnd     DateTime

  totalOrders   Int      @default(0)
  totalItems    Int      @default(0)

  inspectionsPassed Int  @default(0)
  inspectionsFailed Int  @default(0)
  firstPassRate Float?

  remakeCount   Int      @default(0)
  remakeRate    Float?
  remakeCost    Decimal  @default(0)

  issuesBySeverity Json?  // {critical, major, minor, cosmetic}
  issuesByCategory Json?  // {fit, appearance, function, ...}

  qualityScore  Float?   // Composite score

  calculatedAt  DateTime @default(now())

  @@index([clinicId])
  @@index([vendorId])
  @@index([productId])
  @@index([periodStart])
}
```

---

## Business Rules

- Metrics calculated nightly or on-demand
- Quality score is weighted: first-pass 40%, remake rate 30%, severity 30%
- Target thresholds: first-pass >97%, remake <3%
- Historical data retained for trend analysis
- Alerts triggered when thresholds exceeded

---

## Dependencies

**Depends On:**
- Quality Issue Logging (issue data)
- Remake Request Management (remake data)
- Receiving Inspection (pass/fail data)

**Required By:**
- Performance Metrics (composite vendor scores)
- Lab Preference Rules (quality-based routing)
- Contract Management (performance discussions)

---

## Notes

- Consider benchmark comparisons across practices
- Support custom threshold configuration
- Export to PDF for vendor meetings

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
