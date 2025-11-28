# Appointment Reminders

> **Sub-Area**: [Emergency & Reminders](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Appointment Reminders sends automated multi-channel reminders to patients about upcoming appointments. This function supports configurable reminder sequences, personalized templates, delivery tracking, and analytics to maximize appointment attendance and reduce no-shows.

---

## Core Requirements

- [ ] Send multi-channel reminders (SMS, email, voice, push)
- [ ] Configure reminder sequences (1 week, 2 days, day before, etc.)
- [ ] Build and manage reminder templates with personalization
- [ ] Respect patient channel preferences
- [ ] Implement smart timing (no messages at night)
- [ ] Track delivery status and failures
- [ ] Monitor open/click rates for emails
- [ ] Handle unsubscribe requests
- [ ] Provide reminder effectiveness analytics
- [ ] AI-optimized send times for best response

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/reminders` | `booking:view_calendar` | List scheduled reminders |
| GET | `/api/booking/reminders/appointment/:id` | `booking:view_calendar` | Get appointment reminders |
| POST | `/api/booking/reminders/send` | `booking:manage_reminders` | Manually send reminder |
| DELETE | `/api/booking/reminders/:id` | `booking:manage_reminders` | Cancel scheduled reminder |
| GET | `/api/booking/reminders/analytics` | `booking:view_analytics` | Reminder analytics |
| GET | `/api/booking/reminder-templates` | `booking:manage_reminders` | List templates |
| POST | `/api/booking/reminder-templates` | `booking:manage_reminders` | Create template |
| PUT | `/api/booking/reminder-templates/:id` | `booking:manage_reminders` | Update template |
| GET | `/api/booking/reminder-sequences` | `booking:manage_reminders` | List sequences |
| POST | `/api/booking/reminder-sequences` | `booking:manage_reminders` | Create sequence |

---

## Data Model

```prisma
model AppointmentReminder {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  appointmentId String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Reminder info
  reminderType  ReminderType
  channel       NotificationChannel
  scheduledFor  DateTime
  sequence      Int      // Position in sequence (1, 2, 3...)

  // Content
  templateId    String?  @db.ObjectId
  subject       String?
  message       String

  // Status
  status        ReminderStatus @default(SCHEDULED)
  sentAt        DateTime?
  deliveredAt   DateTime?
  failedAt      DateTime?
  failureReason String?

  // Tracking
  openedAt      DateTime?
  clickedAt     DateTime?

  // Response (for confirmation reminders)
  responseReceived Boolean @default(false)
  response         String?
  respondedAt      DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  appointment  Appointment @relation(fields: [appointmentId], references: [id])

  @@index([clinicId])
  @@index([appointmentId])
  @@index([scheduledFor])
  @@index([status])
}

enum ReminderType {
  STANDARD        // General reminder
  CONFIRMATION    // Request confirmation response
  FINAL           // Day-of final reminder
  PRE_VISIT       // Pre-visit instructions
  FIRST_VISIT     // Special first visit reminder
}

enum ReminderStatus {
  SCHEDULED
  SENDING
  SENT
  DELIVERED
  FAILED
  CANCELLED
  SKIPPED       // Skipped due to earlier confirmation
}

model ReminderTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  name          String
  description   String?
  channel       NotificationChannel
  reminderType  ReminderType

  subject       String?  // For email
  body          String
  includeCalendarLink Boolean @default(false)
  includeDirections   Boolean @default(false)

  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([clinicId])
  @@index([channel])
}

model ReminderSequence {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  name          String
  description   String?
  appointmentTypes String[] @db.ObjectId // Empty = all types

  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)

  steps         ReminderStep[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([clinicId])
}

type ReminderStep {
  sequence      Int      // Order in sequence
  offsetDays    Int      // Days before appointment (negative = before)
  offsetHours   Int      // Hours offset
  channel       NotificationChannel
  reminderType  ReminderType
  templateId    String
  skipIfConfirmed Boolean @default(false)
}
```

---

## Business Rules

- No reminders sent between 9 PM and 8 AM (configurable)
- SMS requires patient opt-in per TCPA compliance
- Skip remaining reminders once appointment confirmed
- First visit appointments may use special sequence
- Reminder 2 hours before for patients with no-show history
- Failed deliveries trigger retry once, then alert staff
- Unsubscribe respected immediately across all channels
- Appointment cancellation cancels pending reminders

---

## Dependencies

**Depends On:**
- [Appointment Booking](../../appointment-management/functions/appointment-booking.md) - Appointment data
- [Patient Communications](../../../../patient-communications/) - Message delivery
- [Auth & Authorization](../../../../auth/) - Patient preferences

**Required By:**
- [Confirmation System](./confirmation-system.md) - Confirmation responses
- [Failed Appointment Recovery](../../waitlist-recovery/functions/failed-appointment-recovery.md) - No-show reduction

---

## Notes

- Templates should support merge fields: {patient_name}, {appointment_date}, {provider_name}, etc.
- Consider AI optimization of send times based on patient response history
- Email reminders can include calendar (.ics) attachments
- Track which sequences have best confirmation rates

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
