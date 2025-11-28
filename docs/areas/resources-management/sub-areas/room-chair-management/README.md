# Room/Chair Management

> **Area**: [Resources Management](../../)
>
> **Sub-Area**: 3.2 Room/Chair Management
>
> **Purpose**: Manage treatment operatories, chairs, room configurations, and equipment assignments

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Medium |
| **Parent Area** | [Resources Management](../../) |
| **Dependencies** | Auth, Equipment Management |
| **Last Updated** | 2024-11-27 |

---

## Overview

Room/Chair Management handles the configuration and tracking of treatment operatories, consultation rooms, and specialized areas within an orthodontic practice. Each room has specific capabilities and equipment configurations that determine which procedures can be performed and how patient flow is optimized.

Orthodontic practices typically have multiple treatment chairs in open bay configurations, with specific equipment assigned to each chair (curing lights, bracket holders, hand instruments). This sub-area ensures rooms are properly configured, maintained, and scheduled for optimal patient throughput.

### Key Capabilities

- Room and operatory registry with categorization
- Chair configuration and equipment assignment
- Room capability tracking for procedure matching
- Room availability and scheduling integration
- Setup templates for different procedure types
- Maintenance status tracking and scheduling impact
- Visual room layout management

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 3.2.1 | [Room Registry](./functions/room-registry.md) | Maintain list of rooms/operatories | 📋 Planned | Critical |
| 3.2.2 | [Chair Configuration](./functions/chair-configuration.md) | Configure chair-specific settings | 📋 Planned | High |
| 3.2.3 | [Equipment Assignment](./functions/equipment-assignment.md) | Assign equipment to rooms | 📋 Planned | High |
| 3.2.4 | [Room Scheduling](./functions/room-scheduling.md) | Manage room availability | 📋 Planned | High |
| 3.2.5 | [Setup Templates](./functions/setup-templates.md) | Define room setup checklists | 📋 Planned | Medium |

---

## Function Details

### 3.2.1 Room Registry

**Purpose**: Maintain a comprehensive registry of all rooms and operatories in the practice.

**Key Capabilities**:
- Register rooms with unique identifiers and names
- Categorize rooms by type (operatory, consultation, X-ray, sterilization, etc.)
- Track room status (active, maintenance, closed)
- Record room dimensions and layout information
- Manage room capabilities and features
- Support multi-location room tracking

**Room Types in Orthodontics**:
| Type | Description | Typical Equipment |
|------|-------------|-------------------|
| Treatment Bay | Open bay with treatment chairs | Chair, delivery unit, curing light, hand instruments |
| Private Operatory | Enclosed treatment room | Full dental chair setup, additional privacy |
| Consultation Room | Patient/parent consultations | Computer, display screen, seating |
| X-Ray Room | Radiographic imaging | Panoramic, cephalometric, or CBCT machines |
| Scanning Room | Digital impressions | Intraoral scanner, computer workstation |
| Records Room | Patient records/photos | Camera setup, photography equipment |
| Sterilization | Instrument processing | Autoclaves, ultrasonic cleaners, storage |
| Lab | In-house lab work | 3D printer, milling machine, lab bench |

**User Stories**:
- As a **clinic admin**, I want to add new rooms as we expand our practice
- As a **front desk**, I want to see which rooms are available for scheduling
- As a **clinic admin**, I want to mark a room as under maintenance to prevent bookings

---

### 3.2.2 Chair Configuration

**Purpose**: Configure individual treatment chairs with their specific settings and capabilities.

**Key Capabilities**:
- Track chair-specific equipment (curing lights, bracket holders)
- Record chair settings and preferences
- Link chairs to specific treatment types
- Track chair utilization and usage patterns
- Manage chair maintenance schedules
- Support doctor/provider chair preferences

**Orthodontic Chair Configuration**:
- Bracket holders and organizers
- Wire selection trays
- Curing light specifications
- Handpiece attachments
- Suction and air configurations
- Patient comfort accessories

**User Stories**:
- As a **clinical staff**, I want to see what equipment is assigned to a specific chair
- As a **doctor**, I want my preferred chair configuration when I'm treating patients
- As a **clinic admin**, I want to track which chairs are most heavily utilized

---

### 3.2.3 Equipment Assignment

**Purpose**: Assign and track equipment assigned to specific rooms or chairs.

**Key Capabilities**:
- Assign equipment from catalog to rooms/chairs
- Track assignment history
- Handle equipment moves between rooms
- View all equipment in a room at a glance
- Link to equipment maintenance status
- Alert when room equipment needs service

**User Stories**:
- As a **clinic admin**, I want to assign a new curing light to operatory 3
- As a **clinical staff**, I want to see if any equipment in a room needs maintenance
- As a **clinic admin**, I want to move equipment between rooms and track the change

---

### 3.2.4 Room Scheduling

**Purpose**: Manage room availability and integrate with appointment scheduling.

**Key Capabilities**:
- Set room operating hours
- Block rooms for maintenance or cleaning
- View room availability calendar
- Integrate with appointment scheduling
- Handle room conflicts and double-booking prevention
- Support room-specific appointment types

**User Stories**:
- As a **front desk**, I want to see which operatories are available for a specific time
- As a **clinic admin**, I want to block a room for equipment maintenance next week
- As a **scheduler**, I want to book the X-ray room for a new patient consultation

---

### 3.2.5 Setup Templates

**Purpose**: Define standard room setups for different procedure types.

**Key Capabilities**:
- Create setup checklists per procedure type
- Define required equipment for procedures
- Track setup completion status
- Generate setup sheets for staff
- Link templates to appointment types
- Support custom templates per room

**Common Orthodontic Setups**:
| Procedure Type | Setup Requirements |
|----------------|-------------------|
| Bonding | Brackets, bonding agent, curing light, etchant, primer |
| Adjustment | Wire cutters, pliers set, elastics, wires |
| Debonding | Debonding pliers, polishing supplies, retainer impression |
| Records | Camera, cheek retractors, bite blocks, mirrors |
| Scan | Intraoral scanner, powder (if needed), scanning tips |

**User Stories**:
- As a **clinical staff**, I want a checklist for setting up a bonding appointment
- As a **clinic admin**, I want to create a standard setup template for adjustment visits
- As a **clinical staff**, I want to verify the room is properly set up before the patient arrives

---

## Data Model

```prisma
model Room {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Identification
  name          String
  roomNumber    String
  displayName   String?

  // Classification
  roomType      RoomType

  // Physical attributes
  squareFeet    Int?
  floorPlan     String?  // URL to floor plan image

  // Configuration
  hasChair      Boolean  @default(true)
  chairCount    Int      @default(1)

  // Status
  status        RoomStatus @default(ACTIVE)
  isAvailable   Boolean  @default(true)
  unavailableReason String?
  unavailableUntil DateTime?

  // Capabilities
  capabilities  String[]  // e.g., ["X-RAY", "ORTHO", "SCANNING", "CBCT"]
  supportedProcedures String[]  // Procedure codes this room can handle

  // Operating hours (if different from clinic)
  customHours   Json?

  // Notes
  notes         String?
  setupNotes    String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Audit
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  chairs        Chair[]
  equipment     Equipment[]
  roomEquipment RoomEquipment[]
  scheduleBlocks RoomScheduleBlock[]
  setupTemplates RoomSetupTemplate[]

  @@unique([clinicId, roomNumber])
  @@index([clinicId])
  @@index([roomType])
  @@index([status])
}

enum RoomType {
  OPERATORY
  TREATMENT_BAY
  CONSULTATION
  X_RAY
  CBCT
  SCANNING
  RECORDS
  STERILIZATION
  LAB
  STORAGE
  RECEPTION
  WAITING
  OFFICE
  BREAK_ROOM
  OTHER
}

enum RoomStatus {
  ACTIVE
  MAINTENANCE
  CLEANING
  RENOVATION
  CLOSED
  TEMPORARY_CLOSED
}

model Chair {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  roomId        String   @db.ObjectId

  // Identification
  chairNumber   String
  name          String?
  barcode       String?

  // Status
  status        ChairStatus @default(ACTIVE)
  condition     ChairCondition @default(GOOD)

  // Configuration
  configuration Json?  // Chair-specific settings
  preferredProviders String[]  @db.ObjectId  // Providers who prefer this chair

  // Capabilities
  capabilities  String[]  // Chair-specific capabilities

  // Position in room
  position      String?  // e.g., "Left", "Right", "Bay 1"
  positionOrder Int?     // For ordering in UI

  // Maintenance
  lastMaintenanceDate DateTime?
  nextMaintenanceDate DateTime?

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  room          Room      @relation(fields: [roomId], references: [id])
  chairEquipment ChairEquipment[]

  @@unique([clinicId, roomId, chairNumber])
  @@index([clinicId])
  @@index([roomId])
  @@index([status])
}

enum ChairStatus {
  ACTIVE
  IN_USE
  MAINTENANCE
  OUT_OF_SERVICE
}

enum ChairCondition {
  EXCELLENT
  GOOD
  FAIR
  POOR
}

model RoomEquipment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  roomId        String   @db.ObjectId
  equipmentId   String   @db.ObjectId

  // Assignment details
  assignedDate  DateTime @default(now())
  assignedBy    String   @db.ObjectId

  // Position
  location      String?  // Where in the room

  // Status
  isPrimary     Boolean  @default(true)  // Primary vs backup

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  room          Room      @relation(fields: [roomId], references: [id])
  equipment     Equipment @relation(fields: [equipmentId], references: [id])

  @@unique([roomId, equipmentId])
  @@index([clinicId])
  @@index([roomId])
  @@index([equipmentId])
}

model ChairEquipment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  chairId       String   @db.ObjectId
  equipmentId   String   @db.ObjectId

  // Assignment details
  assignedDate  DateTime @default(now())
  assignedBy    String   @db.ObjectId

  // Notes
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  chair         Chair     @relation(fields: [chairId], references: [id])
  equipment     Equipment @relation(fields: [equipmentId], references: [id])

  @@unique([chairId, equipmentId])
  @@index([clinicId])
  @@index([chairId])
  @@index([equipmentId])
}

model RoomScheduleBlock {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  roomId        String   @db.ObjectId

  // Block details
  blockType     RoomBlockType
  startDateTime DateTime
  endDateTime   DateTime
  isAllDay      Boolean  @default(false)
  isRecurring   Boolean  @default(false)
  recurrenceRule String?  // RRULE format

  // Reason
  reason        String?
  notes         String?

  // Timestamps
  createdAt DateTime @default(now())
  createdBy String   @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  room          Room      @relation(fields: [roomId], references: [id])

  @@index([clinicId])
  @@index([roomId])
  @@index([startDateTime])
}

enum RoomBlockType {
  MAINTENANCE
  CLEANING
  EQUIPMENT_SERVICE
  STAFF_MEETING
  TRAINING
  CLOSED
  OTHER
}

model RoomSetupTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  roomId        String?  @db.ObjectId  // null for clinic-wide templates

  // Template details
  name          String
  procedureType String?  // Link to appointment/procedure type
  description   String?

  // Checklist
  checklistItems Json  // Array of checklist items with categories

  // Status
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic        Clinic    @relation(fields: [clinicId], references: [id])
  room          Room?     @relation(fields: [roomId], references: [id])

  @@index([clinicId])
  @@index([roomId])
  @@index([procedureType])
}
```

---

## API Endpoints

### Rooms

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/rooms` | List rooms | `room:read` |
| GET | `/api/resources/rooms/:id` | Get room details | `room:read` |
| POST | `/api/resources/rooms` | Add room | `room:create` |
| PUT | `/api/resources/rooms/:id` | Update room | `room:configure` |
| DELETE | `/api/resources/rooms/:id` | Delete room (soft) | `room:delete` |
| GET | `/api/resources/rooms/:id/equipment` | Get room equipment | `room:read` |
| POST | `/api/resources/rooms/:id/equipment` | Assign equipment | `room:configure` |
| DELETE | `/api/resources/rooms/:id/equipment/:equipmentId` | Remove equipment | `room:configure` |

### Chairs

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/rooms/:roomId/chairs` | List chairs in room | `room:read` |
| GET | `/api/resources/chairs/:id` | Get chair details | `room:read` |
| POST | `/api/resources/rooms/:roomId/chairs` | Add chair | `room:configure` |
| PUT | `/api/resources/chairs/:id` | Update chair | `room:configure` |
| DELETE | `/api/resources/chairs/:id` | Delete chair | `room:configure` |
| POST | `/api/resources/chairs/:id/equipment` | Assign equipment | `room:configure` |

### Room Scheduling

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/rooms/:id/availability` | Get room availability | `room:read` |
| GET | `/api/resources/rooms/:id/schedule` | Get room schedule | `room:read` |
| POST | `/api/resources/rooms/:id/block` | Block room time | `room:schedule` |
| PUT | `/api/resources/rooms/blocks/:blockId` | Update block | `room:schedule` |
| DELETE | `/api/resources/rooms/blocks/:blockId` | Remove block | `room:schedule` |

### Setup Templates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/resources/setup-templates` | List templates | `room:read` |
| GET | `/api/resources/setup-templates/:id` | Get template | `room:read` |
| POST | `/api/resources/setup-templates` | Create template | `room:configure` |
| PUT | `/api/resources/setup-templates/:id` | Update template | `room:configure` |
| DELETE | `/api/resources/setup-templates/:id` | Delete template | `room:configure` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `RoomList` | List/filter rooms | `components/resources/rooms/` |
| `RoomDetail` | Room details with equipment | `components/resources/rooms/` |
| `RoomForm` | Add/edit room | `components/resources/rooms/` |
| `RoomCard` | Summary card for room | `components/resources/rooms/` |
| `RoomLayoutEditor` | Visual room layout | `components/resources/rooms/` |
| `ChairList` | List chairs in room | `components/resources/rooms/` |
| `ChairDetail` | Chair details view | `components/resources/rooms/` |
| `ChairForm` | Add/edit chair | `components/resources/rooms/` |
| `EquipmentAssignment` | Assign equipment to room/chair | `components/resources/rooms/` |
| `RoomAvailabilityCalendar` | Room schedule view | `components/resources/rooms/` |
| `RoomBlockForm` | Block room time | `components/resources/rooms/` |
| `SetupTemplateList` | List setup templates | `components/resources/rooms/` |
| `SetupTemplateEditor` | Create/edit template | `components/resources/rooms/` |
| `SetupChecklist` | Interactive setup checklist | `components/resources/rooms/` |
| `RoomStatusBadge` | Room status indicator | `components/resources/rooms/` |

---

## Business Rules

1. **Unique Room Numbers**: Room numbers must be unique within each clinic location
2. **Chair Assignment**: Chairs must belong to exactly one room
3. **Equipment Assignment**: Equipment can be assigned to a room or specific chair, not both simultaneously
4. **Capability Validation**: Appointments can only be scheduled in rooms with required capabilities
5. **Status Impact**: Rooms with status other than ACTIVE cannot accept new bookings
6. **Block Validation**: Schedule blocks cannot overlap for the same room
7. **Template Defaults**: Only one template can be marked as default per procedure type
8. **Maintenance Cascade**: Room maintenance status should reflect equipment maintenance needs

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Auth & User Management | Required | User authentication and permissions |
| Equipment Management | Required | Equipment catalog for assignments |
| Scheduling & Booking | Optional | Appointment integration |
| Practice Orchestration | Optional | Patient flow integration |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| None | - | No external system dependencies |

---

## Related Documentation

- [Parent: Resources Management](../../)
- [Equipment Management](../equipment-management/)
- [Scheduling & Booking](../../scheduling-booking/) - Room scheduling integration
- [Practice Orchestration](../../practice-orchestration/) - Patient flow

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
