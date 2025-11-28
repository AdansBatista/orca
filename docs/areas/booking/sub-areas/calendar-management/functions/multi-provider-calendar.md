# Multi-Provider Calendar

> **Sub-Area**: [Calendar Management](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Multi-Provider Calendar enables simultaneous viewing and management of appointment calendars for multiple orthodontists and staff members. This function provides side-by-side provider comparison, color-coded identification, and cross-provider availability views to help staff efficiently find and book appointments across the practice.

---

## Core Requirements

- [ ] Display multiple provider calendars in parallel columns or overlay mode
- [ ] Color-code appointments by provider for visual identification
- [ ] Filter calendar view by one or multiple providers
- [ ] Compare availability across providers to find optimal slots
- [ ] Quick-switch between single provider and multi-provider views
- [ ] Support provider grouping by location for multi-clinic practices
- [ ] Show provider status indicators (available, busy, out of office)
- [ ] Maintain real-time sync across all viewing users

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/booking/calendar` | `booking:view_calendar` | Get calendar data with provider filter |
| GET | `/api/booking/calendar/providers` | `booking:view_calendar` | List available providers for calendar |
| GET | `/api/booking/calendar/availability` | `booking:view_calendar` | Get availability across providers |
| GET | `/api/booking/providers/:id/schedule` | `booking:view_calendar` | Get single provider schedule details |

---

## Data Model

Uses existing models from Calendar Management:
- `ProviderSchedule` - Provider working hours and availability
- `TimeBlock` - Blocked time periods (lunch, meetings, vacation)
- `Appointment` - Scheduled appointments displayed on calendar

No new models required for this function.

---

## Business Rules

- Provider visibility respects clinic data isolation (clinicId filter)
- Users can only view providers within their assigned clinic(s)
- Provider color assignments persist per user preference
- Default view shows all active providers unless filtered
- Calendar updates propagate in real-time via WebSocket

---

## Dependencies

**Depends On:**
- [Auth & Authorization](../../../../auth/) - User authentication and clinic context
- [Staff Management](../../../../staff-management/) - Provider definitions and roles

**Required By:**
- [Appointment Booking](../../appointment-management/functions/appointment-booking.md)
- [Schedule Template Builder](./schedule-template-builder.md)

---

## Notes

- Consider using FullCalendar's resource view for multi-provider display
- Provider colors should be distinct and accessible (colorblind-friendly options)
- Mobile view may need to show one provider at a time with swipe navigation

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
