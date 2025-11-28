# Vendor Ratings

> **Sub-Area**: [Vendor Performance](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Vendor Ratings creates periodic performance scorecards combining objective metrics with subjective evaluations. This function calculates weighted scores across quality, delivery, pricing, and service dimensions, maintains rating history, enables vendor comparison rankings, and supports sharing scorecards with vendors for accountability and improvement discussions.

---

## Core Requirements

- [ ] Create periodic ratings (monthly, quarterly, annual)
- [ ] Calculate scores from multiple weighted components
- [ ] Support configurable weighting models
- [ ] Combine auto-calculated and manual rating factors
- [ ] Maintain historical rating records
- [ ] Compare vendor ratings and rankings
- [ ] Implement rating review and approval workflow
- [ ] Generate printable vendor scorecards
- [ ] Optionally share scorecards with vendors
- [ ] Recommend status changes based on ratings

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/:id/ratings` | `performance:read` | Get vendor ratings |
| GET | `/api/vendors/ratings/:id` | `performance:read` | Get rating details |
| POST | `/api/vendors/:id/ratings` | `performance:rate` | Create rating |
| PUT | `/api/vendors/ratings/:id` | `performance:rate` | Update rating |
| POST | `/api/vendors/ratings/:id/submit` | `performance:rate` | Submit for review |
| POST | `/api/vendors/ratings/:id/publish` | `performance:publish` | Publish rating |
| GET | `/api/vendors/ratings/rankings` | `performance:view_all` | Get vendor rankings |
| GET | `/api/vendors/ratings/:id/scorecard` | `performance:read` | Generate scorecard PDF |

---

## Data Model

```prisma
model VendorRating {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Rating Period
  periodStart   DateTime
  periodEnd     DateTime

  // Scores (1-5 scale)
  overallScore  Decimal
  qualityScore  Decimal?
  deliveryScore Decimal?
  priceScore    Decimal?
  serviceScore  Decimal?
  communicationScore Decimal?

  // Metrics (auto-calculated)
  onTimeDeliveryRate Decimal?
  orderAccuracyRate Decimal?
  defectRate    Decimal?
  responseTime  Decimal?

  // Statistics
  totalOrders   Int      @default(0)
  totalSpend    Decimal  @default(0)
  totalIssues   Int      @default(0)

  // Comments
  strengths     String?
  improvements  String?
  notes         String?

  // Status
  status        RatingStatus @default(DRAFT)
  reviewedBy    String?  @db.ObjectId
  reviewedAt    DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([clinicId])
  @@index([vendorId])
  @@index([periodStart])
  @@index([overallScore])
}

enum RatingStatus {
  DRAFT
  SUBMITTED
  REVIEWED
  PUBLISHED
}
```

---

## Business Rules

- Default weighting: Quality 25%, Delivery 25%, Price 20%, Service 15%, Communication 10%, Compliance 5%
- Rating scale: 1-5 (5 = Excellent, 1 = Unacceptable)
- Overall score: Weighted average of component scores
- Score thresholds: 4.5-5.0 Excellent, 4.0-4.4 Good, 3.0-3.9 Fair, 2.0-2.9 Poor, <2.0 Unacceptable
- Ratings created quarterly by default
- Ratings require manager review before publishing
- Published ratings visible to authorized users
- Low ratings (<3.0) may trigger vendor review
- Rating history informs contract renewal decisions
- Preferred vendor status linked to high ratings

---

## Dependencies

**Depends On:**
- Performance Metrics (objective metrics)
- Quality Tracking (quality scores)
- Delivery Tracking (delivery scores)
- Issue Tracking (issue counts)

**Required By:**
- Vendor Status (rating-based recommendations)
- Contract Management (renewal decisions)

---

## Notes

- Scorecard template with practice branding
- Vendor portal access for shared scorecards
- Trend charts showing rating history
- Peer comparison within category
- Action plans for underperforming vendors
- Subjective ratings for service and communication

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
