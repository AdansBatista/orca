# Calendar Views

> **Sub-Area**: [Calendar Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Calendar Views provides multiple calendar perspectives (day, week, month, agenda) for different use cases and user preferences. This function enables staff to visualize appointments at different time scales, switch between views efficiently, and print calendar layouts for offline reference.

---

## Core Requirements

- [ ] Day view showing time slots with appointments
- [ ] Week view displaying multiple days side-by-side
- [ ] Month view with appointment counts and status indicators
- [ ] Agenda/list view for quick scanning of upcoming appointments
- [ ] Timeline view for resource planning across longer periods
- [ ] Configurable zoom levels (15min, 30min, 1hr time increments)
- [ ] Print-friendly layouts for all view types
- [ ] Mobile-responsive design adapting to screen size
- [ ] Keyboard navigation support for accessibility
- [ ] Quick date navigation (today, next/prev, date picker)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/calendar/day/:date` | `booking:view_calendar` | Get day view data |
| GET | `/api/booking/calendar/week/:date` | `booking:view_calendar` | Get week view data (7 days starting from date) |
| GET | `/api/booking/calendar/month/:year/:month` | `booking:view_calendar` | Get month view data |
| GET | `/api/booking/calendar/agenda` | `booking:view_calendar` | Get agenda list of appointments |
| GET | `/api/booking/calendar/range` | `booking:view_calendar` | Get appointments for custom date range |
| PUT | `/api/users/:id/preferences/calendar` | `user:update_self` | Save user's calendar view preferences |

---

## Data Model

No new models required. Uses:
- `Appointment` - Appointments to display
- `TemplateSlot` - Available booking slots
- `TimeBlock` - Blocked time periods

User preferences stored in user settings:
```typescript
interface CalendarPreferences {
  defaultView: 'day' | 'week' | 'month' | 'agenda';
  timeIncrement: 15 | 30 | 60;
  startHour: number;  // Default start hour for day view
  endHour: number;    // Default end hour for day view
  showWeekends: boolean;
  showTemplateSlots: boolean;
  compactMode: boolean;
}
```

---

## Business Rules

- Default view determined by user preference or clinic default
- Day view defaults to 7 AM - 7 PM, adjustable per user
- Week view shows Monday-Friday by default; weekends optional
- Month view shows appointment counts; clicking opens day view
- Agenda view shows next 14 days by default
- Print views exclude navigation and action buttons
- All views respect provider/resource filters

---

## Dependencies

**Depends On:**
- [Multi-Provider Calendar](./multi-provider-calendar.md) - Provider filtering
- [Auth & Authorization](../../../../auth/) - User preferences storage

**Required By:**
- [Appointment Booking](../../appointment-management/functions/appointment-booking.md)
- [Resource Calendar](./resource-calendar.md)

---

## Notes

- FullCalendar library recommended for core calendar functionality
- Ensure consistent styling across all views
- Consider lazy loading for month view with many appointments
- Mobile: day view as default, swipe for date navigation

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
