# Benchmarking

> **Sub-Area**: [Analytics Dashboard](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Benchmarking compares practice performance against industry standards and internal peers. This function provides industry benchmark comparisons, percentile rankings, location-to-location analysis, provider comparisons, historical self-benchmarking, and actionable improvement recommendations based on performance gaps.

---

## Core Requirements

- [ ] Maintain industry benchmark database with annual updates
- [ ] Calculate practice-to-benchmark comparisons with percentile rankings
- [ ] Enable location-to-location comparison for multi-site practices
- [ ] Support provider-to-provider performance comparison
- [ ] Track historical self-benchmarking (vs own prior performance)
- [ ] Generate percentile rankings across key metrics
- [ ] Provide AI-powered improvement recommendations

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/analytics/benchmarks` | `finance:view_analytics` | Get all benchmarks |
| GET | `/api/analytics/benchmarks/:metricCode` | `finance:view_analytics` | Specific metric benchmark |
| GET | `/api/analytics/benchmarks/ranking` | `finance:view_analytics` | Practice percentile ranking |
| GET | `/api/analytics/benchmarks/compare` | `finance:view_analytics` | Compare to benchmark |
| GET | `/api/analytics/benchmarks/locations` | `finance:view_analytics` | Location comparison |
| GET | `/api/analytics/benchmarks/providers` | `finance:view_analytics` | Provider comparison |
| GET | `/api/analytics/benchmarks/self` | `finance:view_analytics` | Historical self-comparison |
| GET | `/api/analytics/benchmarks/recommendations` | `finance:view_analytics` | Improvement recommendations |

---

## Data Model

```prisma
model BenchmarkData {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId

  // Benchmark definition
  metricCode    String
  metricName    String
  category      BenchmarkCategory
  unit          BenchmarkUnit

  // Percentiles
  percentile10  Decimal
  percentile25  Decimal
  percentile50  Decimal  // Median
  percentile75  Decimal
  percentile90  Decimal

  // Segmentation
  practiceSize  PracticeSize?
  region        String?
  specialty     String?  // "orthodontics"

  // Source and currency
  source        String
  sourceYear    Int
  lastUpdated   DateTime

  // Guidance
  targetPercentile Int?
  improvementTips String[]

  @@index([metricCode])
  @@index([category])
  @@index([practiceSize])
}

enum BenchmarkCategory {
  FINANCIAL
  OPERATIONAL
  CLINICAL
  MARKETING
  PATIENT_EXPERIENCE
}

enum BenchmarkUnit {
  PERCENTAGE
  CURRENCY
  COUNT
  DAYS
  RATIO
}

enum PracticeSize {
  SOLO           // 1 provider
  SMALL          // 2-3 providers
  MEDIUM         // 4-6 providers
  LARGE          // 7+ providers
}

model PracticeRanking {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodType    PeriodType
  periodDate    DateTime

  // Metric
  metricCode    String
  metricValue   Decimal

  // Ranking
  percentile    Int
  benchmarkMedian Decimal
  variance      Decimal
  variancePercent Decimal

  // Status
  status        RankingStatus

  // Timestamps
  calculatedAt  DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, metricCode, periodType, periodDate])
  @@index([clinicId])
  @@index([metricCode])
  @@index([percentile])
}

enum RankingStatus {
  TOP_10        // 90th+ percentile
  ABOVE_AVERAGE // 50th-89th percentile
  AVERAGE       // 25th-49th percentile
  BELOW_AVERAGE // 10th-24th percentile
  BOTTOM_10     // Below 10th percentile
}

model BenchmarkComparison {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Comparison type
  comparisonType ComparisonType
  comparisonId   String?  @db.ObjectId // location or provider ID

  // Period
  periodType    PeriodType
  periodDate    DateTime

  // Metrics snapshot
  metrics       Json     // All compared metrics

  // Overall score
  overallScore  Decimal?
  overallRank   Int?

  // Timestamps
  calculatedAt  DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([comparisonType])
  @@index([periodDate])
}

enum ComparisonType {
  INDUSTRY
  LOCATION
  PROVIDER
  SELF_HISTORICAL
}
```

---

## Business Rules

- Industry benchmarks updated annually from AAO and industry surveys
- Practice size segmentation ensures fair comparisons
- Provider comparisons respect confidentiality settings
- Top performers (90th+ percentile) highlighted for recognition
- Improvement recommendations prioritized by impact potential
- Self-benchmarking requires minimum 12 months history
- Location comparisons normalize for patient volume differences

---

## Dependencies

**Depends On:**
- KPI Dashboard (current metrics)
- All financial and operational data sources

**Required By:**
- Executive Reporting
- Performance Management
- Strategic Planning

---

## Notes

**Industry Benchmarks (Orthodontics):**
| Metric | 25th %ile | 50th %ile | 75th %ile | Top 10% |
|--------|-----------|-----------|-----------|---------|
| Collection Rate | 93% | 96% | 98% | 99%+ |
| Overhead Ratio | 72% | 62% | 55% | <50% |
| Case Acceptance | 70% | 80% | 88% | 95%+ |
| Average Case Value | $4,500 | $5,500 | $6,500 | $7,500+ |
| Production/Chair/Day | $1,200 | $1,800 | $2,400 | $3,000+ |
| New Patients/Month | 12 | 20 | 32 | 50+ |
| No-Show Rate | 10% | 6% | 3% | <2% |
| Patient Satisfaction | 85% | 90% | 95% | 98%+ |

**Internal Benchmarking Views:**
- Location vs Location (multi-site)
- Provider vs Provider
- This year vs Last year
- This month vs Same month last year
- Quarter vs Previous quarter

**Improvement Recommendations:**
- AI analyzes gaps to benchmarks
- Prioritizes by financial impact
- Suggests specific action items
- Links to relevant best practices

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
