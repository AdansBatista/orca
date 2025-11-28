# Room Scheduling

> **Sub-Area**: [Room/Chair Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Room Scheduling manages room availability and integrates with the appointment scheduling system. This function handles room operating hours, blocking rooms for maintenance or other activities, viewing room availability calendars, and preventing scheduling conflicts. It ensures rooms are properly allocated for patient appointments while accommodating maintenance, cleaning, and special activities.

---

## Core Requirements

- [ ] Set room operating hours (default from clinic or custom)
- [ ] Block rooms for maintenance, cleaning, or other activities
- [ ] View room availability calendar
- [ ] Check room availability for specific time slots
- [ ] Integrate with appointment scheduling system
- [ ] Prevent double-booking of rooms
- [ ] Support recurring room blocks (e.g., weekly deep cleaning)
- [ ] Handle room-specific appointment type restrictions
- [ ] Generate room utilization reports
- [ ] Notify affected appointments when room becomes unavailable

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/rooms/:id/availability` | `room:read` | Get room availability |
| GET | `/api/resources/rooms/:id/schedule` | `room:read` | Get room schedule |
| POST | `/api/resources/rooms/:id/block` | `room:schedule` | Block room time |
| PUT | `/api/resources/rooms/blocks/:blockId` | `room:schedule` | Update block |
| DELETE | `/api/resources/rooms/blocks/:blockId` | `room:schedule` | Remove block |
| GET | `/api/resources/rooms/availability` | `room:read` | Get all rooms availability |
| POST | `/api/resources/rooms/check-availability` | `room:read` | Check specific time slot |

---

## Data Model

```prisma
model RoomScheduleBlock {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  roomId          String   @db.ObjectId

  // Block details
  blockType       RoomBlockType
  title           String?

  // Timing
  startDateTime   DateTime
  endDateTime     DateTime
  isAllDay        Boolean  @default(false)

  // Recurrence
  isRecurring     Boolean  @default(false)
  recurrenceRule  String?  // RRULE format
  recurrenceEnd   DateTime?
  parentBlockId   String?  @db.ObjectId  // For recurring instances

  // Reason
  reason          String?
  notes           String?

  // Status
  status          BlockStatus @default(ACTIVE)

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String   @db.ObjectId

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])
  room      Room   @relation(fields: [roomId], references: [id])

  @@index([clinicId])
  @@index([roomId])
  @@index([startDateTime])
  @@index([status])
}

enum RoomBlockType {
  MAINTENANCE       // Equipment or room maintenance
  CLEANING          // Deep cleaning
  EQUIPMENT_SERVICE // Vendor equipment service
  STAFF_MEETING     // Staff meeting in room
  TRAINING          // Training session
  PRIVATE_EVENT     // Private use
  CLOSED            // Room closed
  OTHER
}

enum BlockStatus {
  ACTIVE
  CANCELLED
}
```

---

## Business Rules

- Room blocks cannot overlap for the same room
- Existing appointments in blocked time should be flagged for rescheduling
- Recurring blocks follow iCalendar RRULE specification
- Room availability considers both blocks and existing appointments
- Room status (maintenance, closed) automatically creates blocks
- All-day blocks span clinic operating hours
- Cancelling a recurring block can cancel single instance or all future

---

## Dependencies

**Depends On:**
- Room Registry (rooms must exist)
- Auth & Authorization (user authentication, permissions)
- Clinic Configuration (clinic operating hours)

**Required By:**
- Scheduling & Booking (room availability for appointments)
- Practice Orchestration (room allocation during patient flow)
- Maintenance Scheduling (maintenance creates room blocks)

---

## Notes

- Calendar view should integrate with existing scheduling UI
- Consider drag-and-drop for creating/modifying blocks
- Room utilization metrics: hours booked vs. available hours
- Integration with equipment maintenance to auto-create blocks
- Conflict detection should run before saving blocks
- Notification system should alert staff of room availability changes

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
