# Resource Scheduling

> **Sub-Area**: [Appointment Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Resource Scheduling manages the allocation of physical resources (chairs, rooms, equipment) to appointments. This function ensures appointments have required resources, detects and prevents resource conflicts, enables auto-assignment based on availability, and tracks resource utilization for capacity planning.

---

## Core Requirements

- [ ] Assign chairs to appointments (required for most appointment types)
- [ ] Assign rooms for consultations, imaging, and special procedures
- [ ] Track equipment requirements per appointment type
- [ ] Detect resource conflicts during booking
- [ ] Auto-assign resources based on availability and preferences
- [ ] Allow resource swap/reassignment after booking
- [ ] Support multi-resource appointments (chair + room)
- [ ] Calculate and display resource utilization metrics
- [ ] Respect equipment maintenance schedules

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/appointments/:id/resources` | `booking:view_calendar` | Get assigned resources |
| PUT | `/api/booking/appointments/:id/resources` | `booking:modify_appointment` | Update resource assignment |
| POST | `/api/booking/appointments/:id/resources/auto-assign` | `booking:modify_appointment` | Auto-assign available resources |
| GET | `/api/booking/resources/availability` | `booking:view_calendar` | Get resource availability |
| GET | `/api/booking/resources/:id/schedule` | `booking:view_calendar` | Get resource schedule |
| POST | `/api/booking/resources/check-conflict` | `booking:view_calendar` | Check for conflicts |
| GET | `/api/booking/resources/utilization` | `booking:view_analytics` | Get utilization metrics |

---

## Data Model

Resource assignment on Appointment (existing fields):

```prisma
model Appointment {
  // ... existing fields ...

  // Resource assignment
  chairId       String?  @db.ObjectId
  roomId        String?  @db.ObjectId

  // Equipment tracking stored as JSON
  equipmentAssignments  EquipmentAssignment[]

  chair          Chair?   @relation(fields: [chairId], references: [id])
  room           Room?    @relation(fields: [roomId], references: [id])
}

type EquipmentAssignment {
  equipmentId   String
  assignedAt    DateTime
  assignedBy    String
}

// Conflict tracking
model ResourceConflict {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  conflictType  ResourceConflictType
  resourceType  String   // "chair", "room", "equipment"
  resourceId    String   @db.ObjectId
  appointmentId1 String  @db.ObjectId
  appointmentId2 String  @db.ObjectId
  conflictStart  DateTime
  conflictEnd    DateTime

  status        ConflictResolution @default(UNRESOLVED)
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId
  resolution    String?

  @@index([clinicId])
  @@index([status])
}

enum ResourceConflictType {
  DOUBLE_BOOKING
  MAINTENANCE_OVERLAP
  CAPACITY_EXCEEDED
}

enum ConflictResolution {
  UNRESOLVED
  REASSIGNED
  OVERRIDE_APPROVED
  CANCELLED
}
```

---

## Business Rules

- Chair assignment required for appointment types with `requiresChair: true`
- Room assignment required for appointment types with `requiresRoom: true`
- Equipment availability checked against maintenance schedules
- Auto-assignment prefers: previously used chair > patient preference > first available
- Double-booking of resources prevented unless admin override
- Resource reassignment triggers calendar update for affected appointments
- Inactive or maintenance resources excluded from auto-assignment
- Multi-clinic resources filtered by appointment's clinic

---

## Dependencies

**Depends On:**
- [Resources Management](../../../../resources-management/) - Resource definitions
- [Equipment Management](../../../../resources-management/sub-areas/equipment-management/) - Equipment and maintenance
- [Appointment Booking](./appointment-booking.md) - Appointment creation

**Required By:**
- [Resource Calendar](../../calendar-management/functions/resource-calendar.md)
- [Scheduling Intelligence](./scheduling-intelligence.md)

---

## Notes

- Consider patient chair preferences for comfort/familiarity
- Equipment conflicts may require appointment rescheduling
- Utilization reports useful for capacity planning decisions

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
