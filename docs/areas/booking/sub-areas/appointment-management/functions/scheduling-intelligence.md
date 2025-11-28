# Scheduling Intelligence

> **Sub-Area**: [Appointment Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Scheduling Intelligence provides smart scheduling assistance through conflict detection, slot recommendations, and AI-powered optimization. This function helps staff book appointments efficiently by suggesting optimal times, preventing scheduling mistakes, and learning from booking patterns to improve recommendations.

---

## Core Requirements

- [ ] Detect conflicts (provider, resource, patient double-booking)
- [ ] Provide smart slot suggestions based on appointment type
- [ ] Template-aware scheduling (prefer matching template slots)
- [ ] Recommend optimal times based on provider preferences
- [ ] Consider travel time for multi-location practices
- [ ] Learn and apply patient preferences
- [ ] Enforce overbooking limits with configurable thresholds
- [ ] Optimize for reduced patient wait times
- [ ] AI-powered scheduling recommendations
- [ ] Suggest alternative slots when conflicts detected

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/booking/intelligence/check-conflicts` | `booking:view_calendar` | Check for all conflict types |
| GET | `/api/booking/intelligence/suggestions` | `booking:view_calendar` | Get slot suggestions |
| GET | `/api/booking/intelligence/optimal-slots` | `booking:view_calendar` | Get AI-optimized slots |
| GET | `/api/booking/intelligence/patient-preferences/:patientId` | `booking:view_calendar` | Get learned patient preferences |
| POST | `/api/booking/intelligence/validate` | `booking:create_appointment` | Validate proposed booking |
| GET | `/api/booking/intelligence/capacity` | `booking:view_calendar` | Get capacity analysis |

---

## Data Model

```prisma
model PatientSchedulingPreference {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Learned preferences
  preferredDays       Int[]    // 0-6, most frequent booking days
  preferredTimeSlots  String[] // "MORNING", "AFTERNOON", "EVENING"
  preferredProviderId String?  @db.ObjectId
  preferredChairId    String?  @db.ObjectId

  // Calculated from history
  avgLeadTimeDays     Float?   // Avg days between booking and appointment
  noShowLikelihood    Float?   // 0-1 probability
  lateArrivalMinutes  Float?   // Avg late arrival time

  // Last updated
  calculatedAt  DateTime @default(now())
  dataPoints    Int      @default(0)  // Number of appointments analyzed

  @@unique([clinicId, patientId])
  @@index([clinicId])
}

model SchedulingSuggestion {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId

  // Context
  patientId     String   @db.ObjectId
  appointmentTypeId String @db.ObjectId
  requestedDate DateTime?

  // Suggestions
  suggestedSlots SuggestedSlot[]
  generatedAt    DateTime @default(now())

  // Ranking factors used
  factors       SchedulingFactor[]
}

type SuggestedSlot {
  startTime     DateTime
  endTime       DateTime
  providerId    String
  chairId       String?
  score         Float      // 0-100 recommendation score
  reasons       String[]   // Why this slot is recommended
}

type SchedulingFactor {
  factor        String
  weight        Float
  value         Float
}

model ConflictCheck {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Proposed booking
  proposedStart DateTime
  proposedEnd   DateTime
  providerId    String   @db.ObjectId
  patientId     String   @db.ObjectId
  chairId       String?  @db.ObjectId
  roomId        String?  @db.ObjectId

  // Results
  hasConflicts  Boolean
  conflicts     DetectedConflict[]
  alternatives  SuggestedSlot[]

  checkedAt     DateTime @default(now())

  @@index([clinicId])
}

type DetectedConflict {
  type          String   // "PROVIDER", "CHAIR", "PATIENT", "ROOM", "CAPACITY"
  severity      String   // "ERROR", "WARNING"
  message       String
  conflictingId String?  // ID of conflicting appointment/resource
}
```

---

## Business Rules

- Conflicts block booking unless explicitly overridden by authorized user
- Suggestions weighted by: template match > provider availability > patient preference > utilization balance
- Travel time buffer (configurable) required between multi-location appointments
- Overbooking limits configurable per appointment type
- Patient preferences recalculated after each appointment
- No-show prediction factors into suggestion scoring
- AI recommendations respect provider and resource constraints

---

## Dependencies

**Depends On:**
- [Appointment Booking](./appointment-booking.md) - Booking validation
- [Calendar Views](../../calendar-management/functions/calendar-views.md) - Availability data
- [Resource Scheduling](./resource-scheduling.md) - Resource conflicts
- [Template Application](../../calendar-management/functions/template-application.md) - Template slots

**Required By:**
- [Appointment Booking](./appointment-booking.md) - Inline suggestions
- [Waitlist Management](../../waitlist-recovery/functions/waitlist-management.md) - Matching openings

---

## Notes

- Consider machine learning model for no-show prediction
- Suggestions should be fast (<200ms response time)
- Provide explanations for recommendations (transparency)
- Allow providers to set scheduling preferences/constraints

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
