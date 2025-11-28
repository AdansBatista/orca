# Recurring Appointments

> **Sub-Area**: [Appointment Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Recurring Appointments enables scheduling appointment series that repeat on a pattern (weekly, bi-weekly, monthly) for ongoing orthodontic treatment. This function supports creating, modifying, and managing entire series as well as individual occurrences, with integration to treatment plans for automated appointment generation.

---

## Core Requirements

- [ ] Create recurring appointment series with configurable patterns
- [ ] Support weekly, bi-weekly, monthly, and custom recurrence frequencies
- [ ] Set recurrence end date or maximum occurrence count
- [ ] Modify single occurrence without affecting entire series
- [ ] Modify entire series (future occurrences only)
- [ ] Handle conflicts in recurring series with resolution options
- [ ] Skip or reschedule individual occurrences
- [ ] Track completion status across series
- [ ] Generate appointments from treatment plan milestones
- [ ] Bulk scheduling interface for adjustment appointments

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/recurring` | `booking:view_calendar` | List recurring series |
| GET | `/api/booking/recurring/:id` | `booking:view_calendar` | Get series details |
| POST | `/api/booking/recurring` | `booking:create_appointment` | Create recurring series |
| PUT | `/api/booking/recurring/:id` | `booking:modify_appointment` | Update series (future) |
| DELETE | `/api/booking/recurring/:id` | `booking:cancel_appointment` | Cancel entire series |
| POST | `/api/booking/recurring/:id/generate` | `booking:create_appointment` | Generate next appointments |
| POST | `/api/booking/recurring/:id/pause` | `booking:modify_appointment` | Pause series |
| POST | `/api/booking/recurring/:id/resume` | `booking:modify_appointment` | Resume paused series |
| PUT | `/api/booking/appointments/:id/detach` | `booking:modify_appointment` | Detach from series |

---

## Data Model

```prisma
model RecurringAppointment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Recurrence pattern
  frequency     RecurrenceFrequency
  interval      Int      @default(1)  // Every X frequency units
  daysOfWeek    Int[]    // For weekly: [1, 3] = Mon, Wed
  dayOfMonth    Int?     // For monthly: day of month
  weekOfMonth   Int?     // For monthly: 1st, 2nd, 3rd, 4th, -1 (last)

  // Time
  preferredTime String   // "09:00"
  duration      Int      // Minutes

  // Type and assignment
  appointmentTypeId  String   @db.ObjectId
  providerId    String   @db.ObjectId

  // Bounds
  startDate     DateTime
  endDate       DateTime?
  maxOccurrences Int?
  generatedCount Int      @default(0)

  // Status
  status        RecurringStatus @default(ACTIVE)

  // Treatment link
  treatmentPlanId  String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String  @db.ObjectId

  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])
  appointments Appointment[]

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
}

enum RecurrenceFrequency {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  CUSTOM
}

enum RecurringStatus {
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}
```

---

## Business Rules

- Recurring series limited to 52 occurrences (1 year) maximum
- Appointments generated up to 90 days in advance (configurable)
- Modifying a single occurrence detaches it from series pattern
- Cancelled occurrences can be regenerated or skipped
- Series status changes to COMPLETED when all occurrences done
- Treatment plan integration auto-generates based on milestones
- Provider availability checked when generating occurrences
- Conflicts offer reschedule suggestions

---

## Dependencies

**Depends On:**
- [Appointment Booking](./appointment-booking.md) - Individual appointment creation
- [Appointment Type Configuration](./appointment-types.md) - Appointment types
- [Scheduling Intelligence](./scheduling-intelligence.md) - Conflict detection

**Required By:**
- [Treatment Management](../../../../treatment-management/) - Treatment plan integration

---

## Notes

- Use RRule library for recurrence calculation
- Background job for generating future appointments
- Provide visual timeline of entire series in patient record
- Consider "smart reschedule" that finds slots matching pattern

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
