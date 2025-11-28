# Staff Assignment Management

> **Sub-Area**: [Resource Coordination](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Staff Assignment Management handles assigning staff members (providers, assistants, hygienists) to appointments and balancing workloads. It provides provider assignment, assistant pairing, workload visualization, skill-based matching, break scheduling coordination, and coverage gap detection.

---

## Core Requirements

- [ ] Assign providers to appointments
- [ ] Pair assistants/hygienists with providers
- [ ] Visualize staff workloads across the day
- [ ] Match staff skills to procedure requirements
- [ ] Coordinate break scheduling without gaps
- [ ] Detect coverage gaps and alert
- [ ] Support assignment changes and handoffs
- [ ] Track actual vs. planned assignments
- [ ] Respect staff schedule constraints

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/staff/assignments` | `ops:view_dashboard` | Get all assignments |
| GET | `/api/v1/ops/staff/assignments/:id` | `ops:view_dashboard` | Get assignment details |
| POST | `/api/v1/ops/staff/assignments` | `ops:assign_resources` | Create assignment |
| PUT | `/api/v1/ops/staff/assignments/:id` | `ops:assign_resources` | Update assignment |
| DELETE | `/api/v1/ops/staff/assignments/:id` | `ops:assign_resources` | Remove assignment |
| GET | `/api/v1/ops/staff/workload` | `ops:view_dashboard` | Get workload summary |
| GET | `/api/v1/ops/staff/gaps` | `ops:view_dashboard` | Get coverage gaps |
| GET | `/api/v1/ops/staff/availability` | `ops:view_dashboard` | Get available staff |

---

## Data Model

```prisma
model StaffAssignment {
  id              String          @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String          @db.ObjectId
  staffId         String          @db.ObjectId
  appointmentId   String          @db.ObjectId

  role            AssignmentRole
  isPrimary       Boolean         @default(true)

  assignedAt      DateTime        @default(now())
  assignedBy      String?         @db.ObjectId

  startTime       DateTime?
  endTime         DateTime?

  notes           String?

  @@index([clinicId, staffId])
  @@index([appointmentId])
}

enum AssignmentRole {
  PROVIDER
  ASSISTANT
  HYGIENIST
  COORDINATOR
}

// Workload tracking computed
type WorkloadSummary {
  staffId         String
  staffName       String
  role            String
  scheduledMinutes Int
  assignedCount   Int
  utilizationRate Float
  breakScheduled  Boolean
  nextAvailableAt DateTime?
}
```

---

## Business Rules

- Provider required for all treatment appointments
- Assistant pairing based on provider preference and skills
- Workload limits configurable per staff role
- Breaks must be scheduled; cannot assign during break
- Coverage gap = time with no provider for scheduled appointments
- Skill matching validates staff can perform procedure
- Handoffs logged with both staff IDs and timestamp
- Concurrent patient limits enforced per provider

---

## Dependencies

**Depends On:**
- [Staff Management](../../../../staff-management/) - Staff schedules and skills
- [Booking & Scheduling](../../../../booking/) - Appointment requirements

**Required By:**
- [Call-to-Chair](../../patient-flow/functions/call-to-chair.md) - Provider assignment
- [Utilization Tracking](./utilization-tracking.md) - Staff utilization

---

## Notes

- Workload heatmap visualization helpful
- Alert when staff approaching overtime
- Consider drag-and-drop assignment interface
- Show provider preference for assistant pairings

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
