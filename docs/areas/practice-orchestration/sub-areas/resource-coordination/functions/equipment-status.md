# Equipment Status Tracking

> **Sub-Area**: [Resource Coordination](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Equipment Status Tracking monitors equipment availability and maintenance status within the clinic. It provides an equipment status board, maintenance scheduling integration, alerts for issues, usage tracking, calibration reminders, and service history access for operational visibility.

---

## Core Requirements

- [ ] Display equipment status board with all items
- [ ] Track operational/maintenance/out-of-service states
- [ ] Integrate with maintenance scheduling
- [ ] Alert on equipment issues reported by staff
- [ ] Track equipment usage per appointment/day
- [ ] Generate calibration and service reminders
- [ ] Access service history from status view
- [ ] Associate equipment with chairs/rooms
- [ ] Support quick issue reporting by clinical staff

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/equipment/status` | `ops:view_dashboard` | Get all equipment statuses |
| GET | `/api/v1/ops/equipment/:id/status` | `ops:view_dashboard` | Get single equipment status |
| PUT | `/api/v1/ops/equipment/:id/status` | `ops:assign_resources` | Update equipment status |
| POST | `/api/v1/ops/equipment/:id/report-issue` | `ops:manage_flow` | Report equipment issue |
| GET | `/api/v1/ops/equipment/:id/history` | `ops:view_dashboard` | Get service history |
| GET | `/api/v1/ops/equipment/reminders` | `ops:view_dashboard` | Get upcoming maintenance |

---

## Data Model

```prisma
model EquipmentStatus {
  id              String          @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String          @db.ObjectId
  equipmentId     String          @db.ObjectId

  status          EquipmentState
  lastCheckAt     DateTime?
  nextServiceDue  DateTime?

  currentIssue    String?
  issueReportedAt DateTime?
  issueReportedBy String?         @db.ObjectId
  issueSeverity   IssueSeverity?

  notes           String?
  updatedAt       DateTime        @updatedAt

  @@unique([clinicId, equipmentId])
}

enum EquipmentState {
  OPERATIONAL
  MAINTENANCE_DUE
  IN_MAINTENANCE
  OUT_OF_SERVICE
  DECOMMISSIONED
}

enum IssueSeverity {
  LOW       // Can continue use with caution
  MEDIUM    // Should be addressed soon
  HIGH      // Affects patient care
  CRITICAL  // Do not use
}
```

---

## Business Rules

- Equipment issues auto-escalate based on severity
- CRITICAL issues block resource from use
- Maintenance due warnings 7 days in advance (configurable)
- Service history retained indefinitely
- Issues must be resolved or acknowledged before clearing
- Daily equipment check reminder for clinical staff
- Out-of-service equipment excluded from availability

---

## Dependencies

**Depends On:**
- [Equipment Management](../../../../resources-management/sub-areas/equipment-management/) - Equipment definitions
- [Maintenance Scheduling](../../../../resources-management/sub-areas/equipment-management/functions/maintenance-scheduling.md) - Schedules

**Required By:**
- [Floor Plan View](../../operations-dashboard/functions/floor-plan-view.md) - Equipment overlay
- [Chair/Room Assignment](./chair-room-assignment.md) - Availability impact

---

## Notes

- Color-code by status (green/yellow/orange/red)
- Quick issue report button on equipment cards
- Consider QR codes on equipment for quick lookup
- Track equipment utilization for ROI analysis

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
