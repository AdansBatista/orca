# Cancellation Tracking

> **Sub-Area**: [Waitlist & Recovery](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Cancellation Tracking provides comprehensive analytics on appointment cancellations and no-shows. This function captures cancellation reasons, tracks patterns by various dimensions (patient, provider, day, time), and provides insights to help practices reduce cancellation rates and optimize scheduling.

---

## Core Requirements

- [ ] Categorize cancellation reasons with standard and custom options
- [ ] Track late cancellation vs. advance cancellation timing
- [ ] Calculate cancellation rates by patient, provider, day, time slot
- [ ] Analyze cancellation patterns and trends
- [ ] Enforce late cancellation policy with fee tracking
- [ ] Track no-show fees and waivers
- [ ] Calculate revenue impact of cancellations
- [ ] Generate same-day cancellation alerts
- [ ] Compare cancellation rates across appointment types
- [ ] Export cancellation reports for management review

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/cancellations` | `booking:view_calendar` | List cancellations |
| GET | `/api/booking/cancellations/:id` | `booking:view_calendar` | Get cancellation details |
| PUT | `/api/booking/cancellations/:id/reason` | `booking:modify_appointment` | Update reason |
| POST | `/api/booking/cancellations/:id/waive-fee` | `booking:cancel_appointment` | Waive late cancel fee |
| GET | `/api/booking/cancellations/analytics` | `booking:view_analytics` | Cancellation analytics |
| GET | `/api/booking/cancellations/by-reason` | `booking:view_analytics` | Breakdown by reason |
| GET | `/api/booking/cancellations/trends` | `booking:view_analytics` | Trend analysis |
| GET | `/api/booking/cancellations/export` | `booking:view_analytics` | Export report |

---

## Data Model

Uses `AppointmentCancellation` model from Failed Appointment Recovery plus analytics:

```prisma
model CancellationAnalytics {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodStart   DateTime
  periodEnd     DateTime
  periodType    AnalyticsPeriod

  // Overall metrics
  totalAppointments     Int
  totalCancellations    Int
  totalNoShows          Int
  cancellationRate      Float  // 0-1
  noShowRate            Float  // 0-1
  lateCancelRate        Float  // 0-1

  // By reason breakdown
  reasonBreakdown       ReasonCount[]

  // By dimension
  byDayOfWeek           DimensionCount[]
  byTimeSlot            DimensionCount[]
  byAppointmentType     DimensionCount[]
  byProvider            DimensionCount[]

  // Financial impact
  estimatedRevenueLost  Float
  feesCharged           Float
  feesWaived            Float
  feesCollected         Float

  calculatedAt  DateTime @default(now())

  @@index([clinicId])
  @@index([periodStart, periodEnd])
}

type ReasonCount {
  reason        CancellationReason
  count         Int
  percentage    Float
}

type DimensionCount {
  dimension     String
  totalAppointments Int
  cancellations Int
  rate          Float
}

model CancellationAlert {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  alertType     CancellationAlertType
  triggeredAt   DateTime @default(now())
  message       String

  // Context
  patientId     String?  @db.ObjectId
  providerId    String?  @db.ObjectId
  appointmentId String?  @db.ObjectId

  // Status
  acknowledged  Boolean  @default(false)
  acknowledgedBy String? @db.ObjectId
  acknowledgedAt DateTime?

  @@index([clinicId])
  @@index([acknowledged])
}

enum CancellationAlertType {
  SAME_DAY_CANCEL       // Cancellation for today
  HIGH_VOLUME           // Unusual number of cancellations
  REPEAT_OFFENDER       // Patient with multiple cancellations
  PROVIDER_PATTERN      // Provider with high cancel rate
  SLOT_VULNERABILITY    // Time slot with high cancel rate
}
```

---

## Business Rules

- Late cancellation defined as within 24 hours (configurable)
- Only clinic_admin can waive late cancellation fees
- Same-day cancellation alerts sent to front desk immediately
- Repeat offender alert after 3 cancellations in 90 days
- Provider cancellation patterns reviewed monthly
- Revenue impact calculated from appointment type fees
- Historical data retained for trend analysis (2 years minimum)

---

## Dependencies

**Depends On:**
- [Failed Appointment Recovery](./failed-appointment-recovery.md) - Cancellation records
- [Appointment Status Management](../../appointment-management/functions/appointment-status.md) - Status data
- [Billing & Insurance](../../../../billing-insurance/) - Fee calculations

**Required By:**
- [At-Risk Patient Identification](./at-risk-patients.md) - Pattern detection
- [Template Analytics](../../calendar-management/functions/template-analytics.md) - Schedule optimization

---

## Notes

- Dashboard should highlight actionable insights
- Allow custom cancellation reasons per clinic
- Consider predictive model for cancellation likelihood
- Benchmark against industry averages

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
