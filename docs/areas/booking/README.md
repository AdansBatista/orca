# Booking & Scheduling

> **Area**: Booking & Scheduling
>
> **Phase**: 2 - Core Operations
>
> **Purpose**: Manage appointment scheduling, calendar operations, schedule templates, and patient booking workflows

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 🔄 In Progress (Phase 2 Complete) |
| **Priority** | Critical |
| **Phase** | 2 - Core Operations |
| **Dependencies** | Phase 1 (Auth, Staff, Resources) |
| **Last Updated** | 2024-11-26 |

---

## Overview

The Booking & Scheduling area is the operational heart of Orca, managing all aspects of appointment scheduling for orthodontic practices. This includes calendar management, appointment booking, schedule templates, waitlist management, and automated reminder systems.

### Key Capabilities

- **Calendar Management**: Multi-provider calendars with day/week/month views and resource-based scheduling
- **Schedule Templates**: Pre-configured day and week templates with color-coded appointment slots
- **Appointment Management**: Full appointment lifecycle from booking to completion with recurring support
- **Waitlist & Recovery**: Manage waitlists, fill cancellations, and recover failed appointments
- **Emergency & Reminders**: Handle emergency appointments, on-call scheduling, and automated reminders

### Business Value

- Maximize chair utilization through intelligent scheduling
- Reduce scheduling conflicts and double-bookings
- Improve patient experience with convenient booking options
- Minimize no-shows through automated reminders
- Fill cancellations quickly through waitlist management
- Standardize scheduling through configurable templates

---

## Sub-Areas

| # | Sub-Area | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 1 | [Calendar Management](./sub-areas/calendar-management/) | Calendar views, schedule templates, visual scheduling | ✅ Phase 1 Complete | Critical |
| 2 | [Appointment Management](./sub-areas/appointment-management/) | Appointment booking, types, recurring appointments | ✅ Phase 1 Complete | Critical |
| 3 | [Waitlist & Recovery](./sub-areas/waitlist-recovery/) | Waitlist management, failed appointment recovery | ✅ MVP Complete | High |
| 4 | [Emergency & Reminders](./sub-areas/emergency-reminders/) | Emergency handling, on-call, automated reminders | ✅ MVP Complete | High |

---

## Sub-Area Details

### 1. Calendar Management

Manage calendar views, schedule templates, and visual scheduling interfaces.

**Functions:**
- Multi-Provider Calendar
- Schedule Template Builder
- Template Application Engine
- Calendar Views (Day/Week/Month)
- Resource Calendar (Chairs/Rooms)
- Template Analytics

**Key Features:**
- Color-coded appointment slots by type
- Drag-and-drop template design
- Multi-location template sharing
- AI-powered template optimization suggestions
- Visual density indicators for booking load

---

### 2. Appointment Management

Handle the complete appointment lifecycle from booking to completion.

**Functions:**
- Appointment Booking
- Appointment Type Configuration
- Recurring Appointments
- Appointment Status Management
- Resource Scheduling
- Scheduling Intelligence

**Key Features:**
- Smart slot matching based on appointment type
- Conflict detection and prevention
- Buffer time management
- Overbooking prevention with capacity limits
- Template-aware scheduling suggestions

---

### 3. Waitlist & Recovery

Manage patient waitlists and recover from failed appointments.

**Functions:**
- Waitlist Management
- Last-Minute Opening Notifications
- Failed Appointment Recovery
- Cancellation Tracking
- Re-booking Workflows
- At-Risk Patient Identification

**Key Features:**
- Automatic outreach for missed appointments
- Smart slot filling from waitlist
- Cancellation reason capture and analysis
- Re-engagement campaigns for inactive patients
- No-show fee tracking

---

### 4. Emergency & Reminders

Handle emergency appointments, on-call scheduling, and automated reminders.

**Functions:**
- Emergency Appointment Handling
- On-Call Schedule Management
- Appointment Reminders (SMS/Email)
- Appointment Confirmations
- After-Hours Contact Routing
- Emergency Triage Workflows

**Key Features:**
- Multi-channel reminders (SMS, email, voice)
- Configurable reminder sequences
- Emergency slot reservations in templates
- After-hours patient communication
- Common emergency protocols (broken bracket, poking wire)

---

## Integration Points

### Internal Integrations

| Area | Integration | Purpose |
|------|-------------|---------|
| Staff Management | Provider schedules, availability | Know who can see patients when |
| Resources Management | Chair/room availability | Allocate physical resources |
| Practice Orchestration | Patient flow, check-in | Real-time appointment tracking |
| Patient Communications | Reminders, confirmations | Send booking communications |
| Treatment Management | Procedure durations | Determine appointment length |
| CRM & Onboarding | New patient bookings | Initial consultation scheduling |
| Billing & Insurance | No-show fees | Track and bill failed appointments |

### External Integrations

| System | Integration Type | Purpose |
|--------|------------------|---------|
| SMS Gateway (Twilio) | API | Send appointment reminders |
| Email Service | API | Email confirmations and reminders |
| Google Calendar | Sync | Patient calendar integration |
| Apple Calendar | Sync | Patient calendar integration |

---

## User Roles & Permissions

| Role | Calendar View | Book Appointments | Manage Templates | Emergency |
|------|---------------|-------------------|------------------|-----------|
| Super Admin | Full | Full | Full | Full |
| Clinic Admin | Full | Full | Full | Full |
| Doctor | Full | Full | View | Full |
| Clinical Staff | Full | Edit | None | Edit |
| Front Desk | Full | Full | View | Edit |
| Billing | View | View | None | None |
| Read Only | View | None | None | None |

### Special Permissions

| Permission | Description | Default Roles |
|------------|-------------|---------------|
| `booking:view_calendar` | View calendar and appointments | All roles |
| `booking:create_appointment` | Create new appointments | front_desk, clinical_staff, doctor, clinic_admin |
| `booking:modify_appointment` | Modify existing appointments | front_desk, clinical_staff, doctor, clinic_admin |
| `booking:cancel_appointment` | Cancel appointments | front_desk, doctor, clinic_admin |
| `booking:manage_templates` | Create and manage schedule templates | clinic_admin |
| `booking:apply_templates` | Apply templates to calendar | clinic_admin, front_desk |
| `booking:manage_waitlist` | Manage waitlist entries | front_desk, clinic_admin |
| `booking:handle_emergency` | Handle emergency appointments | front_desk, clinical_staff, doctor, clinic_admin |
| `booking:view_analytics` | View scheduling analytics | clinic_admin, doctor |
| `booking:manage_reminders` | Configure reminder settings | clinic_admin |

---

## Data Models

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Provider     │────▶│ ProviderSchedule│────▶│   TimeBlock     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ScheduleTemplate │────▶│  TemplateSlot   │────▶│ AppointmentType │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Patient      │────▶│   Appointment   │◀────│    Resource     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │AppointmentReminder│
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  WaitlistEntry  │────▶│    Patient      │
└─────────────────┘     └─────────────────┘
```

### Key Models

| Model | Description |
|-------|-------------|
| `Appointment` | Scheduled patient appointment |
| `AppointmentType` | Types of appointments (Scan, Adjustment, etc.) |
| `ScheduleTemplate` | Reusable day/week schedule templates |
| `TemplateSlot` | Individual slots within a template |
| `ProviderSchedule` | Provider availability and working hours |
| `TimeBlock` | Blocked time (lunch, meetings, vacation) |
| `WaitlistEntry` | Patient on waitlist for appointments |
| `AppointmentReminder` | Scheduled reminder for appointment |
| `RecurringAppointment` | Series configuration for recurring appointments |
| `EmergencyContact` | On-call and emergency contact information |

---

## AI Features

| Feature | Sub-Area | Description |
|---------|----------|-------------|
| Template Optimization | Calendar Management | Suggest optimal template configurations based on usage patterns |
| Smart Scheduling | Appointment Management | AI-powered appointment slot recommendations |
| No-Show Prediction | Waitlist & Recovery | Predict likelihood of appointment no-shows |
| Waitlist Prioritization | Waitlist & Recovery | Prioritize waitlist based on urgency and availability |
| Reminder Optimization | Emergency & Reminders | Optimize reminder timing for maximum confirmation rate |
| Capacity Forecasting | Calendar Management | Predict booking demand for staffing decisions |

---

## Compliance Requirements

### HIPAA Compliance
- Appointment information linked to patient PHI must follow PHI handling rules
- Audit logging required for all appointment access
- Access control enforcement on schedule data

### Accessibility
- Calendar interfaces must be keyboard navigable
- Screen reader support for appointment information
- Color coding must have non-color alternatives

### Patient Communication
- SMS opt-in/opt-out compliance (TCPA)
- Unsubscribe options for email reminders
- Communication preference tracking

---

## Implementation Notes

### Phase 2 Dependencies
- **Phase 1 Complete**: Auth, Staff Management, Resources Management
- Staff schedules and availability must exist
- Resource (chairs/rooms) definitions must be in place

### Implementation Order
1. Calendar Management (foundation for all scheduling)
2. Appointment Management (core booking functionality)
3. Emergency & Reminders (patient communication)
4. Waitlist & Recovery (optimization and recovery)

### Key Technical Decisions
- Use FullCalendar or similar for calendar UI
- Implement optimistic updates for drag-and-drop
- Use WebSockets for real-time calendar updates across users
- Implement timezone handling for multi-location practices
- Use Twilio or similar for SMS reminders

---

## File Structure

```
docs/areas/booking/
├── README.md                      # This file (area overview)
└── sub-areas/
    ├── calendar-management/
    │   ├── README.md
    │   └── functions/
    │       ├── multi-provider-calendar.md
    │       ├── schedule-template-builder.md
    │       ├── template-application.md
    │       ├── calendar-views.md
    │       └── template-analytics.md
    │
    ├── appointment-management/
    │   ├── README.md
    │   └── functions/
    │       ├── appointment-booking.md
    │       ├── appointment-types.md
    │       ├── recurring-appointments.md
    │       ├── appointment-status.md
    │       └── scheduling-intelligence.md
    │
    ├── waitlist-recovery/
    │   ├── README.md
    │   └── functions/
    │       ├── waitlist-management.md
    │       ├── opening-notifications.md
    │       ├── failed-appointment-recovery.md
    │       └── cancellation-tracking.md
    │
    └── emergency-reminders/
        ├── README.md
        └── functions/
            ├── emergency-appointments.md
            ├── on-call-management.md
            ├── appointment-reminders.md
            └── confirmation-system.md
```

---

## Related Documentation

- [Staff Management](../staff-management/) - Provider schedules
- [Resources Management](../resources-management/) - Chair/room management
- [Practice Orchestration](../practice-orchestration/) - Patient flow
- [Patient Communications](../patient-communications/) - Messaging integration

---

## Status Legend

| Status | Icon | Description |
|--------|------|-------------|
| Planned | 📋 | Documented, not started |
| In Progress | 🔄 | Currently being implemented |
| Review | 👀 | Under review |
| Testing | 🧪 | In testing |
| Completed | ✅ | Fully implemented |
| Blocked | 🚫 | Blocked by dependency |

---

**Status**: 🔄 In Progress (Phase 2 Complete)
**Last Updated**: 2024-12-03
**Owner**: Development Team
