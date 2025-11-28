# Equipment Assignment

> **Sub-Area**: [Room/Chair Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Equipment Assignment manages the assignment and tracking of equipment to specific rooms or chairs. Each piece of equipment from the equipment catalog can be assigned to a location, with history tracking for moves. The system provides visibility into room/chair equipment configurations, links to equipment maintenance status, and alerts when assigned equipment needs service. This ensures rooms are properly equipped for scheduled procedures.

---

## Core Requirements

- [ ] Assign equipment from catalog to rooms or chairs
- [ ] Track assignment dates and who made assignments
- [ ] Prevent equipment from being in multiple locations simultaneously
- [ ] View all equipment assigned to a room/chair
- [ ] Track equipment assignment history
- [ ] Move equipment between locations with documentation
- [ ] Link to equipment maintenance status
- [ ] Alert when room equipment needs maintenance
- [ ] Designate primary vs. backup equipment
- [ ] Support temporary equipment assignments

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/rooms/:id/equipment` | `room:read` | List room equipment |
| POST | `/api/resources/rooms/:id/equipment` | `room:configure` | Assign equipment to room |
| DELETE | `/api/resources/rooms/:id/equipment/:equipmentId` | `room:configure` | Remove from room |
| GET | `/api/resources/chairs/:id/equipment` | `room:read` | List chair equipment |
| POST | `/api/resources/chairs/:id/equipment` | `room:configure` | Assign equipment to chair |
| DELETE | `/api/resources/chairs/:id/equipment/:equipmentId` | `room:configure` | Remove from chair |
| POST | `/api/resources/equipment/:id/move` | `room:configure` | Move equipment location |
| GET | `/api/resources/equipment/:id/assignments` | `equipment:read` | Get assignment history |

---

## Data Model

```prisma
model RoomEquipment {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  roomId          String   @db.ObjectId
  equipmentId     String   @db.ObjectId

  // Assignment details
  assignedDate    DateTime @default(now())
  assignedBy      String   @db.ObjectId

  // Position in room
  location        String?  // Where in the room

  // Status
  isPrimary       Boolean  @default(true)  // Primary vs backup
  isTemporary     Boolean  @default(false)
  temporaryUntil  DateTime?

  // Notes
  notes           String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic    @relation(fields: [clinicId], references: [id])
  room      Room      @relation(fields: [roomId], references: [id])
  equipment Equipment @relation(fields: [equipmentId], references: [id])

  @@unique([roomId, equipmentId])
  @@index([clinicId])
  @@index([roomId])
  @@index([equipmentId])
}

model ChairEquipment {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  chairId         String   @db.ObjectId
  equipmentId     String   @db.ObjectId

  // Assignment details
  assignedDate    DateTime @default(now())
  assignedBy      String   @db.ObjectId

  // Status
  isPrimary       Boolean  @default(true)
  isTemporary     Boolean  @default(false)
  temporaryUntil  DateTime?

  // Notes
  notes           String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic    @relation(fields: [clinicId], references: [id])
  chair     Chair     @relation(fields: [chairId], references: [id])
  equipment Equipment @relation(fields: [equipmentId], references: [id])

  @@unique([chairId, equipmentId])
  @@index([clinicId])
  @@index([chairId])
  @@index([equipmentId])
}

model EquipmentAssignmentHistory {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  equipmentId     String   @db.ObjectId

  // Assignment details
  assignmentType  AssignmentType
  targetId        String   @db.ObjectId  // Room or Chair ID
  targetType      TargetType

  // Action
  action          AssignmentAction
  actionDate      DateTime @default(now())
  actionBy        String   @db.ObjectId

  // Notes
  reason          String?

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic    Clinic    @relation(fields: [clinicId], references: [id])
  equipment Equipment @relation(fields: [equipmentId], references: [id])

  @@index([clinicId])
  @@index([equipmentId])
  @@index([actionDate])
}

enum AssignmentType {
  PERMANENT
  TEMPORARY
}

enum TargetType {
  ROOM
  CHAIR
}

enum AssignmentAction {
  ASSIGNED
  REMOVED
  MOVED
}
```

---

## Business Rules

- Equipment can only be assigned to one room or one chair at a time (not both)
- Moving equipment creates history entry and updates location
- Equipment in active repair cannot be assigned to new locations
- Temporary assignments auto-expire and generate return reminders
- Removing equipment from room/chair sets equipment location to null
- Equipment maintenance status should be visible in room/chair view
- Primary equipment distinguishes main from backup devices

---

## Dependencies

**Depends On:**
- Equipment Catalog (equipment must exist)
- Room Registry (rooms must exist)
- Chair Configuration (chairs must exist)
- Auth & Authorization (user authentication, permissions)

**Required By:**
- Room Scheduling (equipment availability affects room capabilities)
- Maintenance Scheduling (room-based maintenance view)

---

## Notes

- Consider bulk assignment for initial room setup
- Equipment with overdue maintenance should be visually flagged
- Assignment history useful for equipment utilization analysis
- Temporary assignments support loan situations within clinic
- Consider "setup profile" feature to save typical room configurations

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
