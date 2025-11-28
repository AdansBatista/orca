# Appointment Booking

> **Sub-Area**: [Appointment Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Appointment Booking is the core function for creating and managing patient appointments. It provides staff with efficient booking workflows, drag-and-drop scheduling, and template-aware slot selection. Patients can also self-book through the patient portal for enabled appointment types.

---

## Core Requirements

- [ ] Schedule patient appointments with provider and resource assignment
- [ ] Book into template slots or custom time slots
- [ ] Drag-and-drop appointment creation and modification
- [ ] Quick booking from patient record (one-click to calendar)
- [ ] Multi-appointment booking for same visit (e.g., scan + adjustment)
- [ ] Adjust appointment duration within allowed bounds
- [ ] Copy/duplicate appointments for quick creation
- [ ] Link appointments to treatment plans and procedures
- [ ] Patient self-service booking via patient portal
- [ ] Capture booking notes and special instructions

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/appointments` | `booking:view_calendar` | List appointments with filters |
| GET | `/api/booking/appointments/:id` | `booking:view_calendar` | Get appointment details |
| POST | `/api/booking/appointments` | `booking:create_appointment` | Create new appointment |
| PUT | `/api/booking/appointments/:id` | `booking:modify_appointment` | Update appointment |
| DELETE | `/api/booking/appointments/:id` | `booking:cancel_appointment` | Cancel appointment |
| POST | `/api/booking/appointments/:id/reschedule` | `booking:modify_appointment` | Reschedule to new time |
| POST | `/api/booking/appointments/:id/duplicate` | `booking:create_appointment` | Duplicate appointment |
| GET | `/api/booking/availability` | `booking:view_calendar` | Get available slots |
| GET | `/api/patient-portal/available-slots` | Patient Portal | Get bookable slots for patient |
| POST | `/api/patient-portal/book` | Patient Portal | Patient self-booking |

---

## Data Model

```prisma
model Appointment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Timing
  startTime     DateTime
  endTime       DateTime
  duration      Int      // Minutes

  // Type and assignment
  appointmentTypeId  String   @db.ObjectId
  providerId    String   @db.ObjectId
  chairId       String?  @db.ObjectId
  roomId        String?  @db.ObjectId

  // Status
  status        AppointmentStatus @default(SCHEDULED)

  // Links
  treatmentPlanId    String?  @db.ObjectId
  procedureIds       String[] @db.ObjectId
  notes              String?
  patientNotes       String?  // Visible to patient

  // Source tracking
  bookedBy      String   @db.ObjectId
  bookedAt      DateTime @default(now())
  source        AppointmentSource @default(STAFF)
  templateSlotId  String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  clinic         Clinic          @relation(fields: [clinicId], references: [id])
  patient        Patient         @relation(fields: [patientId], references: [id])
  appointmentType AppointmentType @relation(fields: [appointmentTypeId], references: [id])
  provider       User            @relation(fields: [providerId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([providerId])
  @@index([startTime])
  @@index([status])
}

enum AppointmentSource {
  STAFF
  ONLINE
  PHONE
  RECALL
  TREATMENT_PLAN
  WAITLIST
}
```

---

## Business Rules

- Appointments require patient, provider, appointment type, and time
- Double-booking prevention for providers, chairs, and patients (unless override)
- Minimum lead time required for bookings (configurable, e.g., 2 hours)
- Online bookings limited to enabled appointment types
- Duration must fall within appointment type min/max bounds
- Treatment plan link auto-populates expected procedures
- Cancellation within late-cancel window may incur fee
- All bookings logged for audit trail

---

## Dependencies

**Depends On:**
- [Auth & Authorization](../../../../auth/) - User authentication and permissions
- [Calendar Views](../../calendar-management/functions/calendar-views.md) - Calendar display
- [Appointment Type Configuration](./appointment-types.md) - Appointment types
- [Resource Scheduling](./resource-scheduling.md) - Chair/room assignment

**Required By:**
- [Appointment Status Management](./appointment-status.md)
- [Recurring Appointments](./recurring-appointments.md)
- [Appointment Reminders](../../emergency-reminders/functions/appointment-reminders.md)

---

## Notes

- Implement optimistic UI updates for responsive drag-and-drop
- Consider WebSocket for real-time conflict detection
- Online booking widget should be embeddable on practice website

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
