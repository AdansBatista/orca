# Resource Coordination

> **Sub-Area**: Resource Coordination
>
> **Area**: Practice Orchestration (2.3)
>
> **Purpose**: Manage chairs, rooms, equipment status, and staff assignments for optimal resource utilization and operational efficiency

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete (~85%) |
| **Priority** | High |
| **Complexity** | Medium |
| **Functions** | 4 |
| **Last Updated** | 2024-12-09 |

---

## Implementation Status

| Function | Status | Notes |
|----------|--------|-------|
| Chair/Room Assignment | ✅ Complete | ChairSelectionDialog, chair endpoints |
| Equipment Status Tracking | ⚠️ Not Implemented | Model not in schema |
| Staff Assignment Management | ✅ Complete | StaffAssignment model implemented |
| Utilization Tracking | 🔄 Partial | Metrics calculated, no reporting UI |

### Code Locations
- **Components:** `src/components/ops/ChairSelectionDialog.tsx`
- **API:** `src/app/api/ops/chairs/` - sub-stage, ready-for-doctor, block/unblock endpoints
- **API:** `src/app/api/ops/resources/status/` - Chair/room occupancy status
- **Models:** `ResourceOccupancy`, `StaffAssignment`, `ChairActivitySubStage` enum

---

## Overview

Resource Coordination ensures optimal utilization of clinic resources—treatment chairs, rooms, equipment, and staff. It provides real-time visibility into resource status, enables smart assignments, and tracks utilization metrics to support capacity planning.

### Key Capabilities

- Real-time chair/room status tracking
- Equipment maintenance monitoring
- Staff assignment and workload balancing
- Utilization metrics and reporting
- Capacity planning support
- Conflict detection and resolution

---

## Functions

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | [Chair/Room Assignment](./functions/chair-room-assignment.md) | Assign resources to appointments | Critical |
| 2 | [Equipment Status Tracking](./functions/equipment-status.md) | Monitor equipment availability | High |
| 3 | [Staff Assignment Management](./functions/staff-assignment.md) | Manage staff to appointment assignments | High |
| 4 | [Utilization Tracking](./functions/utilization-tracking.md) | Track and report resource usage | Medium |

---

## Function Details

### Chair/Room Assignment

Manage assignment of chairs and rooms to appointments.

**Key Features:**
- Real-time availability view
- Smart assignment suggestions
- Manual override capability
- Conflict detection
- Block/unblock resources
- Preference-based assignment

---

### Equipment Status Tracking

Monitor equipment availability and maintenance.

**Key Features:**
- Equipment status board
- Maintenance scheduling
- Alert on issues
- Usage tracking
- Calibration reminders
- Service history

---

### Staff Assignment Management

Assign staff to appointments and balance workloads.

**Key Features:**
- Provider assignment to appointments
- Assistant/hygienist pairing
- Workload visualization
- Skill-based matching
- Break scheduling
- Coverage gaps detection

---

### Utilization Tracking

Track and report on resource utilization.

**Key Features:**
- Chair utilization metrics
- Provider productivity
- Peak time analysis
- Downtime tracking
- Capacity planning data
- Trend reporting

---

## Data Model

### Prisma Schema

```prisma
model ResourceOccupancy {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  resourceId      String            @db.ObjectId

  // Current state
  status          OccupancyStatus
  appointmentId   String?           @db.ObjectId
  patientId       String?           @db.ObjectId

  // Timing
  occupiedAt      DateTime?
  expectedFreeAt  DateTime?

  // Blocking
  blockReason     String?
  blockedBy       String?           @db.ObjectId
  blockedUntil    DateTime?

  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  resource        Resource          @relation(fields: [resourceId], references: [id])

  @@unique([clinicId, resourceId])
}

model StaffAssignment {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  staffId         String            @db.ObjectId
  appointmentId   String            @db.ObjectId

  role            AssignmentRole    // PROVIDER, ASSISTANT, HYGIENIST
  isPrimary       Boolean           @default(true)

  assignedAt      DateTime          @default(now())
  assignedBy      String?           @db.ObjectId

  // Timing
  startTime       DateTime?
  endTime         DateTime?

  // Notes
  notes           String?

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  staff           Staff             @relation(fields: [staffId], references: [id])
  appointment     Appointment       @relation(fields: [appointmentId], references: [id])

  @@index([clinicId, staffId])
  @@index([appointmentId])
}

model EquipmentStatus {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  equipmentId     String            @db.ObjectId

  status          EquipmentState    // OPERATIONAL, MAINTENANCE, OUT_OF_SERVICE
  lastCheckAt     DateTime?
  nextServiceDue  DateTime?

  // Current issue
  currentIssue    String?
  issueReportedAt DateTime?
  issueReportedBy String?           @db.ObjectId

  // Notes
  notes           String?

  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  equipment       Equipment         @relation(fields: [equipmentId], references: [id])

  @@unique([clinicId, equipmentId])
}

model ResourceUtilization {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  resourceId      String            @db.ObjectId
  date            DateTime          @db.Date

  // Time metrics (minutes)
  availableMinutes Int
  usedMinutes     Int
  blockedMinutes  Int

  // Counts
  appointmentCount Int
  turnoverCount   Int               // Times resource changed patients

  // Calculated
  utilizationRate Float             // usedMinutes / availableMinutes

  createdAt       DateTime          @default(now())

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  resource        Resource          @relation(fields: [resourceId], references: [id])

  @@unique([clinicId, resourceId, date])
}

enum OccupancyStatus {
  AVAILABLE
  OCCUPIED
  BLOCKED
  MAINTENANCE
  CLEANING
}

enum AssignmentRole {
  PROVIDER
  ASSISTANT
  HYGIENIST
  COORDINATOR
}

enum EquipmentState {
  OPERATIONAL
  MAINTENANCE_DUE
  IN_MAINTENANCE
  OUT_OF_SERVICE
  DECOMMISSIONED
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ops/resources/status` | Get all resource statuses |
| GET | `/api/v1/ops/resources/:id/status` | Get single resource status |
| PUT | `/api/v1/ops/resources/:id/status` | Update resource status |
| POST | `/api/v1/ops/resources/:id/block` | Block resource |
| POST | `/api/v1/ops/resources/:id/unblock` | Unblock resource |
| GET | `/api/v1/ops/resources/availability` | Get availability for time range |
| GET | `/api/v1/ops/staff/assignments` | Get staff assignments |
| POST | `/api/v1/ops/staff/assignments` | Create assignment |
| PUT | `/api/v1/ops/staff/assignments/:id` | Update assignment |
| DELETE | `/api/v1/ops/staff/assignments/:id` | Remove assignment |
| GET | `/api/v1/ops/staff/workload` | Get staff workload summary |
| GET | `/api/v1/ops/equipment/status` | Get equipment statuses |
| PUT | `/api/v1/ops/equipment/:id/status` | Update equipment status |
| GET | `/api/v1/ops/utilization` | Get utilization metrics |
| GET | `/api/v1/ops/utilization/report` | Get utilization report |

---

## UI Components

| Component | Description |
|-----------|-------------|
| `ChairStatusBoard` | Grid of chair statuses |
| `ChairStatusCard` | Individual chair status |
| `ResourceAssignmentDialog` | Assign chair to appointment |
| `EquipmentStatusList` | Equipment status overview |
| `EquipmentStatusBadge` | Equipment state indicator |
| `StaffAssignmentPanel` | Staff to appointment assignments |
| `WorkloadHeatmap` | Staff workload visualization |
| `UtilizationChart` | Resource utilization charts |
| `BlockResourceDialog` | Block resource form |
| `MaintenanceScheduler` | Equipment maintenance calendar |

---

## Resource Status Colors

| Status | Color | Description |
|--------|-------|-------------|
| Available | Green | Ready for use |
| Occupied | Blue | Currently in use |
| Blocked | Orange | Temporarily unavailable |
| Maintenance | Red | Under maintenance |
| Cleaning | Yellow | Being cleaned/sanitized |

---

## Utilization Targets

| Resource Type | Target | Good | Needs Attention |
|---------------|--------|------|-----------------|
| Treatment Chair | 75% | 70-85% | <65% or >90% |
| Hygiene Chair | 80% | 75-85% | <70% or >90% |
| X-Ray Room | 50% | 40-60% | <30% or >70% |
| Consult Room | 40% | 30-50% | <20% or >60% |

*Targets are configurable per clinic*

---

## Business Rules

1. **Chair Assignment Required**: Cannot seat patient without chair assigned
2. **Provider Availability**: Can only assign available providers
3. **Skill Matching**: Procedures require qualified staff
4. **Block Protection**: Cannot schedule over blocked time
5. **Auto-Release**: Occupied status releases when patient departs
6. **Maintenance Priority**: Maintenance blocks override appointments
7. **Concurrent Limits**: Max patients per provider enforced

---

## Dependencies

- **Resources Management**: Master resource data
- **Staff Management**: Staff schedules and skills
- **Patient Flow Management**: Real-time occupancy updates
- **Booking & Scheduling**: Appointment requirements

---

## Related Documentation

- [Practice Orchestration Overview](../../README.md)
- [Operations Dashboard](../operations-dashboard/)
- [Patient Flow Management](../patient-flow/)
- [Resources Management](../../resources-management/)
