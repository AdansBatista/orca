# On-Call Management

> **Sub-Area**: [Emergency & Reminders](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

On-Call Management handles scheduling and coordination of on-call provider coverage for multi-provider practices. This function enables rotating on-call assignments, tracks provider availability, facilitates shift swaps, and integrates with after-hours emergency routing.

---

## Core Requirements

- [ ] Create on-call schedule with date/time periods
- [ ] Support rotating on-call assignments across providers
- [ ] Display on-call calendar view
- [ ] Store contact information for on-call provider
- [ ] Document on-call handoff notes
- [ ] Track on-call availability and preferences
- [ ] Manage backup on-call assignments
- [ ] Track on-call compensation (optional)
- [ ] Integrate with after-hours messaging
- [ ] Allow shift swaps with approval workflow

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/on-call` | `booking:view_calendar` | List on-call schedules |
| GET | `/api/booking/on-call/current` | `booking:view_calendar` | Get current on-call provider |
| POST | `/api/booking/on-call` | `booking:manage_templates` | Create on-call assignment |
| PUT | `/api/booking/on-call/:id` | `booking:manage_templates` | Update on-call |
| DELETE | `/api/booking/on-call/:id` | `booking:manage_templates` | Delete on-call assignment |
| POST | `/api/booking/on-call/:id/swap` | `booking:modify_appointment` | Request shift swap |
| GET | `/api/booking/on-call/calendar` | `booking:view_calendar` | On-call calendar view |
| GET | `/api/booking/on-call/provider/:id` | `booking:view_calendar` | Provider's on-call schedule |

---

## Data Model

```prisma
model OnCallSchedule {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  providerId    String   @db.ObjectId

  // Schedule period
  startDateTime DateTime
  endDateTime   DateTime

  // On-call type
  type          OnCallType @default(PRIMARY)

  // Backup
  backupProviderId String? @db.ObjectId

  // Contact info override
  contactPhone    String?
  contactNotes    String?

  // Status
  status        OnCallStatus @default(SCHEDULED)

  // Swap tracking
  originalProviderId String? @db.ObjectId
  swappedAt         DateTime?
  swapReason        String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String  @db.ObjectId

  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  provider     User      @relation("OnCall", fields: [providerId], references: [id])
  backup       User?     @relation("OnCallBackup", fields: [backupProviderId], references: [id])

  @@index([clinicId])
  @@index([providerId])
  @@index([startDateTime, endDateTime])
  @@index([status])
}

enum OnCallType {
  PRIMARY
  BACKUP
  HOLIDAY
}

enum OnCallStatus {
  SCHEDULED
  ACTIVE
  COMPLETED
  SWAPPED
  CANCELLED
}

model OnCallSwapRequest {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  onCallId      String   @db.ObjectId

  requestedBy   String   @db.ObjectId
  requestedWith String   @db.ObjectId  // Provider to swap with
  reason        String?

  status        SwapStatus @default(PENDING)
  respondedAt   DateTime?
  respondedBy   String?  @db.ObjectId

  createdAt DateTime @default(now())

  @@index([clinicId])
  @@index([status])
}

enum SwapStatus {
  PENDING
  APPROVED
  DECLINED
  CANCELLED
}
```

---

## Business Rules

- Must have on-call coverage for all after-hours periods (no gaps)
- On-call periods typically run 5 PM to 8 AM and weekends
- Backup provider required if primary is unavailable
- Swap requests require approval from clinic admin or both providers
- On-call status changes to ACTIVE when period begins
- Holiday on-call may have different compensation rules
- Provider contact info can override default for specific shifts
- Integration with answering service for after-hours routing

---

## Dependencies

**Depends On:**
- [Auth & Authorization](../../../../auth/) - Permission checking
- [Staff Management](../../../../staff-management/) - Provider information
- [Calendar Views](../../calendar-management/functions/calendar-views.md) - Calendar display

**Required By:**
- [After-Hours Handling](./after-hours-handling.md) - Routing to on-call
- [Emergency Appointments](./emergency-appointments.md) - Provider notification

---

## Notes

- Consider mobile app notification for on-call provider
- Show on-call schedule on main calendar view
- Track on-call hours for fair distribution
- Send reminder to provider before their on-call starts

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
