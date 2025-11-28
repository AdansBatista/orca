# Opening Notifications

> **Sub-Area**: [Waitlist & Recovery](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Opening Notifications automatically matches cancelled appointments or new openings with waitlist entries and notifies patients via their preferred channel. The system manages hold periods, escalation to next-in-line, and tracks conversion rates from notifications to bookings.

---

## Core Requirements

- [ ] Automatically detect openings (cancellations, new slots)
- [ ] Match openings against waitlist preferences
- [ ] Send multi-channel notifications (SMS, email, phone)
- [ ] Include booking link for first-come-first-served response
- [ ] Manage hold period for patient response
- [ ] Escalate to next waitlist entry after hold expires
- [ ] Bulk notification for multiple openings
- [ ] Respect notification timing rules (no night messages)
- [ ] Track patient responses and conversion rates
- [ ] Manual trigger for immediate notification

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/booking/waitlist/:id/notify` | `booking:manage_waitlist` | Manually notify entry |
| GET | `/api/booking/waitlist/match/:slotId` | `booking:manage_waitlist` | Find matching entries for slot |
| POST | `/api/booking/waitlist/notify-matches` | `booking:manage_waitlist` | Notify all matches for opening |
| POST | `/api/booking/waitlist/:id/book` | `booking:manage_waitlist` | Book from waitlist |
| GET | `/api/booking/waitlist/notifications` | `booking:manage_waitlist` | List sent notifications |
| PUT | `/api/booking/waitlist/notifications/:id/response` | `booking:manage_waitlist` | Record response |
| GET | `/api/booking/waitlist/analytics/conversion` | `booking:view_analytics` | Notification conversion rates |

---

## Data Model

```prisma
model WaitlistNotification {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  waitlistEntryId String @db.ObjectId
  clinicId      String   @db.ObjectId

  // Opening offered
  appointmentSlotStart DateTime
  appointmentSlotEnd   DateTime
  providerId    String   @db.ObjectId
  chairId       String?  @db.ObjectId

  // Notification details
  channel       NotificationChannel
  sentAt        DateTime @default(now())
  message       String

  // Hold period
  holdExpiresAt DateTime
  holdReleased  Boolean  @default(false)

  // Response
  respondedAt   DateTime?
  response      NotificationResponse?

  // Result
  bookedAppointmentId  String?  @db.ObjectId

  waitlistEntry WaitlistEntry @relation(fields: [waitlistEntryId], references: [id])

  @@index([waitlistEntryId])
  @@index([clinicId])
  @@index([holdExpiresAt])
}

enum NotificationChannel {
  SMS
  EMAIL
  PHONE
  PUSH
}

enum NotificationResponse {
  ACCEPTED
  DECLINED
  NO_RESPONSE
  EXPIRED
}
```

---

## Business Rules

- Hold period of 2 hours (configurable) for patient response
- After hold expires, offer to next matching entry
- Maximum 3 notifications per waitlist entry
- No notifications sent between 9 PM and 8 AM (configurable)
- SMS requires patient opt-in per TCPA compliance
- Booking link valid only during hold period
- Entry status changes to NOTIFIED during hold
- Track which channel has best conversion rates

---

## Dependencies

**Depends On:**
- [Waitlist Management](./waitlist-management.md) - Waitlist entries
- [Patient Communications](../../../../patient-communications/) - Message delivery
- [Appointment Booking](../../appointment-management/functions/appointment-booking.md) - Slot booking

**Required By:**
- [Waitlist Management](./waitlist-management.md) - Resolution tracking
- [Template Analytics](../../calendar-management/functions/template-analytics.md) - Fill rate metrics

---

## Notes

- Consider WebSocket for real-time availability in patient link
- SMS should be short with clear call-to-action
- Email can include calendar preview of slot
- Track time-to-respond for optimization

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
