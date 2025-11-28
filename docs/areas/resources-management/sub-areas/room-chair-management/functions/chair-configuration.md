# Chair Configuration

> **Sub-Area**: [Room/Chair Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Chair Configuration manages individual treatment chairs within rooms, each with specific settings, equipment, and capabilities. In orthodontic practices with open bay configurations, multiple chairs may exist in a single room. Each chair can have specific equipment assignments (curing lights, bracket holders), provider preferences, and maintenance tracking. This enables efficient patient flow and personalized provider setups.

---

## Core Requirements

- [ ] Register chairs within rooms with unique identifiers
- [ ] Track chair status (active, in use, maintenance, out of service)
- [ ] Record chair condition (excellent, good, fair, poor)
- [ ] Store chair-specific configuration and settings
- [ ] Link chairs to preferred providers
- [ ] Define chair-specific capabilities
- [ ] Track position within room (for visual layout)
- [ ] Monitor chair maintenance schedules
- [ ] Support barcode identification for chair selection
- [ ] View chair utilization metrics

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/rooms/:roomId/chairs` | `room:read` | List chairs in room |
| GET | `/api/resources/chairs/:id` | `room:read` | Get chair details |
| POST | `/api/resources/rooms/:roomId/chairs` | `room:configure` | Add chair to room |
| PUT | `/api/resources/chairs/:id` | `room:configure` | Update chair |
| DELETE | `/api/resources/chairs/:id` | `room:configure` | Remove chair |
| POST | `/api/resources/chairs/:id/equipment` | `room:configure` | Assign equipment to chair |
| GET | `/api/resources/chairs/:id/utilization` | `room:read` | Get utilization metrics |

---

## Data Model

```prisma
model Chair {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  roomId          String   @db.ObjectId

  // Identification
  chairNumber     String
  name            String?
  barcode         String?

  // Status
  status          ChairStatus @default(ACTIVE)
  condition       ChairCondition @default(GOOD)

  // Configuration
  configuration   Json?    // Chair-specific settings
  preferredProviders String[] @db.ObjectId  // Providers who prefer this chair

  // Capabilities
  capabilities    String[] // Chair-specific capabilities

  // Position in room
  position        String?  // e.g., "Left", "Right", "Bay 1"
  positionOrder   Int?     // For ordering in UI

  // Maintenance
  lastMaintenanceDate DateTime?
  nextMaintenanceDate DateTime?

  // Notes
  notes           String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic @relation(fields: [clinicId], references: [id])
  room      Room   @relation(fields: [roomId], references: [id])

  @@unique([clinicId, roomId, chairNumber])
  @@index([clinicId])
  @@index([roomId])
  @@index([status])
}

enum ChairStatus {
  ACTIVE          // Available for use
  IN_USE          // Currently occupied
  MAINTENANCE     // Under maintenance
  OUT_OF_SERVICE  // Not usable
}

enum ChairCondition {
  EXCELLENT
  GOOD
  FAIR
  POOR
}
```

---

## Business Rules

- Chair numbers must be unique within each room
- Chairs belong to exactly one room
- Chairs with status other than ACTIVE cannot be assigned to appointments
- Preferred provider list is informational, not enforced
- Chair maintenance overdue should flag for attention
- Chair condition affects scheduling recommendations
- Deleting a chair with assigned equipment should move equipment to room level

---

## Dependencies

**Depends On:**
- Room Registry (chairs exist within rooms)
- Auth & Authorization (user authentication, permissions)

**Required By:**
- Equipment Assignment (equipment assigned to chairs)
- Scheduling & Booking (chair-level appointment booking)
- Practice Orchestration (patient assignment to chairs)

---

## Notes

- Configuration JSON can store provider-specific settings (chair height, light position, etc.)
- Consider "clone chair" functionality for similar setups
- Utilization tracking helps with resource planning
- Position display supports visual room layout
- Barcode scanning enables quick chair selection during patient check-in

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
