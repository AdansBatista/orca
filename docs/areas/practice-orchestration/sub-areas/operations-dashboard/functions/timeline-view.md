# Timeline View

> **Sub-Area**: [Operations Dashboard](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Timeline View provides an hour-by-hour schedule visualization showing appointment blocks organized by time and provider. It enables staff to see the day's flow at a glance, identify overlaps, and supports drag-and-drop rescheduling for quick schedule adjustments.

---

## Core Requirements

- [ ] Display appointment blocks arranged by time slots
- [ ] Color-code appointments by type
- [ ] Show provider columns for multi-provider view
- [ ] Display current time indicator
- [ ] Detect and highlight scheduling overlaps
- [ ] Support drag-and-drop rescheduling
- [ ] Show patient status (checked in, waiting, in chair)
- [ ] Zoom in/out on time scale (15min, 30min, 1hr increments)
- [ ] Quick appointment details on hover/click

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/dashboard/timeline/:date` | `ops:view_dashboard` | Get timeline data |
| PUT | `/api/v1/ops/flow/:appointmentId/reschedule` | `booking:modify_appointment` | Reschedule via drag-drop |
| GET | `/api/v1/ops/dashboard/timeline/:date/overlaps` | `ops:view_dashboard` | Get overlap warnings |

---

## Data Model

```typescript
interface TimelineViewData {
  date: Date;
  startHour: number;
  endHour: number;
  timeIncrement: 15 | 30 | 60;
  providers: TimelineProvider[];
  currentTime: Date;
  overlaps: ScheduleOverlap[];
}

interface TimelineProvider {
  providerId: string;
  providerName: string;
  color: string;
  appointments: TimelineAppointment[];
}

interface TimelineAppointment {
  id: string;
  patientName: string;
  patientId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  appointmentType: string;
  typeColor: string;
  status: FlowStage;
  chairId?: string;
  notes?: string;
}

interface ScheduleOverlap {
  providerId: string;
  appointments: string[];  // Overlapping appointment IDs
  overlapStart: Date;
  overlapEnd: Date;
  severity: 'warning' | 'error';
}
```

---

## Business Rules

- Default view shows 7 AM to 7 PM (configurable)
- Current time indicator updates every minute
- Drag-drop respects provider availability and conflicts
- Overlaps highlighted in red/orange based on severity
- Past appointments are not draggable
- Changes via drag-drop create audit log entry

---

## Dependencies

**Depends On:**
- [Day View Dashboard](./day-view-dashboard.md) - Day context
- [Booking & Scheduling](../../../../booking/) - Appointment data
- [Patient Flow](../../patient-flow/) - Current status

**Required By:**
- [Board View](./board-view.md) - Alternate view
- Front desk scheduling workflow

---

## Notes

- Use optimistic UI updates for responsive drag-drop
- Consider FullCalendar or similar library for implementation
- Show provider breaks and blocked time
- Mobile: single provider view with horizontal scroll

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
