# Appointment Status Management

> **Sub-Area**: [Appointment Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Appointment Status Management tracks appointments through their lifecycle states from scheduled to completion. This function manages status transitions, maintains status history for audit purposes, enables status-based filtering, and triggers appropriate notifications and workflows based on status changes.

---

## Core Requirements

- [ ] Track appointment statuses (Scheduled, Confirmed, Arrived, In Progress, Completed, No-Show, Cancelled)
- [ ] Enforce valid status transitions
- [ ] Automated status transitions (e.g., patient check-in flow)
- [ ] Manual status override with permission control
- [ ] Maintain complete status history with timestamps and actors
- [ ] Status-based filtering and search
- [ ] Color-coded status visualization on calendar
- [ ] Trigger notifications on status changes
- [ ] Track confirmation status separately from appointment status

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/appointments/:id/status` | `booking:view_calendar` | Get current status |
| PUT | `/api/booking/appointments/:id/status` | `booking:modify_appointment` | Update status |
| POST | `/api/booking/appointments/:id/confirm` | `booking:modify_appointment` | Mark as confirmed |
| POST | `/api/booking/appointments/:id/check-in` | `booking:modify_appointment` | Check in patient |
| POST | `/api/booking/appointments/:id/start` | `booking:modify_appointment` | Start appointment |
| POST | `/api/booking/appointments/:id/complete` | `booking:modify_appointment` | Complete appointment |
| POST | `/api/booking/appointments/:id/no-show` | `booking:modify_appointment` | Mark as no-show |
| GET | `/api/booking/appointments/:id/history` | `booking:view_calendar` | Get status history |
| GET | `/api/booking/appointments/by-status/:status` | `booking:view_calendar` | Filter by status |

---

## Data Model

Status tracking on Appointment model:

```prisma
// Added to Appointment model
model Appointment {
  // ... existing fields ...

  // Status
  status        AppointmentStatus @default(SCHEDULED)
  statusHistory AppointmentStatusChange[]

  // Confirmation (separate from appointment status)
  confirmationStatus  ConfirmationStatus @default(UNCONFIRMED)
  confirmedAt         DateTime?
  confirmedBy         String?  // "patient", "staff", "auto"

  // Check-in
  arrivedAt     DateTime?
  checkedInBy   String?  @db.ObjectId
  startedAt     DateTime?
  completedAt   DateTime?

  // Cancellation
  cancelledAt   DateTime?
  cancelledBy   String?  @db.ObjectId
  cancellationReason  String?

  // No-show
  markedNoShowAt DateTime?
  noShowReason   String?
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  ARRIVED
  IN_PROGRESS
  COMPLETED
  NO_SHOW
  CANCELLED
  INCOMPLETE
}

enum ConfirmationStatus {
  UNCONFIRMED
  PENDING       // Reminder sent, waiting response
  CONFIRMED
  DECLINED      // Patient wants to reschedule
}

type AppointmentStatusChange {
  status       AppointmentStatus
  changedAt    DateTime
  changedBy    String  @db.ObjectId
  reason       String?
}
```

### Status Flow Diagram

```
Scheduled → Confirmed → Arrived → In Progress → Completed
     ↓           ↓          ↓           ↓
Cancelled   Cancelled   No-Show    Incomplete
```

---

## Business Rules

- Status transitions must follow valid paths (defined flow diagram)
- Cannot go directly from Scheduled to Completed (must have intermediate states)
- No-Show can only be marked after appointment start time
- Grace period (15 min configurable) before marking as no-show
- Cancellation records reason and whether late-cancel fee applies
- Confirmation status separate from appointment status
- Status changes logged with actor and timestamp for audit
- Certain status changes trigger notifications (no-show → recovery workflow)

---

## Dependencies

**Depends On:**
- [Appointment Booking](./appointment-booking.md) - Base appointment data
- [Auth & Authorization](../../../../auth/) - Permission checking

**Required By:**
- [Practice Orchestration](../../../../practice-orchestration/) - Patient flow tracking
- [Failed Appointment Recovery](../../waitlist-recovery/functions/failed-appointment-recovery.md)
- [Billing & Insurance](../../../../billing-insurance/) - No-show fee tracking

---

## Notes

- Status badge component should be reusable across views
- Consider keyboard shortcuts for common status transitions
- Real-time status updates for concurrent users via WebSocket

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
