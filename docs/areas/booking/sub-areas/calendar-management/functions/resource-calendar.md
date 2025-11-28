# Resource Calendar

> **Sub-Area**: [Calendar Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Resource Calendar provides calendar views organized by physical resources (chairs and rooms) rather than providers. This function helps staff visualize resource utilization, identify available chairs for booking, and manage equipment scheduling for appointments requiring specific resources.

---

## Core Requirements

- [ ] Display calendar with chairs as columns (resource view)
- [ ] Display calendar with rooms as columns for consultations/imaging
- [ ] Show equipment availability overlay on resource views
- [ ] Visualize resource utilization with color-coded indicators
- [ ] Detect and highlight resource conflicts
- [ ] Support multi-resource booking for complex appointments
- [ ] Search for available resources across date/time range
- [ ] Show resource details and capabilities on hover/click
- [ ] Filter by resource type, location, or capabilities

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/calendar/resources` | `booking:view_calendar` | Get resource-based calendar data |
| GET | `/api/booking/calendar/resources/chairs` | `booking:view_calendar` | Get chair calendar view |
| GET | `/api/booking/calendar/resources/rooms` | `booking:view_calendar` | Get room calendar view |
| GET | `/api/booking/calendar/resources/:id` | `booking:view_calendar` | Get single resource schedule |
| GET | `/api/booking/calendar/resources/:id/availability` | `booking:view_calendar` | Get resource availability slots |
| GET | `/api/booking/resources/search` | `booking:view_calendar` | Search available resources for time slot |

---

## Data Model

Uses existing models from Resources Management:
- `Chair` - Treatment chairs
- `Room` - Consultation/imaging rooms
- `Equipment` - Equipment items

Calendar data combines:
```typescript
interface ResourceCalendarEntry {
  resourceId: string;
  resourceType: 'chair' | 'room' | 'equipment';
  resourceName: string;
  location?: string;
  appointments: Appointment[];
  timeBlocks: TimeBlock[];
  utilization: number;  // Percentage 0-100
}

interface ResourceAvailability {
  resourceId: string;
  availableSlots: {
    start: DateTime;
    end: DateTime;
    duration: number;
  }[];
}
```

---

## Business Rules

- Resources filtered by clinicId for multi-clinic isolation
- Chairs marked as inactive or maintenance excluded from availability
- Utilization calculated as booked time / available time
- Resource conflicts prevent double-booking unless explicitly overridden
- Equipment availability considers maintenance schedules
- Multi-resource appointments block all assigned resources

---

## Dependencies

**Depends On:**
- [Calendar Views](./calendar-views.md) - Base calendar functionality
- [Resources Management](../../../../resources-management/) - Resource definitions
- [Equipment Management](../../../../resources-management/sub-areas/equipment-management/) - Equipment tracking

**Required By:**
- [Resource Scheduling](../../appointment-management/functions/resource-scheduling.md)
- [Appointment Booking](../../appointment-management/functions/appointment-booking.md)

---

## Notes

- Consider color-coding resources by utilization level (green/yellow/red)
- Show equipment requirements on appointment tooltips
- Mobile view may need horizontal scroll for resource columns
- Integrate with maintenance schedules from Resources Management

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
