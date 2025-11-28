# Template Analytics

> **Sub-Area**: [Calendar Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Template Analytics provides insights into schedule template effectiveness and utilization patterns. This function analyzes how well templates match actual booking demand, identifies underutilized or overbooked slots, and offers AI-powered optimization suggestions to improve scheduling efficiency.

---

## Core Requirements

- [ ] Calculate slot utilization rates (percentage of template slots filled)
- [ ] Measure template effectiveness (actual bookings vs. planned capacity)
- [ ] Identify most and least used slots across templates
- [ ] Analyze revenue generated per template configuration
- [ ] Correlate patient wait times with template design
- [ ] Compare performance across different templates
- [ ] Generate AI-powered optimization suggestions
- [ ] Track seasonal booking trends affecting templates
- [ ] Export analytics reports for management review

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/analytics/template-utilization` | `booking:view_analytics` | Get utilization metrics by template |
| GET | `/api/booking/analytics/slot-effectiveness` | `booking:view_analytics` | Get slot-level performance data |
| GET | `/api/booking/analytics/template-comparison` | `booking:view_analytics` | Compare templates side-by-side |
| GET | `/api/booking/analytics/optimization-suggestions` | `booking:view_analytics` | Get AI recommendations |
| GET | `/api/booking/analytics/seasonal-trends` | `booking:view_analytics` | Get seasonal booking patterns |
| GET | `/api/booking/analytics/revenue-by-template` | `booking:view_analytics` | Revenue analysis by template |
| POST | `/api/booking/analytics/export` | `booking:view_analytics` | Export analytics report |

---

## Data Model

Analytics computed from existing models, stored for performance:

```prisma
model TemplateAnalytics {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  templateId    String   @db.ObjectId

  // Period
  periodStart   DateTime
  periodEnd     DateTime
  periodType    AnalyticsPeriod  // DAILY, WEEKLY, MONTHLY

  // Utilization metrics
  totalSlots        Int
  bookedSlots       Int
  utilizationRate   Float   // 0-1

  // Effectiveness
  plannedCapacity   Int     // Expected patients
  actualBookings    Int     // Actual patients
  effectivenessRate Float   // 0-1

  // Revenue (if available)
  estimatedRevenue  Float?
  actualRevenue     Float?

  // Wait time impact
  avgWaitTime       Float?  // Minutes

  // Computed at
  calculatedAt  DateTime @default(now())

  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  template  ScheduleTemplate @relation(fields: [templateId], references: [id])

  @@index([clinicId])
  @@index([templateId])
  @@index([periodStart, periodEnd])
}

enum AnalyticsPeriod {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
}

model OptimizationSuggestion {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  templateId    String?  @db.ObjectId

  suggestionType  SuggestionType
  priority        SuggestionPriority
  title           String
  description     String
  expectedImpact  String

  // Action details
  actionRequired  Json?   // Structured action data

  status          SuggestionStatus @default(PENDING)
  reviewedAt      DateTime?
  reviewedBy      String?  @db.ObjectId
  reviewNotes     String?

  createdAt   DateTime @default(now())
  expiresAt   DateTime?

  @@index([clinicId])
  @@index([status])
}

enum SuggestionType {
  ADD_SLOTS
  REMOVE_SLOTS
  SHIFT_TIMES
  CHANGE_DURATION
  RESOURCE_REALLOCATION
  TEMPLATE_MERGE
  SEASONAL_ADJUSTMENT
}

enum SuggestionPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum SuggestionStatus {
  PENDING
  REVIEWED
  IMPLEMENTED
  DISMISSED
}
```

---

## Business Rules

- Analytics calculated nightly for previous day, aggregated weekly/monthly
- Minimum 30 days of data required for meaningful suggestions
- AI suggestions consider seasonal patterns (back-to-school, summer)
- Revenue calculations require billing integration (optional feature)
- Only clinic_admin and doctor roles can view analytics
- Suggestions expire after 30 days if not reviewed

---

## Dependencies

**Depends On:**
- [Schedule Template Builder](./schedule-template-builder.md) - Template definitions
- [Template Application](./template-application.md) - Application history
- [Appointment Management](../../appointment-management/) - Booking data
- [Billing & Insurance](../../../../billing-insurance/) - Revenue data (optional)

**Required By:**
- Business Intelligence dashboards
- Practice management reporting

---

## Notes

- Consider machine learning models for prediction (future enhancement)
- Baseline metrics should account for clinic hours and holidays
- Show trends over time, not just point-in-time snapshots
- Include actionable recommendations, not just raw data

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
