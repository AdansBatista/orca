# Waitlist Management

> **Sub-Area**: [Waitlist & Recovery](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Waitlist Management enables practices to maintain a prioritized list of patients waiting for appointments. When no appointments are available for a patient's desired timeframe, they can be added to the waitlist with their preferences, and automatically notified when matching openings become available.

---

## Core Requirements

- [ ] Add patients to waitlist with appointment type and preferences
- [ ] Capture date range, time-of-day, and provider preferences
- [ ] Assign priority levels (urgent, high, standard, flexible)
- [ ] Track waitlist position and entry date
- [ ] Support multiple waitlist entries per patient (different types)
- [ ] Automatic removal when patient books an appointment
- [ ] Configurable expiration dates for entries
- [ ] Waitlist notes and reason tracking
- [ ] Filter and sort waitlist by various criteria
- [ ] Bulk operations (remove expired, notify matching)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/waitlist` | `booking:manage_waitlist` | List waitlist entries |
| GET | `/api/booking/waitlist/:id` | `booking:manage_waitlist` | Get entry details |
| POST | `/api/booking/waitlist` | `booking:manage_waitlist` | Add to waitlist |
| PUT | `/api/booking/waitlist/:id` | `booking:manage_waitlist` | Update entry |
| DELETE | `/api/booking/waitlist/:id` | `booking:manage_waitlist` | Remove from waitlist |
| GET | `/api/booking/waitlist/patient/:patientId` | `booking:manage_waitlist` | Get patient's entries |
| POST | `/api/booking/waitlist/bulk-remove` | `booking:manage_waitlist` | Bulk remove entries |
| GET | `/api/booking/waitlist/stats` | `booking:view_analytics` | Waitlist statistics |

---

## Data Model

```prisma
model WaitlistEntry {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Appointment request
  appointmentTypeId  String   @db.ObjectId
  priority      WaitlistPriority @default(STANDARD)
  status        WaitlistStatus @default(ACTIVE)

  // Preferences
  preferredProviderId  String?  @db.ObjectId
  dateRangeStart       DateTime?
  dateRangeEnd         DateTime?
  preferredTimes       TimePreference[]
  preferredDays        Int[]    // 0-6 (Sunday-Saturday)

  // Notes
  notes         String?
  reasonForWaitlist  String?

  // Expiration
  expiresAt     DateTime?

  // Tracking
  position      Int?     // Dynamic position in queue
  addedAt       DateTime @default(now())
  addedBy       String   @db.ObjectId
  notificationsSent  Int   @default(0)
  lastNotifiedAt     DateTime?

  // Resolution
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId
  resolution    WaitlistResolution?
  bookedAppointmentId  String?  @db.ObjectId

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
  @@index([priority])
}

enum WaitlistPriority {
  URGENT
  HIGH
  STANDARD
  FLEXIBLE
}

enum WaitlistStatus {
  ACTIVE
  NOTIFIED      // Currently being offered an opening
  BOOKED        // Successfully booked
  EXPIRED       // Entry expired
  REMOVED       // Manually removed
  DECLINED      // Patient declined all offers
}

enum WaitlistResolution {
  BOOKED
  EXPIRED
  PATIENT_REMOVED
  STAFF_REMOVED
  DECLINED_ALL_OFFERS
}

type TimePreference {
  type     String    // "MORNING", "AFTERNOON", "EVENING", "SPECIFIC"
  startTime String?  // For SPECIFIC: "09:00"
  endTime   String?  // For SPECIFIC: "12:00"
}
```

---

## Business Rules

- Urgent priority entries offered openings first, then by add date
- Entries expire after 90 days (configurable) if not resolved
- Maximum 3 notifications per entry before manual intervention required
- Patient can have multiple entries for different appointment types
- Automatic removal when any appointment of matching type booked
- Position calculated dynamically based on priority and add date
- Duplicate entries (same patient, type, preferences) prevented

---

## Dependencies

**Depends On:**
- [Auth & Authorization](../../../../auth/) - Permission checking
- [Appointment Type Configuration](../../appointment-management/functions/appointment-types.md) - Appointment types

**Required By:**
- [Opening Notifications](./opening-notifications.md)
- [Appointment Booking](../../appointment-management/functions/appointment-booking.md)

---

## Notes

- Consider visual queue display for front desk
- Patient portal could allow self-service waitlist signup
- Analytics on waitlist conversion rates valuable for scheduling optimization

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
