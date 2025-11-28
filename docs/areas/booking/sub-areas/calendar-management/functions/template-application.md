# Template Application

> **Sub-Area**: [Calendar Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Template Application enables applying schedule templates to calendar dates, date ranges, and recurring patterns. This function automates the process of setting up available appointment slots across the calendar, handling conflicts with existing appointments, and managing exceptions for holidays and special events.

---

## Core Requirements

- [ ] Apply template to a specific single date
- [ ] Apply template to a date range (week, month, custom range)
- [ ] Apply template to recurring patterns (every Monday, every other Tuesday)
- [ ] Bulk application across multiple providers/chairs simultaneously
- [ ] Preview template application before committing
- [ ] Detect and warn about conflicts with existing appointments
- [ ] Override template for specific dates (holidays, special events)
- [ ] Support partial template application (select specific slots only)
- [ ] Auto-skip clinic closure dates and holidays
- [ ] Track application history and allow rollback

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/booking/templates/:id/apply` | `booking:apply_templates` | Apply template to dates |
| POST | `/api/booking/templates/:id/preview` | `booking:apply_templates` | Preview application without saving |
| GET | `/api/booking/templates/applications` | `booking:view_calendar` | List template applications |
| GET | `/api/booking/templates/applications/:id` | `booking:view_calendar` | Get application details |
| PUT | `/api/booking/templates/applications/:id` | `booking:apply_templates` | Update application settings |
| DELETE | `/api/booking/templates/applications/:id` | `booking:manage_templates` | Cancel/remove application |
| POST | `/api/booking/templates/applications/:id/pause` | `booking:apply_templates` | Pause recurring application |
| POST | `/api/booking/templates/applications/:id/resume` | `booking:apply_templates` | Resume paused application |

---

## Data Model

```prisma
model TemplateApplication {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  templateId    String   @db.ObjectId

  applicationType  ApplicationType  // SINGLE_DATE, DATE_RANGE, RECURRING

  // For single date
  date          DateTime?

  // For date range
  startDate     DateTime?
  endDate       DateTime?

  // For recurring
  recurringPattern  RecurringPattern?

  // Target resources
  providerId    String?  @db.ObjectId
  chairId       String?  @db.ObjectId

  status        ApplicationStatus @default(ACTIVE)
  generatedSlots Int     @default(0)

  createdAt DateTime @default(now())
  appliedAt DateTime?
  appliedBy String?  @db.ObjectId

  clinic       Clinic           @relation(fields: [clinicId], references: [id])
  template     ScheduleTemplate @relation(fields: [templateId], references: [id])

  @@index([clinicId])
  @@index([templateId])
  @@index([status])
}

enum ApplicationType {
  SINGLE_DATE
  DATE_RANGE
  RECURRING
}

enum ApplicationStatus {
  PENDING
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

type RecurringPattern {
  frequency     String    // "DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"
  daysOfWeek    Int[]     // For weekly: [1, 3, 5] = Mon, Wed, Fri
  interval      Int       // Every X frequency units
  endDate       DateTime?
  maxOccurrences Int?
}
```

---

## Business Rules

- Cannot apply overlapping templates to same resource/date combination
- Holiday dates from clinic settings automatically excluded
- Existing appointments take precedence; slots with appointments are not overwritten
- clinic_admin can apply templates; front_desk may have restricted apply permission
- Recurring applications generate slots up to 90 days in advance (configurable)
- Application preview shows conflict summary before confirmation
- Cancelled applications do not remove already-booked appointments

---

## Dependencies

**Depends On:**
- [Schedule Template Builder](./schedule-template-builder.md) - Templates to apply
- [Multi-Provider Calendar](./multi-provider-calendar.md) - Calendar to apply to
- [Resources Management](../../../../resources-management/) - Chair/room availability

**Required By:**
- [Appointment Booking](../../appointment-management/functions/appointment-booking.md)
- [Template Analytics](./template-analytics.md)

---

## Notes

- Consider background job for large recurring applications
- Provide undo capability within reasonable timeframe (24 hours)
- Log all applications for audit trail and debugging

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
