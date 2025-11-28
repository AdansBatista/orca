# Confirmation System

> **Sub-Area**: [Emergency & Reminders](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Confirmation System manages appointment confirmation workflows, enabling patients to confirm appointments via SMS reply, email links, or phone. The system tracks confirmation status, handles decline responses with reschedule triggers, and provides analytics on confirmation rates.

---

## Core Requirements

- [ ] Send confirmation request messages
- [ ] Support two-way SMS confirmation (reply YES/NO)
- [ ] Provide email confirmation links
- [ ] Track phone confirmation manually
- [ ] Update confirmation status automatically
- [ ] Handle confirmation declines (trigger reschedule workflow)
- [ ] Escalate unconfirmed appointments for follow-up
- [ ] Calculate confirmation analytics
- [ ] Support bulk confirmation review
- [ ] Integrate with calendar status display

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/confirmations/pending` | `booking:view_calendar` | List unconfirmed appointments |
| POST | `/api/booking/appointments/:id/confirm` | `booking:modify_appointment` | Confirm appointment |
| POST | `/api/booking/appointments/:id/decline` | `booking:modify_appointment` | Patient declines |
| POST | `/api/booking/confirmations/request/:id` | `booking:manage_reminders` | Send confirmation request |
| GET | `/api/booking/confirmations/analytics` | `booking:view_analytics` | Confirmation rates |
| POST | `/api/patient-portal/appointments/:id/confirm` | Patient Portal | Patient self-confirm |
| GET | `/api/webhooks/sms/confirmation` | System | Incoming SMS webhook |
| GET | `/api/confirm/:token` | Public | Email confirmation link |

---

## Data Model

Confirmation tracking on Appointment model:

```prisma
model Appointment {
  // ... existing fields ...

  // Confirmation status (separate from appointment status)
  confirmationStatus  ConfirmationStatus @default(UNCONFIRMED)
  confirmedAt         DateTime?
  confirmedBy         String?  // "patient", "staff", "auto", "sms", "email"
  confirmationToken   String?  // For email link validation
  tokenExpiresAt      DateTime?

  // Decline handling
  declinedAt          DateTime?
  declineReason       String?
  rescheduleRequested Boolean @default(false)
}

enum ConfirmationStatus {
  UNCONFIRMED
  PENDING       // Confirmation request sent, awaiting response
  CONFIRMED
  DECLINED      // Patient wants to reschedule
}

model ConfirmationRequest {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  appointmentId String   @db.ObjectId
  clinicId      String   @db.ObjectId

  // Request details
  channel       NotificationChannel
  sentAt        DateTime @default(now())
  message       String

  // Response
  responseStatus ConfirmationResponse @default(PENDING)
  respondedAt    DateTime?
  responseText   String?  // For SMS replies

  // For SMS handling
  fromNumber     String?
  toNumber       String?

  @@index([appointmentId])
  @@index([clinicId])
  @@index([responseStatus])
}

enum ConfirmationResponse {
  PENDING
  CONFIRMED
  DECLINED
  EXPIRED
  INVALID_RESPONSE
}
```

---

## Business Rules

- Confirmation requests sent 2-7 days before appointment (configurable)
- SMS replies parsed: "YES", "Y", "CONFIRM" = confirmed; "NO", "N", "CANCEL" = declined
- Email confirmation links expire 24 hours before appointment
- Declined appointments trigger reschedule task
- Unconfirmed appointments 24 hours before → escalate to front desk
- Auto-cancel unconfirmed appointments optional (disabled by default)
- Phone confirmations logged manually by staff
- Confirmation rate tracked by provider and appointment type

---

## Dependencies

**Depends On:**
- [Appointment Reminders](./appointment-reminders.md) - Reminder delivery
- [Appointment Status Management](../../appointment-management/functions/appointment-status.md) - Status updates
- [Patient Communications](../../../../patient-communications/) - SMS/email delivery

**Required By:**
- [Appointment Booking](../../appointment-management/functions/appointment-booking.md) - Calendar display
- [Failed Appointment Recovery](../../waitlist-recovery/functions/failed-appointment-recovery.md) - Decline handling

---

## Notes

- SMS confirmation should use shortcodes for better deliverability
- Consider voice confirmation call option for older patients
- Track time between request and response for optimization
- Confirmation rate is key metric for practice operations

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
