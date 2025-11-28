# Failed Appointment Recovery

> **Sub-Area**: [Waitlist & Recovery](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Failed Appointment Recovery implements systematic workflows to recover patients after no-shows and cancellations. This function automates outreach, captures reasons for missed appointments, facilitates rebooking, and tracks recovery success rates to keep patients engaged in their treatment.

---

## Core Requirements

- [ ] Automatic outreach after missed appointments (SMS/email)
- [ ] Capture reason for no-show or cancellation
- [ ] Provide immediate rebooking suggestions
- [ ] Multi-touch follow-up sequences
- [ ] Generate manual outreach tasks when automation fails
- [ ] Grace period before marking as no-show
- [ ] Differentiate no-show from late cancellation
- [ ] Track recovery success rates
- [ ] Link to treatment impact (missed appointments affect timeline)
- [ ] Escalation for patients with multiple missed appointments

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/recovery/pending` | `booking:manage_waitlist` | List pending recovery cases |
| GET | `/api/booking/recovery/:id` | `booking:manage_waitlist` | Get recovery case details |
| POST | `/api/booking/recovery/:id/attempt` | `booking:manage_waitlist` | Log recovery attempt |
| PUT | `/api/booking/recovery/:id/status` | `booking:manage_waitlist` | Update recovery status |
| POST | `/api/booking/recovery/:id/rebook` | `booking:manage_waitlist` | Rebook patient |
| GET | `/api/booking/recovery/analytics` | `booking:view_analytics` | Recovery metrics |
| POST | `/api/booking/recovery/trigger/:appointmentId` | `booking:manage_waitlist` | Manually trigger recovery |

---

## Data Model

```prisma
model AppointmentCancellation {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  appointmentId String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Cancellation details
  cancellationType  CancellationType
  cancelledAt       DateTime @default(now())
  cancelledBy       String   @db.ObjectId
  cancelledByType   CancelledByType

  // Original appointment info (snapshot)
  originalStartTime DateTime
  originalEndTime   DateTime
  originalProviderId String  @db.ObjectId
  appointmentTypeId  String  @db.ObjectId

  // Reason
  reason            CancellationReason
  reasonDetails     String?

  // Notice period
  noticeHours       Float    // Hours before appointment
  isLateCancel      Boolean  @default(false)

  // Fee
  lateCancelFee     Float?
  feeWaived         Boolean  @default(false)
  feeWaivedReason   String?

  // Recovery
  recoveryStatus    RecoveryStatus @default(PENDING)
  recoveryAttempts  RecoveryAttempt[]
  rescheduledAppointmentId String? @db.ObjectId

  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  patient      Patient   @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([recoveryStatus])
}

enum CancellationType {
  CANCELLED      // Patient cancelled in advance
  LATE_CANCEL    // Cancelled within late cancel window
  NO_SHOW        // Patient didn't show up
  PRACTICE_CANCEL // Practice cancelled
}

enum CancelledByType {
  PATIENT
  STAFF
  SYSTEM
  PROVIDER
}

enum CancellationReason {
  SCHEDULE_CONFLICT
  ILLNESS
  TRANSPORTATION
  FORGOT
  FINANCIAL
  WEATHER
  FAMILY_EMERGENCY
  CHANGED_PROVIDERS
  PRACTICE_CLOSURE
  PROVIDER_UNAVAILABLE
  OTHER
}

enum RecoveryStatus {
  PENDING
  IN_PROGRESS
  RECOVERED
  LOST
  NOT_NEEDED
}

type RecoveryAttempt {
  attemptedAt   DateTime
  channel       NotificationChannel
  result        RecoveryAttemptResult
  notes         String?
}

enum RecoveryAttemptResult {
  RESCHEDULED
  NO_RESPONSE
  DECLINED
  PENDING
}
```

---

## Business Rules

- Grace period of 15 minutes (configurable) before marking no-show
- Late cancellation = within 24 hours (configurable) of appointment
- First recovery attempt within 1 hour of no-show
- Maximum 3 recovery attempts over 30 days
- Practice cancellations don't trigger patient recovery workflow
- Recovery status NOT_NEEDED for practice-initiated cancellations
- Link recovery to treatment plan to show impact on timeline
- Escalate to doctor after 2 no-shows within 90 days

---

## Dependencies

**Depends On:**
- [Appointment Status Management](../../appointment-management/functions/appointment-status.md) - Status changes
- [Patient Communications](../../../../patient-communications/) - Outreach delivery
- [Appointment Booking](../../appointment-management/functions/appointment-booking.md) - Rebooking

**Required By:**
- [Cancellation Tracking](./cancellation-tracking.md) - Reason analysis
- [At-Risk Patient Identification](./at-risk-patients.md) - Risk factors
- [Billing & Insurance](../../../../billing-insurance/) - Late cancel fees

---

## Notes

- Recovery messages should be empathetic, not punitive
- Include easy rebooking link in all communications
- Consider treatment stage when determining urgency
- Integration with treatment management for timeline impact

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
