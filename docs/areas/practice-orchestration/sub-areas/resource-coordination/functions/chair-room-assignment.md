# Chair/Room Assignment

> **Sub-Area**: [Resource Coordination](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Chair/Room Assignment manages the allocation of treatment chairs and rooms to appointments and patients. It provides real-time availability views, smart assignment suggestions, manual override capabilities, conflict detection, and blocking/unblocking of resources for maintenance or other reasons.

---

## Core Requirements

- [ ] Display real-time chair/room availability
- [ ] Provide smart assignment suggestions based on rules
- [ ] Support manual assignment override
- [ ] Detect and alert on assignment conflicts
- [ ] Enable blocking resources for maintenance/cleaning
- [ ] Support unblocking resources to return to service
- [ ] Consider patient/provider preferences in suggestions
- [ ] Track assignment history
- [ ] Support multi-resource assignments (chair + room)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/resources/status` | `ops:view_dashboard` | Get all resource statuses |
| GET | `/api/v1/ops/resources/:id/status` | `ops:view_dashboard` | Get single resource status |
| PUT | `/api/v1/ops/resources/:id/status` | `ops:assign_resources` | Update resource status |
| POST | `/api/v1/ops/resources/:id/assign` | `ops:assign_resources` | Assign to appointment |
| POST | `/api/v1/ops/resources/:id/release` | `ops:assign_resources` | Release from appointment |
| POST | `/api/v1/ops/resources/:id/block` | `ops:assign_resources` | Block resource |
| POST | `/api/v1/ops/resources/:id/unblock` | `ops:assign_resources` | Unblock resource |
| GET | `/api/v1/ops/resources/availability` | `ops:view_dashboard` | Get availability for time |

---

## Data Model

```prisma
model ResourceOccupancy {
  id              String          @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String          @db.ObjectId
  resourceId      String          @db.ObjectId

  status          OccupancyStatus
  appointmentId   String?         @db.ObjectId
  patientId       String?         @db.ObjectId

  occupiedAt      DateTime?
  expectedFreeAt  DateTime?

  blockReason     String?
  blockedBy       String?         @db.ObjectId
  blockedUntil    DateTime?

  updatedAt       DateTime        @updatedAt

  @@unique([clinicId, resourceId])
}

enum OccupancyStatus {
  AVAILABLE
  OCCUPIED
  BLOCKED
  MAINTENANCE
  CLEANING
}
```

---

## Business Rules

- Cannot assign occupied resources to another appointment
- Blocked resources excluded from smart suggestions
- Maintenance blocks persist until manually cleared
- Patient preference stored and prioritized in suggestions
- Provider preference secondary to patient preference
- Release auto-triggered when patient flow completes
- Cleaning status auto-releases after configurable duration
- All assignments logged for audit

---

## Dependencies

**Depends On:**
- [Resources Management](../../../../resources-management/) - Resource definitions
- [Patient Flow](../../patient-flow/) - Flow state triggers

**Required By:**
- [Call-to-Chair](../../patient-flow/functions/call-to-chair.md) - Chair assignment
- [Floor Plan View](../../operations-dashboard/functions/floor-plan-view.md) - Status display

---

## Notes

- Status colors: Green (available), Blue (occupied), Orange (blocked), Red (maintenance), Yellow (cleaning)
- Consider touch-friendly assignment interface for tablets
- Show time-in-status on occupied resources
- Alert when no resources available for upcoming appointments

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
