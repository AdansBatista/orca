# Floor Plan View

> **Sub-Area**: [Operations Dashboard](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Floor Plan View provides a visual representation of the clinic's physical space showing real-time room and chair occupancy. It displays the layout diagram with color-coded status indicators, patient information on click, equipment status overlays, and maintenance indicators.

---

## Core Requirements

- [ ] Display configurable room/chair layout diagram
- [ ] Show real-time occupancy status with color coding
- [ ] Support click/tap for patient and appointment details
- [ ] Overlay equipment status on resources
- [ ] Display maintenance indicators
- [ ] Enable floor plan editor for layout configuration
- [ ] Support multiple floors/areas
- [ ] Show provider assignments per resource
- [ ] Refresh automatically in real-time

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/dashboard/floorplan` | `ops:view_dashboard` | Get floor plan data |
| GET | `/api/v1/ops/dashboard/floorplan/layout` | `ops:view_dashboard` | Get floor plan layout |
| PUT | `/api/v1/ops/dashboard/floorplan/layout` | `ops:configure` | Update layout |
| GET | `/api/v1/ops/resources/:id/details` | `ops:view_dashboard` | Get resource details |

---

## Data Model

```typescript
interface FloorPlanData {
  layout: FloorPlanLayout;
  resources: FloorPlanResource[];
  lastUpdated: Date;
}

interface FloorPlanLayout {
  width: number;
  height: number;
  backgroundImage?: string;
  areas: FloorPlanArea[];
}

interface FloorPlanArea {
  id: string;
  name: string;
  type: 'treatment' | 'waiting' | 'xray' | 'consult' | 'sterilization' | 'other';
  x: number;
  y: number;
  width: number;
  height: number;
  resources: string[];  // Resource IDs in this area
}

interface FloorPlanResource {
  resourceId: string;
  resourceType: 'chair' | 'room';
  name: string;
  x: number;
  y: number;
  rotation: number;
  status: OccupancyStatus;
  patient?: {
    id: string;
    name: string;
    appointmentType: string;
    provider: string;
    timeInChair: number;
  };
  equipment?: EquipmentStatus[];
  maintenanceAlert?: boolean;
}

interface EquipmentStatus {
  equipmentId: string;
  name: string;
  status: 'operational' | 'issue' | 'maintenance';
}
```

---

## Business Rules

- Status colors: Green (available), Blue (occupied), Orange (blocked), Red (maintenance)
- Patient info only visible to authorized roles
- Layout changes require clinic admin permission
- Equipment alerts overlay on associated resources
- Auto-refresh every 10 seconds
- Support for multiple clinic locations

---

## Dependencies

**Depends On:**
- [Resource Coordination](../../resource-coordination/) - Resource status
- [Resources Management](../../../../resources-management/) - Resource definitions
- [Equipment Management](../../../../resources-management/sub-areas/equipment-management/) - Equipment status

**Required By:**
- [Day View Dashboard](./day-view-dashboard.md) - Widget option
- Office manager workflow

---

## Notes

- Consider drag-and-drop floor plan editor for initial setup
- SVG-based rendering for scalability
- Touch-friendly for large displays in clinical areas
- Privacy mode for patient-visible displays (no names)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
