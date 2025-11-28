# Room Registry

> **Sub-Area**: [Room/Chair Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Room Registry maintains a comprehensive registry of all rooms and operatories in the orthodontic practice. This includes treatment bays, private operatories, consultation rooms, X-ray rooms, scanning rooms, and support areas. Each room is categorized by type, tracked with status information, and configured with capabilities that determine which procedures can be performed. The registry integrates with scheduling to ensure rooms are properly allocated.

---

## Core Requirements

- [ ] Register rooms with unique identifiers and names per clinic
- [ ] Categorize rooms by type (operatory, consultation, X-ray, sterilization, etc.)
- [ ] Track room status (active, maintenance, cleaning, closed)
- [ ] Record room physical attributes (dimensions, layout)
- [ ] Define room capabilities and supported procedures
- [ ] Manage room availability for scheduling integration
- [ ] Support custom operating hours per room
- [ ] Track multi-location rooms across clinic sites
- [ ] Maintain room notes and setup instructions
- [ ] Soft delete rooms to preserve history

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/rooms` | `room:read` | List rooms with filtering |
| GET | `/api/resources/rooms/:id` | `room:read` | Get room details |
| POST | `/api/resources/rooms` | `room:create` | Add new room |
| PUT | `/api/resources/rooms/:id` | `room:configure` | Update room |
| DELETE | `/api/resources/rooms/:id` | `room:delete` | Soft delete room |
| GET | `/api/resources/rooms/:id/equipment` | `room:read` | Get room equipment |
| GET | `/api/resources/rooms/types` | `room:read` | List room types |

---

## Data Model

```prisma
model Room {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId

  // Identification
  name            String
  roomNumber      String
  displayName     String?

  // Classification
  roomType        RoomType

  // Physical attributes
  squareFeet      Int?
  floorPlan       String?  // URL to floor plan image

  // Chair configuration
  hasChair        Boolean  @default(true)
  chairCount      Int      @default(1)

  // Status
  status          RoomStatus @default(ACTIVE)
  isAvailable     Boolean  @default(true)
  unavailableReason String?
  unavailableUntil DateTime?

  // Capabilities
  capabilities    String[]  // e.g., ["X-RAY", "ORTHO", "SCANNING"]
  supportedProcedures String[]  // Procedure codes this room can handle

  // Operating hours (if different from clinic)
  customHours     Json?

  // Notes
  notes           String?
  setupNotes      String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, roomNumber])
  @@index([clinicId])
  @@index([roomType])
  @@index([status])
}

enum RoomType {
  OPERATORY       // Standard treatment operatory
  TREATMENT_BAY   // Open bay treatment area
  CONSULTATION    // Consultation/case presentation
  X_RAY           // Radiographic imaging
  CBCT            // Cone beam CT room
  SCANNING        // Digital scanning room
  RECORDS         // Records/photography
  STERILIZATION   // Instrument processing
  LAB             // In-house lab
  STORAGE         // Storage/supplies
  RECEPTION       // Reception area
  WAITING         // Patient waiting area
  OFFICE          // Administrative office
  BREAK_ROOM      // Staff break room
  OTHER
}

enum RoomStatus {
  ACTIVE          // Fully operational
  MAINTENANCE     // Under maintenance
  CLEANING        // Being cleaned
  RENOVATION      // Major renovation
  CLOSED          // Permanently closed
  TEMPORARY_CLOSED // Temporarily unavailable
}
```

---

## Business Rules

- Room numbers must be unique within each clinic location
- Rooms with status other than ACTIVE cannot accept new appointment bookings
- Deleting a room with future appointments should be prevented or require confirmation
- Capabilities determine which appointment types can be scheduled in the room
- Custom operating hours override clinic default hours for scheduling
- Room type determines default capabilities and equipment suggestions

---

## Dependencies

**Depends On:**
- Auth & Authorization (user authentication, permissions)
- Clinic Management (rooms belong to clinics)

**Required By:**
- Chair Configuration (chairs exist within rooms)
- Equipment Assignment (equipment assigned to rooms)
- Room Scheduling (availability for bookings)
- Scheduling & Booking (room-based appointment scheduling)
- Practice Orchestration (patient flow through rooms)

---

## Notes

- Consider visual room layout editor for larger practices
- Room capabilities should be configurable per practice needs
- Integration with building management systems possible for future
- Room status changes should notify affected scheduled appointments
- Photo of room helpful for staff training and patient communication

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
