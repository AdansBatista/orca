# Shift Scheduling

> **Sub-Area**: [Scheduling & Time Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Create, manage, and modify staff work schedules across all practice locations. Provides a visual schedule builder with drag-and-drop functionality, shift templates for recurring patterns, and multi-location scheduling coordination. Integrates with appointment scheduling to align provider availability.

---

## Core Requirements

- [ ] Visual schedule builder (day/week/month views)
- [ ] Drag-and-drop shift assignment
- [ ] Create/edit/delete individual shifts
- [ ] Bulk shift creation from templates
- [ ] Multi-location scheduling support
- [ ] Shift conflict detection
- [ ] Schedule publication and staff notification
- [ ] Shift swap/trade request handling

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/schedules` | `schedule:read` | Get all schedules |
| GET | `/api/staff/schedules/week` | `schedule:read` | Get weekly schedule |
| GET | `/api/staff/:id/shifts` | `schedule:read` | Get staff shifts |
| POST | `/api/staff/:id/shifts` | `schedule:create` | Create shift |
| PUT | `/api/staff/shifts/:shiftId` | `schedule:update` | Update shift |
| DELETE | `/api/staff/shifts/:shiftId` | `schedule:update` | Delete shift |
| POST | `/api/staff/shifts/bulk` | `schedule:create` | Bulk create shifts |
| PUT | `/api/staff/shifts/:shiftId/status` | `schedule:update` | Update status |

---

## Data Model

```prisma
model StaffShift {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  shiftDate     DateTime @db.Date
  startTime     DateTime
  endTime       DateTime
  breakMinutes  Int      @default(0)
  scheduledHours Decimal

  locationId    String   @db.ObjectId
  shiftType     ShiftType @default(REGULAR)
  status        ShiftStatus @default(SCHEDULED)

  // Actual times (time tracking)
  clockIn       DateTime?
  clockOut      DateTime?

  notes         String?
  templateId    String?  @db.ObjectId

  @@index([staffProfileId])
  @@index([shiftDate])
  @@index([locationId])
}

enum ShiftType {
  REGULAR
  OVERTIME
  ON_CALL
  TRAINING
  COVERAGE
}

enum ShiftStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  SWAP_PENDING
}
```

---

## Business Rules

- Staff cannot be double-booked at the same location
- System warns when scheduling conflicts across locations
- Shifts over 6 hours must include break time (labor law compliance)
- Provider schedules sync with appointment availability
- Schedule publication triggers staff notifications
- Shift swaps require manager approval before finalization
- Historical shifts cannot be deleted, only cancelled

### Shift Types

| Type | Description | Typical Hours |
|------|-------------|---------------|
| Morning | AM shift | 7:00 AM - 1:00 PM |
| Afternoon | PM shift | 1:00 PM - 7:00 PM |
| Full Day | Standard | 8:00 AM - 5:00 PM |
| Extended | Long shift | 7:00 AM - 7:00 PM |

---

## Dependencies

**Depends On:**
- Employee Profiles
- Location/Clinic setup
- Schedule Templates

**Required By:**
- Coverage Management
- Overtime Tracking
- Appointment Scheduling (provider availability)
- Payroll (hours worked)

---

## Notes

- Consider: recurring shift patterns
- Provider clinic days determine appointment availability
- Multi-location providers may need rotation schedules
- Integration with time clock for actual hours
